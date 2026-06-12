# QuizZy 🎯

Platform quiz kompetisi & event publik berbasis real-time.

## Tech Stack
- **Frontend**: Vue.js 3 + Vite + Tailwind CSS
- **Backend**: Firebase (Realtime DB + Auth + Storage)
- **Deploy**: Netlify

## Setup

### 1. Clone & Install
```bash
npm install
```

### 2. Konfigurasi Firebase
Edit `src/firebase.js` dan isi dengan config Firebase project kamu:
```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  databaseURL: "...",
  ...
}
```

### 3. Enable Firebase Services
Di Firebase Console:
- Authentication: enable **Email/Password** dan **Google**
- Realtime Database: buat database (Asia Southeast)
- Apply rules dari `firebase.rules.json`

### 4. Buat Superadmin Pertama
Buat user di Firebase Auth manual (email + password), lalu tambahkan ke Realtime DB:
```
/users/{uid}
  name: "Superadmin"
  email: "admin@example.com"
  role: "superadmin"
  createdAt: <timestamp>
```

### 5. Run Dev
```bash
npm run dev
```

### 6. Deploy ke Netlify
- Connect repo GitHub ke Netlify
- Build command: `npm run build`
- Publish directory: `dist`

## Struktur Folder
```
src/
├── firebase.js          # Config Firebase
├── router/              # Vue Router
├── stores/              # Pinia stores (auth, quiz)
├── composables/         # useAntiCheat, useTimer, useResult, useExport
├── utils/               # helpers
├── components/
│   ├── ui/              # AppButton, AppInput, AppModal, dll
│   └── layout/          # PesertaLayout, AdminLayout
└── views/
    ├── public/          # HomePage, LeaderboardPage, VerifyPage
    ├── peserta/         # Login, Register, Dashboard, Quiz, dll
    └── admin/           # AdminDashboard, Events, Questions, dll
```
