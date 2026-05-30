// ═══════════════════════════════════════════════════════════
// GOOGLE APPS SCRIPT — Отчет Продаж PWA
// Вставьте этот код в Apps Script вашей Google Таблицы
// Развернуть → Веб-приложение → Доступ: Все
// ═══════════════════════════════════════════════════════════

const SHEET_SALES  = 'ПРОДАЖИ';
const SHEET_RASXOD = 'РАСХОДЫ';
const SHEET_KLIK   = 'КЛИК';
const SHEET_DB     = '_DB'; // скрытый лист для хранения данных

// ── GET: восстановление данных в PWA ──
function doGet(e) {
  const action = e.parameter.action || '';
  if (action === 'getData') {
    const data = loadFromDB();
    return json({ok: true, data});
  }
  return json({ok: true, message: 'Скрипт работает!'});
}

// ── POST: сохранение из PWA ──
function doPost(e) {
  try {
    const raw = e.postData ? e.postData.contents : '{}';
    const data = JSON.parse(raw);
    if (data.action === 'syncAll') {
      saveToDBSheet(data);   // сохранить сырые данные (для восстановления)
      syncSalesSheet(data);  // красивая таблица продаж
      syncRasxodSheet(data); // таблица расходов
      syncKlikSheet(data);   // таблица клик
    }
    return json({ok: true});
  } catch(err) {
    return json({ok: false, error: err.toString()});
  }
}

// ── Сохранить сырые данные на лист _DB ──
function saveToDBSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_DB);
    sheet.hideSheet();
  }
  sheet.clearContents();
  // Сохраняем как JSON в ячейку A1
  sheet.getRange(1,1).setValue(JSON.stringify({
    sales: data.sales || {},
    zp:    data.zp    || {},
    klik:  data.klik  || {},
    exp:   data.exp   || {},
    saved: new Date().toISOString()
  }));
}

// ── Загрузить данные из _DB ──
function loadFromDB() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_DB);
  if (!sheet) return {};
  try {
    return JSON.parse(sheet.getRange(1,1).getValue() || '{}');
  } catch(e) { return {}; }
}

