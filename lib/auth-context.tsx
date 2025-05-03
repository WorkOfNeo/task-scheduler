"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { 
  User as FirebaseUser,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useToast } from '@/components/ui/use-toast'
import { useRouter } from 'next/navigation'
import { User, createUserProfile, getUserProfile, updateUserLastLogin } from '@/lib/firebase-service'
import Cookies from 'js-cookie'

interface AuthContextType {
  user: FirebaseUser | null
  userProfile: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signInWithGoogle: () => Promise<User>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null)
  const [userProfile, setUserProfile] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)
      if (user) {
        try {
          // Get the ID token and set it as a cookie
          const token = await user.getIdToken()
          Cookies.set('auth-token', token, { expires: 7 }) // Token expires in 7 days

          let profile = await getUserProfile(user.uid)
          if (!profile) {
            profile = await createUserProfile(user.uid, user.email!, user.displayName || 'User')
          }
          setUserProfile(profile)
          await updateUserLastLogin(user.uid)
        } catch (error) {
          console.error('Error loading user profile:', error)
          toast({
            title: "Error",
            description: "Failed to load user profile",
            variant: "destructive"
          })
        }
      } else {
        setUserProfile(null)
        Cookies.remove('auth-token')
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      let profile = await getUserProfile(userCredential.user.uid)
      if (!profile) {
        profile = await createUserProfile(userCredential.user.uid, email, userCredential.user.displayName || 'User')
      }
      await updateUserLastLogin(userCredential.user.uid)
      return profile
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
      throw error
    }
  }

  const signUp = async (email: string, password: string, name: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      await createUserProfile(userCredential.user.uid, email, name)
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
      throw error
    }
  }

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      let profile = await getUserProfile(userCredential.user.uid)
      
      if (!profile) {
        profile = await createUserProfile(
          userCredential.user.uid,
          userCredential.user.email!,
          userCredential.user.displayName || 'User'
        )
      }
      await updateUserLastLogin(userCredential.user.uid)
      return profile
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        toast({
          title: "Error",
          description: error.message,
          variant: "destructive"
        })
      }
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      Cookies.remove('auth-token')
      router.push('/login')
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
      throw error
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      userProfile,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthContext() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider')
  }
  return context
} 