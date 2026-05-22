'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string | null
  full_name: string | null
  plan: string
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  created_at: string
  updated_at: string
}

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then((result: { data: { user: User | null } }) => {
      const u = result.data.user
      setUser(u)
      if (u) {
        supabase
          .from('profiles')
          .select('*')
          .eq('id', u.id)
          .single()
          .then((result: { data: Profile | null }) => { setProfile(result.data); setLoading(false) })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: { user: User | null } | null) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  return { user, profile, loading }
}

export async function signOut() {
  await supabase.auth.signOut()
  window.location.href = '/login'
}