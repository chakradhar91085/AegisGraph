import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User
} from 'firebase/auth'
import {
  doc, setDoc, getDoc,
  query, collection, where, getDocs,
  serverTimestamp
} from 'firebase/firestore'
import { auth, db, googleProvider } from './firebase'

/** Sign up with email + password, store user doc in Firestore */
export async function signUpWithEmail(
  email: string, password: string, username: string, role: string
) {
  const cred = await createUserWithEmailAndPassword(auth, email, password)
  await setDoc(doc(db, 'users', cred.user.uid), {
    uid: cred.user.uid, username, email, role, createdAt: serverTimestamp()
  })
  return cred.user
}

/** Sign in — accepts email OR username */
export async function signInWithEmail(emailOrUsername: string, password: string) {
  let email = emailOrUsername
  if (!emailOrUsername.includes('@')) {
    const snap = await getDocs(
      query(collection(db, 'users'), where('username', '==', emailOrUsername))
    )
    if (snap.empty) throw new Error('auth/user-not-found')
    email = snap.docs[0].data().email
  }
  const cred = await signInWithEmailAndPassword(auth, email, password)
  return cred.user
}

/** Google sign-in — upserts Firestore doc with default Employee role */
export async function signInWithGoogle() {
  const cred = await signInWithPopup(auth, googleProvider)
  const ref = doc(db, 'users', cred.user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: cred.user.uid,
      username: cred.user.displayName || cred.user.email?.split('@')[0] || 'user',
      email: cred.user.email,
      role: 'Employee',
      createdAt: serverTimestamp()
    })
  }
  return cred.user
}

/** Send password reset email */
export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email)
}

/** Sign out */
export async function signOutUser() {
  await signOut(auth)
}

/** Auth state listener */
export function onAuthChange(cb: (user: User | null) => void) {
  return onAuthStateChanged(auth, cb)
}

/** Get Firebase ID token for backend Authorization header */
export async function getIdToken(): Promise<string | null> {
  return auth.currentUser ? auth.currentUser.getIdToken() : null
}

/** Fetch username from Firestore */
export async function getUsername(uid: string): Promise<string> {
  const snap = await getDoc(doc(db, 'users', uid))
  if (snap.exists()) return snap.data().username
  return auth.currentUser?.displayName || 'User'
}

/** Fetch role from Firestore */
export async function getUserRole(uid: string): Promise<string> {
  const snap = await getDoc(doc(db, 'users', uid))
  return snap.exists() ? snap.data().role : 'Employee'
}

/** Map Firebase error codes to user-friendly messages */
export function parseFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/email-already-in-use': 'This email is already registered.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Try again later.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
    'auth/network-request-failed': 'Network error. Check your connection.',
    'auth/invalid-credential': 'Invalid credentials. Please try again.',
  }
  return map[code] || 'Something went wrong. Please try again.'
}
