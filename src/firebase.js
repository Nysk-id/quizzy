import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'

// TODO: Ganti dengan konfigurasi Firebase project kamu
// Cara: Firebase Console → Project Settings → Your apps → Web app → SDK setup
const firebaseConfig = {
  apiKey: "AIzaSyBwLvIUilP03LGJcA1pAFKDFRMvBYgP2Us",
  authDomain: "quizzy-izz.firebaseapp.com",
  projectId: "quizzy-izz",
  storageBucket: "quizzy-izz.firebasestorage.app",
  messagingSenderId: "303070546788",
  appId: "1:303070546788:web:444e965f85ff734ca34871",
  measurementId: "G-VGGTCFZ2H9"
};


const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getDatabase(app)
export const storage = getStorage(app)
export default app