// ════════════════════════════════════════
// ЛИСТ: ПРОДАЖИ
// ════════════════════════════════════════
function syncSalesSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_SALES);
  if (!sh) sh = ss.insertSheet(SHEET_SALES);
  sh.clearContents(); sh.clearFormats();

  const dates = data.dates || [];
  const dl    = data.dateLabels || dates;
  const sel   = data.sellers || [];
  const S = data.sales || {}, Z = data.zp || {}, K = data.klik || {}, E = data.exp || {};
  const EF = ['zel','pak','obed','gel','ubork','sul','prochie'];

  let r = 1;
  // Заголовок
  row(sh, r, ['НЕДЕЛЬНЫЙ ОТЧЕТ ПРОДАЖ ' + (data.weekLabel||'')], '#1a6b3a','#fff',13,true);
  sh.getRange(r,1,1,dates.length+2).merge(); r++;

  // Шапка дат
  row(sh, r, ['Продажа'].concat(dl).concat(['','ОБЩ']), '#1a6b3a','#fff',9,true); r++;

  // По каждому продавцу
  let totPal=0, totKl=0, totZP=0, totPul=0;
  sel.forEach(s => {
    const pv = dates.map(dk => n(((S[dk]||{})[s.id]||{}).nalichka));
    const kv = dates.map(dk => { const a=((K[dk]||{})[s.id])||[]; return a.reduce((x,y)=>x+n(y),0); });
    const tp = sum(pv), tk = sum(kv);
    totPal+=tp; totKl+=tk;
    row(sh, r, [s.name+' Наличка'].concat(pv).concat(['',tp]), null,null,10,false);
    fmtNums(sh,r,dates.length+2); r++;
    row(sh, r, ['  Клик'].concat(kv).concat(['',tk]), null,null,10,false);
    fmtNums(sh,r,dates.length+2); r++;
  });
  // Итого касса
  const kassaDay = dates.map(dk => {
    let v=0; sel.forEach(s=>{
      v+=n(((S[dk]||{})[s.id]||{}).nalichka);
      ((K[dk]||{})[s.id]||[]).forEach(x=>v+=n(x));
    }); return v;
  });
  row(sh, r, ['КАССА'].concat(kassaDay).concat(['',sum(kassaDay)]), '#e8f5e9','#000',10,true);
  fmtNums(sh,r,dates.length+2); r++;

  // Расходы
  cell(sh,r,1,'Расходы','#c0392b','#fff',10,true,'center');
  sh.getRange(r,1,1,dates.length+2).merge(); r++;

  sel.forEach(s => {
    const zv = dates.map(dk => n(((Z[dk]||{})[s.id]||{}).zarplata));
    const pv = dates.map(dk => n(((Z[dk]||{})[s.id]||{}).pulkira));
    const tz=sum(zv),tp=sum(pv);
    totZP+=tz; totPul+=tp;
    row(sh,r,[s.name+' ЗП'].concat(zv).concat(['',tz]),null,null,10,false);
    fmtNums(sh,r,dates.length+2); r++;
    row(sh,r,['  Йулкира'].concat(pv).concat(['',tp]),null,null,10,false);
    fmtNums(sh,r,dates.length+2); r++;
  });

  // Прочие расходы
  let totMisc=0;
  const miscDay=new Array(dates.length).fill(0);
  EF.forEach(f => {
    dates.forEach((dk,i)=>{ const v=n((E[dk]||{})[f]); miscDay[i]+=v; totMisc+=v; });
  });
  row(sh,r,['Прочие расходы'].concat(miscDay).concat(['',totMisc]),null,null,10,false);
  fmtNums(sh,r,dates.length+2); r++;

  r++; // пустая

  // Общая касса
  const obshDay=kassaDay.map((v,i)=>v+miscDay[i]);
  row(sh,r,['Общая касса'].concat(obshDay).concat(['',sum(obshDay)]),'#1a6b3a','#fff',10,true);
  fmtNums(sh,r,dates.length+2); r++;

  // Наличка колди
  const palDay=dates.map(dk=>{let v=0;sel.forEach(s=>v+=n(((S[dk]||{})[s.id]||{}).nalichka));return v;});
  const zpDay=dates.map(dk=>{let v=0;sel.forEach(s=>v+=n(((Z[dk]||{})[s.id]||{}).zarplata)+n(((Z[dk]||{})[s.id]||{}).pulkira));return v;});
  const nahtDay=palDay.map((v,i)=>v-zpDay[i]);
  row(sh,r,['Наличка колди'].concat(nahtDay).concat(['',sum(nahtDay)]),'#155724','#fff',10,true);
  fmtNums(sh,r,dates.length+2);

  // Ширина
  sh.setColumnWidth(1,150);
  for(let c=2;c<=dates.length+1;c++) sh.setColumnWidth(c,90);
  sh.setColumnWidth(dates.length+3,110);
}

