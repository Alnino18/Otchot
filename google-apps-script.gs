// ═══════════════════════════════════════════════════════════
// GOOGLE APPS SCRIPT — Отчет Продаж PWA
// Вставьте этот код в Google Apps Script вашей таблицы
// ═══════════════════════════════════════════════════════════

const SHEET_SALES  = 'НЕДЕЛЬНЫЙ ОТЧЕТ ПРОДАЖ';
const SHEET_RASXOD = 'НЕДЕЛЬНЫЙ ОТЧЕТ РАСХОДОВ';
const SHEET_KLIK   = 'КЛИК';

// ── Точка входа для POST запросов из PWA ──
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === 'syncAll') {
      syncSalesSheet(data);
      syncRasxodSheet(data);
      syncKlikSheet(data);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ok: true}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: err.message}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ── Точка входа для GET (тест) ──
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ok: true, message: 'Script работает!'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// ════════════════════════════════════════
// ЛИСТ 1: НЕДЕЛЬНЫЙ ОТЧЕТ ПРОДАЖ
// Структура как на скриншоте Image 3
// ════════════════════════════════════════
function syncSalesSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_SALES);
  if (!sheet) sheet = ss.insertSheet(SHEET_SALES);
  sheet.clearContents();

  const dates = data.dates; // массив строк "19.05.2026"
  const sellers = data.sellers; // [{id, name}]
  const salesData = data.sales;   // {dateKey: {sellerId: {palichki}}}
  const zpData = data.zp;         // {dateKey: {sellerId: {zarplata, pulkira}}}
  const klikData = data.klik;     // {dateKey: {sellerId: [...]}}
  const expData = data.exp;       // {dateKey: {zel, pak, ...}}
  const weekLabel = data.weekLabel; // "25.05.2026"

  // ── Заголовок ──
  sheet.getRange(1, 1).setValue('НЕДЕЛЬНЫЙ ОТЧЕТ ПРОДАЖ ' + weekLabel);
  sheet.getRange(1, 1, 1, 10).merge();
  styleHeader(sheet.getRange(1, 1), '#1a6b3a', '#ffffff', 14, true);

  // ── Строка 2: "Продажа" + даты ──
  const headerRow = ['Продажа'];
  dates.forEach(d => headerRow.push(d));
  headerRow.push('');
  headerRow.push('НЕДЕЛЯ ОБЩ');
  sheet.getRange(2, 1, 1, headerRow.length).setValues([headerRow]);
  styleHeader(sheet.getRange(2, 1, 1, headerRow.length), '#1a6b3a', '#ffffff', 10, true);

  // ── Строка 3: имена продавцов под датами ──
  const sellerRow = [''];
  dates.forEach(() => sellerRow.push('Таня'));
  sellerRow.push('');
  sellerRow.push('');
  sheet.getRange(3, 1, 1, sellerRow.length).setValues([sellerRow]);
  styleHeader(sheet.getRange(3, 1, 1, sellerRow.length), '#2d6a4f', '#ffffff', 9, false);

  let row = 4;

  // ── Палички (Нахт) ──
  const palRow = ['Палички'];
  let totPal = 0;
  dates.forEach(dk => {
    let daySum = 0;
    sellers.forEach(s => { daySum += Number(((salesData[dk]||{})[s.id]||{}).palichki||0); });
    palRow.push(daySum);
    totPal += daySum;
  });
  palRow.push('');
  palRow.push(totPal);
  sheet.getRange(row, 1, 1, palRow.length).setValues([palRow]);
  formatNumberRow(sheet, row, palRow.length);
  row++;

  // ── Клик ──
  const klRow = ['Клик'];
  let totKl = 0;
  dates.forEach(dk => {
    let daySum = 0;
    sellers.forEach(s => {
      const arr = ((klikData[dk]||{})[s.id])||[];
      daySum += arr.reduce((a,b) => a+(Number(b)||0), 0);
    });
    klRow.push(daySum);
    totKl += daySum;
  });
  klRow.push('');
  klRow.push(totKl);
  sheet.getRange(row, 1, 1, klRow.length).setValues([klRow]);
  formatNumberRow(sheet, row, klRow.length);
  row++;

  // ── Итого Касса ──
  const kassaRow = [''];
  let totKassa = 0;
  dates.forEach((dk, i) => {
    const v = (palRow[i+1]||0) + (klRow[i+1]||0);
    kassaRow.push(v);
    totKassa += v;
  });
  kassaRow.push('');
  kassaRow.push(totKassa);
  sheet.getRange(row, 1, 1, kassaRow.length).setValues([kassaRow]);
  formatNumberRow(sheet, row, kassaRow.length);
  row++;

  // ── РАСХОДИ заголовок ──
  sheet.getRange(row, 1).setValue('Расходы');
  sheet.getRange(row, 1, 1, dates.length+2).merge();
  styleHeader(sheet.getRange(row, 1), '#c0392b', '#ffffff', 10, true);
  row++;

  // ── Зарплата ──
  const zpRow = ['Зарплата'];
  let totZP = 0;
  dates.forEach(dk => {
    let daySum = 0;
    sellers.forEach(s => { daySum += Number(((zpData[dk]||{})[s.id]||{}).zarplata||0); });
    zpRow.push(daySum);
    totZP += daySum;
  });
  zpRow.push('');
  zpRow.push(totZP);
  sheet.getRange(row, 1, 1, zpRow.length).setValues([zpRow]);
  formatNumberRow(sheet, row, zpRow.length);
  row++;

  // ── Пулкира ──
  const pulRow = ['Йулкира'];
  let totPul = 0;
  dates.forEach(dk => {
    let daySum = 0;
    sellers.forEach(s => { daySum += Number(((zpData[dk]||{})[s.id]||{}).pulkira||0); });
    pulRow.push(daySum);
    totPul += daySum;
  });
  pulRow.push('');
  pulRow.push(totPul);
  sheet.getRange(row, 1, 1, pulRow.length).setValues([pulRow]);
  formatNumberRow(sheet, row, pulRow.length);
  row++;

  // ── Прочие расходы итого ──
  const miscRow = ['Прочие расходы'];
  let totMisc = 0;
  const EXP_FIELDS = ['zel','pak','obed','gel','ubork','sul'];
  dates.forEach(dk => {
    let daySum = 0;
    EXP_FIELDS.forEach(f => { daySum += Number((expData[dk]||{})[f]||0); });
    miscRow.push(daySum);
    totMisc += daySum;
  });
  miscRow.push('');
  miscRow.push(totMisc);
  sheet.getRange(row, 1, 1, miscRow.length).setValues([miscRow]);
  formatNumberRow(sheet, row, miscRow.length);
  row++;

  // ── Пустая строка ──
  row++;

  // ── Общая касса ──
  const obshRow = ['Общая касса'];
  let totObsh = 0;
  dates.forEach((dk, i) => {
    const v = (kassaRow[i+1]||0) + (miscRow[i+1]||0);
    obshRow.push(v);
    totObsh += v;
  });
  obshRow.push('');
  obshRow.push(totObsh);
  sheet.getRange(row, 1, 1, obshRow.length).setValues([obshRow]);
  formatNumberRow(sheet, row, obshRow.length);
  styleHeader(sheet.getRange(row, 1, 1, obshRow.length), '#1a6b3a', '#ffffff', 10, true);
  row++;

  // ── Нахт колди ──
  const nahtRow = ['Нахт колди'];
  let totNaht = 0;
  dates.forEach((dk, i) => {
    const pal = palRow[i+1]||0;
    const zp  = zpRow[i+1]||0;
    const pul = pulRow[i+1]||0;
    const v   = pal - (zp + pul);
    nahtRow.push(v);
    totNaht += v;
  });
  nahtRow.push('');
  nahtRow.push(totNaht);
  sheet.getRange(row, 1, 1, nahtRow.length).setValues([nahtRow]);
  formatNumberRow(sheet, row, nahtRow.length);
  styleHeader(sheet.getRange(row, 1, 1, nahtRow.length), '#155724', '#ffffff', 10, true);

  // ── Ширина колонок ──
  sheet.setColumnWidth(1, 160);
  for (let c = 2; c <= dates.length+1; c++) sheet.setColumnWidth(c, 90);
  sheet.setColumnWidth(dates.length+3, 100);
}

