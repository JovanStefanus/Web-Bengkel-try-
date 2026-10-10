'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import LogoutButton from '@/components/LogoutButton'

export default function MekanikPage() {
  const [tugasList, setTugasList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchTugas = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('booking')
      .select('*, kendaraan(merk, no_polisi), bengkel(nama)')
      .order('id_booking', { ascending: false })

    if (data) setTugasList(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchTugas()
  }, [])

  const handleUpdateStatus = async (id_booking: number, status: string) => {
    await supabase.from('booking').update({ status }).eq('id_booking', id_booking)
    fetchTugas()
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header Dashboard Mekanik dengan Tombol Logout */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Tugas Servis Mekanik</h1>
          <p className="text-gray-500 text-sm">Pantau dan perbarui status pengerjaan servis kendaraan</p>
        </div>
        <LogoutButton />
      </div>

      {/* Daftar Tugas Pengerjaan */}
      {loading ? (
        <p className="text-gray-500 text-sm">Memuat daftar tugas...</p>
      ) : tugasList.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border text-center text-gray-500">
          Belum ada tugas pengerjaan servis.
        </div>
      ) : (
        <div className="space-y-4">
          {tugasList.map((t) => (
            <div key={t.id_booking} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-gray-800">{t.kendaraan?.merk} ({t.kendaraan?.no_polisi})</h3>
                <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-semibold">
                  Status: {t.status}
                </span>
              </div>
              <p className="text-xs text-gray-500">Keluhan: {t.keluhan || '-'}</p>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => handleUpdateStatus(t.id_booking, 'dikerjakan')}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-2 rounded font-semibold transition"
                >
                  Mulai Pengerjaan
                </button>
                <button
                  onClick={() => handleUpdateStatus(t.id_booking, 'selesai')}
                  className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-2 rounded font-semibold transition"
                >
                  Selesai Servis (Auto Invoice)
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}