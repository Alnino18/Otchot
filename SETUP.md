# Ҳисобот PWA — Firebase версияси

## Нима ўзгарди

| Эски | Янги |
|------|------|
| Google Sheets | Firebase Firestore |
| localStorage | Firestore (real-time, барча қурилма) |
| Логинsiz | Телефон + парол (Firebase Auth) |
| Ҳамма барчасини кўра/ўзгартира олади | **Admin** / **Seller** роллари |
| Қўлда синхрон | Автоматик, реал вақт |

## Роллар

| | Admin | Seller |
|---|---|---|
| Маълумот кириш | ✅ | ✅ |
| Кун / Ҳафта / Ой | ✅ | ✅ |
| Чиқиш (logout) | ✅ | ✅ |
| Созламалар | ✅ | ❌ |
| Экспорт (Excel/CSV) | ✅ | ❌ |
| Сотувчилар бошқаруви | ✅ | ❌ |
| Маълумот ўчириш | ✅ | ❌ |
| Эски маълумот импорт | ✅ | ❌ |

## Ўрнатиш

### 1. Firestore'ни ёқиш

1. https://console.firebase.google.com → **otchot-3e28b**
2. **Firestore Database** → **Create database** → Production mode
3. Регион: `europe-west3`

### 2. Хавфсизлик қоидалари

Firestore → **Rules** табига қуйидагини қўйинг:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /company/main {
      allow read, write: if request.auth != null;
    }
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 3. Authentication'ни ёқиш

**Authentication** → **Sign-in method** → **Email/Password** → Enable

### 4. Ходимлар учун логин яратиш

**Authentication** → **Users** → **Add user**

- Email: `998901234567@otchot.local` (телефон + @otchot.local)
- Password: исталган (≥6 белги)

### 5. Ролларни белгилаш (МУҲИМ)

Ҳар бир ходим учун **Firestore** → **company** → **+ Start collection** → `users`

Ҳар бир ходим учун **Add document**:
- **Document ID**: Firebase Auth'дан олинган `UID` (Authentication → Users → нусхалаб олинг)
- **Fields**:
  ```
  role  → string → "admin"   (сиз учун)
  role  → string → "seller"  (сотувчилар учун)
  name  → string → "Tanya"   (номи)
  ```

### 6. Файлларни жойлаштириш

`index.html`, `manifest.json`, `sw.js`, `icon-*.png` — бир папкада GitHub Pages, Netlify ёки Firebase Hosting'га юкланг.

## Эски маълумотларни кўчириш

1. **Эски** иловада: Созламалар → **"JSON юклаб олиш"** → файл сақлаш
2. **Янги** иловада (admin): Созламалар → **"JSON файлдан Firebase га импорт"** → ўша файлни юклаш

## Хавфсизлик эслатмаси

`apiKey` кодда кўринади — бу Firebase'да нормал. Хавфсизлик Firestore Rules орқали: фақат login қилган ходим ёза олади.

## Google Sheets'га автоматик юбориш (Apps Script'сиз, тўғридан-тўғри API)

Илова энди Google Sheets'га **Apps Script орқали эмас**, балки браузердан тўғридан-тўғри (OAuth орқали) ёзади. Бир марталик созлаш керак:

### 1. Google Cloud'да лойиҳа яратиш

1. https://console.cloud.google.com → янги лойиҳа яратинг (ёки мавжудини танланг)
2. **APIs & Services → Library** → "Google Sheets API" ни топиб **Enable** қилинг

### 2. OAuth Client ID яратиш

1. **APIs & Services → Credentials → Create Credentials → OAuth client ID**
2. Агар сўралса, аввал **OAuth consent screen**'ни тўлдиринг (External, App name — исталганини ёзинг, ўзингизнинг email'ингизни қўшинг)
3. Application type: **Web application**
4. **Authorized JavaScript origins** — иловангиз жойлашган манзилни қўшинг, масалан:
   - `https://sizning-domeningiz.com`
   - Локал синов учун: `http://localhost:5500` (қандай портда очсангиз шуни)
5. **Create** ни босинг — сизга `xxxxx.apps.googleusercontent.com` кўринишидаги **Client ID** берилади

### 3. Жадвал (Spreadsheet) ID'сини олиш

Google Sheets'да керакли жадвални очинг, URL'га қаранг:
```
https://docs.google.com/spreadsheets/d/BU_YERDAGI_QISM/edit
```
`BU_YERDAGI_QISM` — сизнинг `SPREADSHEET_ID`'ингиз.

**МУҲИМ:** Бу жадвални созлашда киритган Google ҳисобингиз (масалан gmail) билан **очиб таҳрирлаш ҳуқуқига эга бўлиши шарт** — чунки OAuth орқали ким уланса, ўша фойдаланувчининг ҳуқуқи билан ёзилади.

### 4. `index.html`'га қўйиш

`index.html` файлида қуйидаги қаторларни топиб, ўз қийматларингизни қўйинг:

```js
var GOOGLE_CLIENT_ID = 'СИЗНИНГ_CLIENT_ID.apps.googleusercontent.com';
var SPREADSHEET_ID   = 'СИЗНИНГ_SPREADSHEET_ID';
```

### 5. Фойдаланиш

1. Иловада (admin сифатида) **Ой** саҳифасидаги **Экспорт** картасига ўтинг
2. Аввал **"Google Sheets'га улаш"** тугмасини босинг — Google ойнаси очилади, ҳисобингизни танлаб рухсат беринг (бу фақат биринчи марта ёки токен эскирганда керак)
3. Кейин **"Google Sheets га юбориш"** тугмасини боссангиз — жорий ҳафта маълумоти **ПРОДАЖИ**, **РАСХОДЫ**, **КЛИК** варақларига форматланган ҳолда ёзилади
4. Хато бўлса (масалан рухсат йўқ, жадвал топилмади) — энди аниқ хато хабари чиқади, олдингидек "кўр" эмас

### Эслатма

- Токен (рухсат) тахминан 1 соат амал қилади. Муддати ўтса, "Google Sheets'га юбориш" тугмаси хато берса — "Google Sheets'га улаш" тугмасини қайта босинг.
- Бу усул эски `google-apps-script.gs`'ни бутунлай алмаштиради — уни энди Apps Script'га қўйишингиз шарт эмас (файл заҳира сифатида лойиҳада қолди).
