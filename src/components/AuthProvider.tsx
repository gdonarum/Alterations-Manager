'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { onAuthStateChanged, signInWithPopup, signOut, User, GoogleAuthProvider } from 'firebase/auth'
import { useRouter } from 'next/navigation'
import { auth, googleProvider } from '@/lib/firebase'

interface AuthContextValue {
  user: User | null
  googleAccessToken: string | null
  loading: boolean
  signIn: () => Promise<void>
  logOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  googleAccessToken: null,
  loading: true,
  signIn: async () => {},
  logOut: async () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const signIn = async () => {
    if (!auth) return
    const result = await signInWithPopup(auth, googleProvider)
    const credential = GoogleAuthProvider.credentialFromResult(result)
    const accessToken = credential?.accessToken || ''
    setGoogleAccessToken(accessToken)

    const idToken = await result.user.getIdToken()
    await fetch('/api/auth/session', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, googleAccessToken: accessToken }),
    })

    router.push('/')
    router.refresh()
  }

  const logOut = async () => {
    if (auth) await signOut(auth)
    await fetch('/api/auth/logout', { method: 'POST' })
    setGoogleAccessToken(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ user, googleAccessToken, loading, signIn, logOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
