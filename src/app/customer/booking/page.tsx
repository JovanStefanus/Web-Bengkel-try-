'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface Booking {
  id_booking: number
  tanggal_booking: string
  status: string
  keluhan: string
  bengkel: { nama: string; alamat: string }
  kendaraan: { merk: string; no_polisi: string }
}

export default function StatusBookingPage() {
  const [bookingList, setBookingList] = useState<Booking[]>([])
  const supabase = createClient()

  const fetchBookings = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('booking')
      .select('*, bengkel(nama, alamat), kendaraan(merk, no_polisi)')
      .eq('id_customer', user.id)
      .order('id_booking', { ascending: false })

    if (data) setBookingList(data as any)
  }

  useEffect(() => {
    fetchBookings()

    // Realtime Listener untuk Update Status Pengerjaan Servis
    const channel = supabase
      .channel('realtime_booking_customer')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'booking' },
        (payload) => {
          console.log('Status booking berubah:', payload)
          fetchBookings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'menunggu':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Menunggu Konfirmasi</span>
      case 'diterima':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">Diterima Bengkel</span>
      case 'dikerjakan':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-semibold animate-pulse">Sedang Dikerjakan</span>
      case 'selesai':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Selesai Servis</span>
      default:
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Dibatalkan / Ditolak</span>
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Status Servis Real-Time</h1>

      <div className="space-y-4">
        {bookingList.map((b) => (
          <div key={b.id_booking} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-bold text-gray-800 text-lg">{b.bengkel?.nama}</h3>
                <p className="text-xs text-gray-500">{b.bengkel?.alamat}</p>
              </div>
              {getStatusBadge(b.status)}
            </div>

            <div className="border-t pt-3 mt-3 grid grid-cols-2 text-sm text-gray-600">
              <div>
                <p className="font-medium text-gray-800">Kendaraan:</p>
                <p>{b.kendaraan?.merk} ({b.kendaraan?.no_polisi})</p>
              </div>
              <div>
                <p className="font-medium text-gray-800">Tanggal Booking:</p>
                <p>{b.tanggal_booking}</p>
              </div>
            </div>

            {b.keluhan && (
              <div className="mt-3 bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
                <span className="font-semibold">Keluhan:</span> {b.keluhan}
              </div>
            )}

            {/* Tombol Lihat Invoice jika Status Servis Selesai */}
            {b.status === 'selesai' && (
              <div className="mt-4 pt-3 border-t flex justify-end">
                <Link
                  href={`/customer/invoice/${b.id_booking}`}
                  className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-4 py-2.5 rounded-lg font-semibold transition shadow-sm"
                >
                  🧾 Lihat Invoice & Bayar
                </Link>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}