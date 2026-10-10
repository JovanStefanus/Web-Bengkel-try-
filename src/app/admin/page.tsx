'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalCustomer: 0,
    totalBengkel: 0,
    pendingBengkel: 0,
    totalBooking: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      const [{ count: customerCount }, { count: bengkelCount }, { count: pendingCount }, { count: bookingCount }] =
        await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'customer'),
          supabase.from('bengkel').select('*', { count: 'exact', head: true }),
          supabase.from('bengkel').select('*', { count: 'exact', head: true }).eq('status_verifikasi', 'pending'),
          supabase.from('booking').select('*', { count: 'exact', head: true }),
        ])

      setStats({
        totalCustomer: customerCount || 0,
        totalBengkel: bengkelCount || 0,
        pendingBengkel: pendingCount || 0,
        totalBooking: bookingCount || 0,
      })
      setLoading(false)
    }

    fetchStats()
  }, [])

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header Admin dengan Tombol Logout */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Panel Utama Administrator</h1>
          <p className="text-gray-500 text-sm">Kelola verifikasi mitra bengkel dan pantau aktivitas platform</p>
        </div>
        <LogoutButton />
      </div>

      {/* Kartu Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Customer</p>
          <p className="text-2xl font-bold text-blue-600 mt-2">{loading ? '...' : stats.totalCustomer}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Bengkel</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{loading ? '...' : stats.totalBengkel}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Menunggu Verifikasi</p>
          <p className="text-2xl font-bold text-yellow-600 mt-2">{loading ? '...' : stats.pendingBengkel}</p>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-xs font-semibold text-gray-500 uppercase">Total Transaksi Booking</p>
          <p className="text-2xl font-bold text-green-600 mt-2">{loading ? '...' : stats.totalBooking}</p>
        </div>
      </div>

      {/* Menu Manajemen Admin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
        <Link
          href="/admin/bengkel"
          className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition group"
        >
          <div className="flex justify-between items-center mb-2">
            <span className="text-3xl">🏬</span>
            {stats.pendingBengkel > 0 && (
              <span className="bg-yellow-100 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-bold">
                {stats.pendingBengkel} Pengajuan Baru
              </span>
            )}
          </div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Verifikasi Mitra Bengkel</h3>
          <p className="text-xs text-gray-500 mt-1">
            Tinjau dan setujui atau tolak pendaftaran lokasi bengkel baru
          </p>
        </Link>
      </div>
    </div>
  )
}