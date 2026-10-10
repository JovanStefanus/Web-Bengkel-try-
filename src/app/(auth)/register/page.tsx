'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nama, setNama] = useState('')
  const [noHp, setNoHp] = useState('')
  const [role, setRole] = useState<'customer' | 'bengkel' | 'mekanik'>('customer')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nama,
          no_hp: noHp,
          role, // dikirim langsung 'bengkel'
        },
      },
    })

    if (error) {
      setErrorMsg(error.message)
      setLoading(false)
    } else {
      router.push(`/${role}`)
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md border border-gray-100">
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Pendaftaran Akun</h2>
        {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{errorMsg}</div>}
        
        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor HP</label>
            <input
              type="tel"
              required
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
              value={noHp}
              onChange={(e) => setNoHp(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Daftar Sebagai</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as 'customer' | 'bengkel' | 'mekanik')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white text-gray-800"
            >
              <option value="customer">Customer (Pemilik Kendaraan)</option>
              <option value="bengkel">Pemilik / Mitra Bengkel</option>
              <option value="mekanik">Mekanik Bengkel</option>
            </select>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Sudah punya akun?{' '}
          <Link href="/login" className="text-blue-600 font-semibold hover:underline">
            Masuk di sini
          </Link>
        </p>
      </div>
    </div>
  )
}