// ════════════════════════════════════════
// ЛИСТ 2: НЕДЕЛЬНЫЙ ОТЧЕТ РАСХОДОВ
// Структура как на скриншоте Image 1
// ════════════════════════════════════════
function syncRasxodSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_RASXOD);
  if (!sheet) sheet = ss.insertSheet(SHEET_RASXOD);
  sheet.clearContents();

  const dates = data.dates;
  const expData = data.exp;
  const weekLabel = data.weekLabel;
  const EXP_CATS = [
    ['Зелень/Соль/Соя', 'zel'],
    ['Пакет/Салфетки', 'pak'],
    ['Обед/Кофе/Хлеб', 'obed'],
    ['Гель/Азелит/Марля', 'gel'],
    ['Уборка/Лампочка/Ремонт', 'ubork'],
    ['Сул/Муз', 'sul'],
  ];

  // Заголовок
  sheet.getRange(1, 1).setValue('НЕДЕЛЬНЫЙ ОТЧЕТ РАСХОДОВ ' + weekLabel);
  sheet.getRange(1, 1, 1, dates.length+2).merge();
  styleHeader(sheet.getRange(1, 1), '#1a6b3a', '#ffffff', 14, true);

  // Строка 2: Расход + даты
  const hdr = ['Расход'].concat(dates).concat(['', 'НЕДЕЛЯ ОБЩ']);
  sheet.getRange(2, 1, 1, hdr.length).setValues([hdr]);
  styleHeader(sheet.getRange(2, 1, 1, hdr.length), '#1a6b3a', '#ffffff', 10, true);

  // Строка 3: Таня под датами (как в оригинале)
  const tRow = [''].concat(dates.map(() => 'Таня')).concat(['', '']);
  sheet.getRange(3, 1, 1, tRow.length).setValues([tRow]);
  styleHeader(sheet.getRange(3, 1, 1, tRow.length), '#2d6a4f', '#ffffff', 9, false);

  let row = 4;
  const dayTotals = new Array(dates.length).fill(0);

  EXP_CATS.forEach(([label, field]) => {
    const dataRow = [label];
    let rowTotal = 0;
    dates.forEach((dk, i) => {
      const v = Number((expData[dk]||{})[field]||0);
      dataRow.push(v);
      dayTotals[i] += v;
      rowTotal += v;
    });
    dataRow.push('');
    dataRow.push(rowTotal);
    sheet.getRange(row, 1, 1, dataRow.length).setValues([dataRow]);
    formatNumberRow(sheet, row, dataRow.length);
    row++;
  });

  // Итого строка
  const totRow = ['Сум/Муз'].concat(dayTotals).concat(['', dayTotals.reduce((a,b)=>a+b,0)]);
  sheet.getRange(row, 1, 1, totRow.length).setValues([totRow]);
  formatNumberRow(sheet, row, totRow.length);
  styleHeader(sheet.getRange(row, 1, 1, totRow.length), '#1a6b3a', '#ffffff', 10, true);

  sheet.setColumnWidth(1, 180);
  for (let c = 2; c <= dates.length+1; c++) sheet.setColumnWidth(c, 90);
  sheet.setColumnWidth(dates.length+3, 100);
}

