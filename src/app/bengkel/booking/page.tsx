'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function KelolaBookingBengkelPage() {
  const [bookingList, setBookingList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBooking = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: bengkel } = await supabase
      .from('bengkel')
      .select('id_bengkel')
      .eq('id_pemilik', user.id)
      .maybeSingle()

    if (!bengkel) {
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('booking')
      .select('*, kendaraan(merk, no_polisi, jenis), profiles:id_customer(nama, no_hp)')
      .eq('id_bengkel', bengkel.id_bengkel)
      .order('id_booking', { ascending: false })

    if (error) {
      console.error('Error fetching booking:', error)
    } else if (data) {
      setBookingList(data)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBooking()
  }, [])

  const handleUpdateStatus = async (id_booking: number, status: string) => {
    await supabase.from('booking').update({ status }).eq('id_booking', id_booking)
    fetchBooking()
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Menunggu</span>
      case 'diterima':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Diterima</span>
      case 'dikerjakan':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold animate-pulse">Sedang Dikerjakan</span>
      case 'selesai':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Selesai Servis</span>
      default:
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Ditolak / Batal</span>
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Kelola Booking Servis Masuk</h1>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data booking...</p>
      ) : bookingList.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border text-center text-gray-500">
          Belum ada booking masuk untuk bengkel Anda.
        </div>
      ) : (
        <div className="space-y-4">
          {bookingList.map((b) => (
            <div key={b.id_booking} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {b.profiles?.nama || 'Customer'} {b.profiles?.no_hp ? `(${b.profiles.no_hp})` : ''}
                  </h3>
                  <p className="text-sm font-semibold text-blue-600 mt-0.5">
                    🚗 {b.kendaraan ? `${b.kendaraan.merk} (${b.kendaraan.no_polisi}) - ${b.kendaraan.jenis}` : 'Data kendaraan tidak ditemukan'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    📅 Tanggal Booking: <span className="font-medium text-gray-700">{b.tanggal_booking || '-'}</span>
                  </p>
                </div>
                {getStatusBadge(b.status)}
              </div>

              <p className="text-xs text-gray-600 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                <strong>Keluhan:</strong> {b.keluhan || '-'}
              </p>

              {/* Tombol Aksi berdasarkan status */}
              <div className="flex items-center gap-3 pt-2">
                {b.status === 'menunggu' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(b.id_booking, 'diterima')}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Terima Booking
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(b.id_booking, 'ditolak')}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Tolak Booking
                    </button>
                  </>
                )}

                {b.status === 'diterima' && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-green-700 font-semibold bg-green-50 px-3 py-1.5 rounded-lg border border-green-200">
                      ✓ Booking Diterima
                    </span>
                    <button
                      onClick={() => handleUpdateStatus(b.id_booking, 'dikerjakan')}
                      className="bg-purple-600 hover:bg-purple-700 text-white text-xs px-3 py-1.5 rounded-lg font-semibold transition"
                    >
                      Mulai Pengerjaan
                    </button>
                  </div>
                )}

                {b.status === 'dikerjakan' && (
                  <button
                    onClick={() => handleUpdateStatus(b.id_booking, 'selesai')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Selesaikan Servis & Terbitkan Invoice
                  </button>
                )}

                {b.status === 'selesai' && (
                  <span className="text-xs text-blue-700 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
                    🎉 Servis Selesai & Invoice Terbit
                  </span>
                )}

                {b.status === 'ditolak' && (
                  <span className="text-xs text-red-700 font-semibold bg-red-50 px-3 py-1.5 rounded-lg border border-red-200">
                    ✕ Booking Ditolak
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}