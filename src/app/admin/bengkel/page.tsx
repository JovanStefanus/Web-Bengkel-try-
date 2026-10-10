'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface BengkelItem {
  id_bengkel: number
  nama: string
  alamat: string
  jenis_kendaraan: string
  jam_operasional: string
  status_verifikasi: string
  profiles?: { nama: string; no_hp: string }
}

export default function VerifikasiBengkelPage() {
  const [bengkelList, setBengkelList] = useState<BengkelItem[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  const fetchBengkel = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bengkel')
      .select('*, profiles:id_pemilik(nama, no_hp)')
      .order('id_bengkel', { ascending: false })

    if (error) {
      console.error('Error fetching bengkel:', error)
    } else if (data) {
      setBengkelList(data as any)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBengkel()
  }, [])

  const handleUpdateStatus = async (id_bengkel: number, status: 'verified' | 'rejected') => {
    const { error } = await supabase
      .from('bengkel')
      .update({ status_verifikasi: status })
      .eq('id_bengkel', id_bengkel)

    if (!error) {
      fetchBengkel()
    } else {
      alert('Gagal memperbarui status verifikasi: ' + error.message)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">Verified</span>
      case 'rejected':
        return <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">Rejected</span>
      default:
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">Pending Verifikasi</span>
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Link href="/admin" className="text-sm text-blue-600 font-semibold hover:underline inline-block">
        &larr; Kembali ke Dashboard Admin
      </Link>

      <h1 className="text-2xl font-bold text-gray-800">Daftar & Verifikasi Mitra Bengkel</h1>

      {loading ? (
        <p className="text-gray-500 text-sm">Memuat data bengkel...</p>
      ) : bengkelList.length === 0 ? (
        <div className="bg-white p-6 rounded-xl border text-center text-gray-500">
          Belum ada bengkel yang terdaftar di database.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="divide-y">
            {bengkelList.map((item) => (
              <div key={item.id_bengkel} className="p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-gray-800 text-lg">{item.nama}</h3>
                    {getStatusBadge(item.status_verifikasi)}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{item.alamat}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Pemilik: <span className="font-semibold text-gray-700">{item.profiles?.nama || '-'}</span> ({item.profiles?.no_hp || '-'})
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                    <span>🚗 Layanan: {item.jenis_kendaraan}</span>
                    <span>🕒 Jam: {item.jam_operasional}</span>
                  </div>
                </div>

                {/* Tombol Verifikasi */}
                <div className="flex items-center gap-2">
                  {item.status_verifikasi !== 'verified' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id_bengkel, 'verified')}
                      className="bg-green-600 hover:bg-green-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Setujui (Verify)
                    </button>
                  )}

                  {item.status_verifikasi !== 'rejected' && (
                    <button
                      onClick={() => handleUpdateStatus(item.id_bengkel, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white text-xs px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Tolak
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}