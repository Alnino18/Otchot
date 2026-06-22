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
