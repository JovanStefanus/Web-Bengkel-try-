'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

interface JenisServis {
  id_jenis_servis: number
  nama_servis: string
  harga: number
}

export default function KelolaServisPage() {
  const [servisList, setServisList] = useState<JenisServis[]>([])
  const [bengkelId, setBengkelId] = useState<number | null>(null)
  const [namaServis, setNamaServis] = useState('')
  const [harga, setHarga] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const supabase = createClient()

  const fetchBengkelAndServis = async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // 1. Ambil id_bengkel milik user yang sedang login
    const { data: bengkel } = await supabase
      .from('bengkel')
      .select('id_bengkel')
      .eq('id_pemilik', user.id)
      .maybeSingle()

    if (bengkel) {
      setBengkelId(bengkel.id_bengkel)

      // 2. Ambil daftar jenis servis untuk bengkel ini
      const { data: servis } = await supabase
        .from('jenis_servis')
        .select('*')
        .eq('id_bengkel', bengkel.id_bengkel)
        .order('id_jenis_servis', { ascending: true })

      if (servis) setServisList(servis)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBengkelAndServis()
  }, [])

  const handleTambahServis = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bengkelId) {
      alert('Profil bengkel belum dibuat. Silakan atur profil bengkel terlebih dahulu.')
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('jenis_servis').insert({
      id_bengkel: bengkelId,
      nama_servis: namaServis,
      harga: Number(harga),
    })

    if (!error) {
      setNamaServis('')
      setHarga('')
      fetchBengkelAndServis()
    } else {
      alert('Gagal menambah jenis servis: ' + error.message)
    }
    setSubmitting(false)
  }

  const handleHapusServis = async (id: number) => {
    if (!confirm('Yakin ingin menghapus jenis servis ini?')) return

    const { error } = await supabase
      .from('jenis_servis')
      .delete()
      .eq('id_jenis_servis', id)

    if (!error) {
      fetchBengkelAndServis()
    } else {
      alert('Gagal menghapus jenis servis: ' + error.message)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Link href="/bengkel" className="text-sm text-blue-600 font-semibold hover:underline inline-block">
        &larr; Kembali ke Dashboard Bengkel
      </Link>

      <h1 className="text-2xl font-bold text-gray-800">Kelola Layanan & Jenis Servis</h1>

      {/* Form Tambah Servis */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Tambah Jenis Servis Baru</h3>
        <form onSubmit={handleTambahServis} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Nama Layanan / Servis</label>
            <input
              type="text"
              required
              placeholder="Contoh: Servis Ringan / Ganti Oli"
              value={namaServis}
              onChange={(e) => setNamaServis(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none text-sm text-gray-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Harga (Rp)</label>
            <input
              type="number"
              required
              placeholder="Contoh: 75000"
              value={harga}
              onChange={(e) => setHarga(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none text-sm text-gray-800"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
            >
              {submitting ? 'Menyimpan...' : '+ Tambah Servis'}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Jenis Servis */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-800 text-lg mb-4">Daftar Layanan Tersedia</h3>

        {loading ? (
          <p className="text-gray-500 text-sm">Memuat daftar servis...</p>
        ) : servisList.length === 0 ? (
          <p className="text-gray-500 text-sm italic">Belum ada pilihan servis di bengkel ini.</p>
        ) : (
          <div className="divide-y border rounded-xl overflow-hidden">
            {servisList.map((s) => (
              <div key={s.id_jenis_servis} className="p-4 flex justify-between items-center text-sm">
                <div>
                  <p className="font-bold text-gray-800">{s.nama_servis}</p>
                  <p className="text-xs text-blue-600 font-semibold mt-0.5">
                    Rp {Number(s.harga).toLocaleString('id-ID')}
                  </p>
                </div>
                <button
                  onClick={() => handleHapusServis(s.id_jenis_servis)}
                  className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition"
                >
                  Hapus
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}