import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '../types'
import { supabase } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, fullName: string, username: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>
  updateProfile: (data: Partial<User>) => Promise<{ success: boolean; error?: string }>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Generate unique referral code
function generateReferralCode(username: string): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  return `${username.substring(0, 3)}${timestamp}${random}`.toUpperCase()
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for admin users
  const isAdmin = user?.email === 'admin@referralchain.com' || user?.email === 'abulaith87@gmail.com'

  useEffect(() => {
    // Check for stored user in localStorage (for persistence)
    const storedUser = localStorage.getItem('referralchain_user')
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        console.error('Failed to parse stored user:', e)
      }
    }
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Try to fetch user from Supabase
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single()

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows found
        throw error
      }

      if (data) {
        // User exists in database
        localStorage.setItem('referralchain_user', JSON.stringify(data))
        setUser(data)
        console.log('✅ User signed in from database:', email)
        return { success: true }
      } else {
        // User not found - create new user
        const newUser: User = {
          id: 'user_' + Date.now(),
          email: email,
          full_name: email.split('@')[0],
          username: email.split('@')[0],
          referral_code: generateReferralCode(email.split('@')[0]),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Try to insert into Supabase
        const { error: insertError } = await supabase.from('users').insert([{
          id: newUser.id,
          email: newUser.email,
          full_name: newUser.full_name,
          username: newUser.username,
          referral_code: newUser.referral_code,
          created_at: newUser.created_at,
          updated_at: newUser.updated_at,
        }])

        if (insertError) {
          console.warn('Failed to insert user into database, using local user:', insertError)
        }

        localStorage.setItem('referralchain_user', JSON.stringify(newUser))
        setUser(newUser)
        console.log('✅ New user created:', email)
        return { success: true }
      }
    } catch (err) {
      console.error('Sign in error:', err)
      return { success: false, error: 'حدث خطأ أثناء تسجيل الدخول' }
    }
  }

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    username: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single()

      if (existingUser) {
        return { success: false, error: 'البريد الإلكتروني مسجل بالفعل' }
      }

      const newUser: User = {
        id: 'user_' + Date.now(),
        email,
        full_name: fullName,
        username,
        referral_code: generateReferralCode(username),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      // Try to save to Supabase
      const { error } = await supabase.from('users').insert([{
        id: newUser.id,
        email: newUser.email,
        full_name: newUser.full_name,
        username: newUser.username,
        referral_code: newUser.referral_code,
        created_at: newUser.created_at,
        updated_at: newUser.updated_at,
      }])

      if (error) {
        console.warn('Failed to insert user into database, using local user:', error)
      }

      // Save locally
      localStorage.setItem('referralchain_user', JSON.stringify(newUser))
      setUser(newUser)
      console.log('✅ User registered successfully:', email)
      return { success: true }
    } catch (err) {
      console.error('Sign up error:', err)
      return { success: false, error: 'حدث خطأ أثناء إنشاء الحساب' }
    }
  }

  const signOut = async (): Promise<void> => {
    localStorage.removeItem('referralchain_user')
    setUser(null)
    console.log('✅ User signed out')
  }

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // In production, this would send a password reset email via Supabase
      console.log('Password reset requested for:', email)
      // TODO: Implement actual password reset with Supabase Auth
      return { success: true }
    } catch (err) {
      return { success: false, error: 'خطأ في استعادة كلمة المرور' }
    }
  }

  const updateProfile = async (data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' }

    try {
      const updatedUser = { ...user, ...data, updated_at: new Date().toISOString() }

      // Try to update in Supabase
      const { error } = await supabase
        .from('users')
        .update({
          full_name: updatedUser.full_name,
          username: updatedUser.username,
          avatar_url: updatedUser.avatar_url,
          paypal_email: updatedUser.paypal_email,
          updated_at: updatedUser.updated_at,
        })
        .eq('id', user.id)

      if (error) {
        console.warn('Failed to update user in database:', error)
      }

      // Update locally
      localStorage.setItem('referralchain_user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      console.log('✅ Profile updated')
      return { success: true }
    } catch (err) {
      console.error('Profile update error:', err)
      return { success: false, error: 'خطأ في تحديث الملف الشخصي' }
    }
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signOut,
      resetPassword,
      updateProfile,
      isAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