// ════════════════════════════════════════
// ЛИСТ: РАСХОДЫ
// ════════════════════════════════════════
function syncRasxodSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_RASXOD);
  if (!sh) sh = ss.insertSheet(SHEET_RASXOD);
  sh.clearContents(); sh.clearFormats();

  const dates=data.dates||[], dl=data.dateLabels||dates, E=data.exp||{};
  const CATS=[['Зелень/Соль/Соя','zel'],['Пакет/Салфетки','pak'],['Обед/Кофе/Хлеб','obed'],
    ['Гель/Азелит/Марля','gel'],['Уборка/Лампочка/Рем','ubork'],['Сул/Муз','sul'],['Прочие','prochie']];

  let r=1;
  row(sh,r,['НЕДЕЛЬНЫЙ ОТЧЕТ РАСХОДОВ '+(data.weekLabel||'')],'#1a6b3a','#fff',13,true);
  sh.getRange(r,1,1,dates.length+2).merge(); r++;
  row(sh,r,['Расход'].concat(dl).concat(['','ОБЩ']),'#1a6b3a','#fff',9,true); r++;

  const dayTot=new Array(dates.length).fill(0);
  CATS.forEach(([label,field])=>{
    const vals=dates.map((dk,i)=>{const v=n((E[dk]||{})[field]);dayTot[i]+=v;return v;});
    row(sh,r,[label].concat(vals).concat(['',sum(vals)]),null,null,10,false);
    fmtNums(sh,r,dates.length+2); r++;
  });
  row(sh,r,['ИТОГО'].concat(dayTot).concat(['',sum(dayTot)]),'#1a6b3a','#fff',10,true);
  fmtNums(sh,r,dates.length+2);

  sh.setColumnWidth(1,180);
  for(let c=2;c<=dates.length+1;c++) sh.setColumnWidth(c,90);
  sh.setColumnWidth(dates.length+3,110);
}

// ════════════════════════════════════════
// ЛИСТ: КЛИК
// ════════════════════════════════════════
function syncKlikSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_KLIK);
  if (!sh) sh = ss.insertSheet(SHEET_KLIK);
  sh.clearContents(); sh.clearFormats();

  const dates=data.dates||[], dl=data.dateLabels||dates;
  const sel=data.sellers||[], K=data.klik||{};

  let r=1;
  row(sh,r,[''].concat(dl),'#1a6b3a','#fff',9,true); r++;

  const byDate={};
  dates.forEach(dk=>byDate[dk]=[]);
  sel.forEach(s=>{
    dates.forEach(dk=>{
      ((K[dk]||{})[s.id]||[]).forEach(v=>{if(n(v)>0)byDate[dk].push(n(v));});
    });
  });

  let maxR=1;
  dates.forEach(dk=>{if(byDate[dk].length>maxR)maxR=byDate[dk].length;});
  const dayTot=new Array(dates.length).fill(0);

  for(let i=0;i<maxR;i++){
    const vals=[''];
    dates.forEach((dk,di)=>{const v=byDate[dk][i]||'';if(v)dayTot[di]+=v;vals.push(v);});
    sh.getRange(r,1,1,vals.length).setValues([vals]); r++;
  }
  r++;
  row(sh,r,['ИТОГО'].concat(dayTot),'#1a6b3a','#fff',10,true);
  fmtNums(sh,r,dates.length+1);
  for(let c=1;c<=dates.length+1;c++) sh.setColumnWidth(c,90);
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function n(v){return Number(v)||0;}
function sum(arr){return arr.reduce((a,b)=>a+b,0);}
function json(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);}

function cell(sh,r,c,val,bg,fg,sz,bold,align){
  const cl=sh.getRange(r,c);
  cl.setValue(val);
  if(bg)cl.setBackground(bg);
  if(fg)cl.setFontColor(fg);
  if(sz)cl.setFontSize(sz);
  cl.setFontWeight(bold?'bold':'normal');
  if(align)cl.setHorizontalAlignment(align);
}

function row(sh,r,vals,bg,fg,sz,bold){
  const range=sh.getRange(r,1,1,vals.length);
  range.setValues([vals]);
  if(bg)range.setBackground(bg);
  if(fg)range.setFontColor(fg);
  if(sz)range.setFontSize(sz);
  range.setFontWeight(bold?'bold':'normal');
}

function fmtNums(sh,r,last){
  for(let c=2;c<=last;c++){
    const cl=sh.getRange(r,c);
    const v=cl.getValue();
    if(typeof v==='number'&&v!==0){
      cl.setNumberFormat('#,##0');
      cl.setHorizontalAlignment('right');
    }
  }
}
