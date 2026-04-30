import { initializeApp, getApps } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyCqEp5kcaUe_V5FGr07AeUyMtwBRQlKQhE",
  authDomain: "aegisgraph-fddd3.firebaseapp.com",
  projectId: "aegisgraph-fddd3",
  storageBucket: "aegisgraph-fddd3.firebasestorage.app",
  messagingSenderId: "619912968002",
  appId: "1:619912968002:web:ae2afa5b1680df8f983adb",
  measurementId: "G-5FL76PQJT1"
}

// Prevent re-initialization in Next.js hot reload
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const db = getFirestore(app)
export const googleProvider = new GoogleAuthProvider()