// ════════════════════════════════════════
// ЛИСТ 3: КЛИК (как Image 2)
// ════════════════════════════════════════
function syncKlikSheet(data) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_KLIK);
  if (!sheet) sheet = ss.insertSheet(SHEET_KLIK);
  sheet.clearContents();

  const dates = data.dates;
  const klikData = data.klik;
  const sellers = data.sellers;

  // Заголовок с датами
  const hdr = [''].concat(dates);
  sheet.getRange(1, 1, 1, hdr.length).setValues([hdr]);
  styleHeader(sheet.getRange(1, 1, 1, hdr.length), '#1a6b3a', '#ffffff', 10, true);

  let row = 2;
  const dayTotals = new Array(dates.length).fill(0);
  const allDayRows = {}; // dateKey -> all values

  // Собрать все значения по датам
  dates.forEach(dk => { allDayRows[dk] = []; });
  sellers.forEach(s => {
    dates.forEach(dk => {
      const arr = ((klikData[dk]||{})[s.id])||[];
      arr.forEach(v => { if(v>0) allDayRows[dk].push(Number(v)); });
    });
  });

  // Найти макс количество строк
  let maxRows = 1;
  dates.forEach(dk => { if(allDayRows[dk].length > maxRows) maxRows = allDayRows[dk].length; });

  for (let r = 0; r < maxRows; r++) {
    const dataRow = [''];
    dates.forEach(dk => {
      const v = allDayRows[dk][r] || '';
      dataRow.push(v);
      if(v) dayTotals[dates.indexOf(dk)] += Number(v);
    });
    sheet.getRange(row, 1, 1, dataRow.length).setValues([dataRow]);
    if(r < maxRows-1) formatNumberRow(sheet, row, dataRow.length);
    row++;
  }

  // Пустая строка
  row++;

  // Итого
  const totRow = ['Итого'].concat(dayTotals);
  sheet.getRange(row, 1, 1, totRow.length).setValues([totRow]);
  formatNumberRow(sheet, row, totRow.length);
  styleHeader(sheet.getRange(row, 1, 1, totRow.length), '#1a6b3a', '#ffffff', 10, true);

  for (let c = 1; c <= dates.length+1; c++) sheet.setColumnWidth(c, 90);
}

// ════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════
function styleHeader(range, bg, fg, fontSize, bold) {
  range.setBackground(bg)
       .setFontColor(fg)
       .setFontSize(fontSize)
       .setFontWeight(bold ? 'bold' : 'normal')
       .setHorizontalAlignment('center');
}

function formatNumberRow(sheet, row, len) {
  for (let c = 2; c <= len; c++) {
    const cell = sheet.getRange(row, c);
    const v = cell.getValue();
    if (typeof v === 'number' && v !== 0) {
      cell.setNumberFormat('#,##0');
    }
  }
  sheet.getRange(row, 1).setFontSize(10);
}
