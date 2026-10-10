'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton({ className }: { className?: string }) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  const router = useRouter() // Perbaikan di baris ini

  const handleLogout = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className={
        className ||
        'bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-semibold px-4 py-2 rounded-lg transition shadow-sm'
      }
    >
      {loading ? 'Keluar...' : 'Logout'}
    </button>
  )
}