import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged
} from 'firebase/auth'
import { ref as dbRef, set, get, update } from 'firebase/database'
import { auth, db } from '@/firebase'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const profile = ref(null)
  const loading = ref(true)
  let initResolve = null
  const initPromise = new Promise(r => { initResolve = r })

  const isAdmin = computed(() => ['admin', 'superadmin', 'viewer'].includes(profile.value?.role))
  const isSuperAdmin = computed(() => profile.value?.role === 'superadmin')
  const isViewer = computed(() => profile.value?.role === 'viewer')
  const isPeserta = computed(() => profile.value?.role === 'peserta')
  const displayName = computed(() => profile.value?.name || user.value?.displayName || 'Pengguna')

  async function fetchProfile(uid) {
    const snap = await get(dbRef(db, 'users/' + uid))
    if (snap.exists()) { profile.value = snap.val(); return snap.val() }
    return null
  }

  async function waitForInit() { return initPromise }

  async function loginWithNIM(nim, password) {
    const email = nim.trim() + '@quizzy.internal'
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await fetchProfile(cred.user.uid)
    return cred.user
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    const existingProfile = await fetchProfile(cred.user.uid)
    if (!existingProfile) { user.value = cred.user; return { user: cred.user, needsProfile: true } }
    return { user: cred.user, needsProfile: false }
  }

  async function registerWithNIM({ nim, name, prodi, password }) {
    const nimSnap = await get(dbRef(db, 'nim_index/' + nim.trim()))
    if (nimSnap.exists()) throw new Error('NIM sudah terdaftar.')
    const email = nim.trim() + '@quizzy.internal'
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    const userData = {
      uid: cred.user.uid, nim: nim.trim(), name: name.trim(), prodi: prodi.trim(),
      role: 'peserta', provider: 'nim', createdAt: Date.now(), quizHistory: {}
    }
    await Promise.all([
      set(dbRef(db, 'users/' + cred.user.uid), userData),
      set(dbRef(db, 'nim_index/' + nim.trim()), cred.user.uid)
    ])
    profile.value = userData
    return cred.user
  }

  async function completeGoogleProfile({ nim, name, prodi }) {
    if (!user.value) throw new Error('Tidak ada user aktif.')
    const nimSnap = await get(dbRef(db, 'nim_index/' + nim.trim()))
    if (nimSnap.exists()) throw new Error('NIM sudah terdaftar.')
    const userData = {
      uid: user.value.uid, nim: nim.trim(), name: name.trim(), prodi: prodi.trim(),
      role: 'peserta', provider: 'google', email: user.value.email,
      photoURL: user.value.photoURL || null, createdAt: Date.now(), quizHistory: {}
    }
    await Promise.all([
      set(dbRef(db, 'users/' + user.value.uid), userData),
      set(dbRef(db, 'nim_index/' + nim.trim()), user.value.uid)
    ])
    profile.value = userData
  }

  async function loginAdmin(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    const p = await fetchProfile(cred.user.uid)
    if (!p || !['admin', 'superadmin', 'viewer'].includes(p.role)) {
      await signOut(auth); throw new Error('Akun ini bukan admin.')
    }
    return cred.user
  }

  async function logout() {
    await signOut(auth); user.value = null; profile.value = null
  }

  async function updateProfile(data) {
    if (!user.value) return
    await update(dbRef(db, 'users/' + user.value.uid), data)
    profile.value = { ...profile.value, ...data }
  }

  onAuthStateChanged(auth, async (firebaseUser) => {
    user.value = firebaseUser
    if (firebaseUser) await fetchProfile(firebaseUser.uid)
    else profile.value = null
    loading.value = false
    initResolve()
  })

  return {
    user, profile, loading, isAdmin, isSuperAdmin, isViewer, isPeserta, displayName,
    loginWithNIM, loginWithGoogle, registerWithNIM, completeGoogleProfile,
    loginAdmin, logout, updateProfile, fetchProfile, waitForInit
  }
})
