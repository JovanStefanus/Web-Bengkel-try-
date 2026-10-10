'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Sparepart {
  id_sparepart: number
  nama_sparepart: string
  harga: number
  stok: number
}

export default function KelolaSparepartPage() {
  const [list, setList] = useState<Sparepart[]>([])
  const [nama, setNama] = useState('')
  const [harga, setHarga] = useState<number>(0)
  const [stok, setStok] = useState<number>(10)
  const [loading, setLoading] = useState(false)
  const [bengkelId, setBengkelId] = useState<number | null>(null)

  const supabase = createClient()

  const fetchSparepart = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: bengkel } = await supabase
      .from('bengkel')
      .select('id_bengkel')
      .eq('id_pemilik', user.id)
      .maybeSingle()

    if (bengkel) {
      setBengkelId(bengkel.id_bengkel)
      const { data } = await supabase
        .from('sparepart')
        .select('*')
        .eq('id_bengkel', bengkel.id_bengkel)
        .order('id_sparepart', { ascending: false })

      if (data) setList(data)
    }
  }

  useEffect(() => {
    fetchSparepart()
  }, [])

  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bengkelId) return

    setLoading(true)
    const { error } = await supabase.from('sparepart').insert({
      id_bengkel: bengkelId,
      nama_sparepart: nama,
      harga,
      stok,
    })

    if (!error) {
      setNama('')
      setHarga(0)
      setStok(10)
      fetchSparepart()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Kelola Stok Sparepart</h1>

      {/* Form Tambah Sparepart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Tambah Sparepart Baru</h2>
        <form onSubmit={handleTambah} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Sparepart</label>
            <input
              type="text"
              required
              placeholder="Contoh: Oli Yamalube 1L"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-gray-800 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
            <input
              type="number"
              required
              value={harga || ''}
              onChange={(e) => setHarga(Number(e.target.value))}
              className="w-full p-2.5 border rounded-lg text-gray-800 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah Stok</label>
            <input
              type="number"
              required
              value={stok || ''}
              onChange={(e) => setStok(Number(e.target.value))}
              className="w-full p-2.5 border rounded-lg text-gray-800 outline-none"
            />
          </div>
          <div className="md:col-span-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Menyimpan...' : 'Tambah Sparepart'}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Sparepart */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b text-sm font-semibold text-gray-700">
              <th className="p-4">Nama Sparepart</th>
              <th className="p-4">Harga</th>
              <th className="p-4">Stok</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm text-gray-800">
            {list.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">Belum ada data suku cadang.</td>
              </tr>
            ) : (
              list.map((item) => (
                <tr key={item.id_sparepart} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{item.nama_sparepart}</td>
                  <td className="p-4">Rp {item.harga.toLocaleString('id-ID')}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md font-semibold">
                      {item.stok} pcs
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}