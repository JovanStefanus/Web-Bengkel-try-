'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Kendaraan {
  id_kendaraan: number
  jenis: 'Motor' | 'Mobil'
  merk: string
  no_polisi: string
  tahun: number
}

export default function KelolaKendaraanPage() {
  const [kendaraanList, setKendaraanList] = useState<Kendaraan[]>([])
  const [jenis, setJenis] = useState<'Motor' | 'Mobil'>('Motor')
  const [merk, setMerk] = useState('')
  const [noPolisi, setNoPolisi] = useState('')
  const [tahun, setTahun] = useState<string>('2022')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const supabase = createClient()

  const fetchKendaraan = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('kendaraan')
      .select('*')
      .eq('id_user', user.id)
      .order('id_kendaraan', { ascending: false })

    if (error) {
      console.error('Error fetching kendaraan:', error)
    } else if (data) {
      setKendaraanList(data as Kendaraan[])
    }
  }

  useEffect(() => {
    fetchKendaraan()
  }, [])

  const handleTambah = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Pengguna tidak terautentikasi.')

      const parsedTahun = parseInt(tahun, 10)
      if (isNaN(parsedTahun)) {
        throw new Error('Tahun kendaraan harus berupa angka.')
      }

      // 1. Pastikan Profile Pengguna Ada di Tabel profiles
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle()

      if (!profile) {
        // Buat profile otomatis jika belum ada
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          nama: user.user_metadata?.nama || 'Customer',
          no_hp: user.user_metadata?.no_hp || '',
          role: 'customer',
        })

        if (profileError) throw new Error('Gagal menyinkronkan profil: ' + profileError.message)
      }

      // 2. Simpan Data Kendaraan
      const { error } = await supabase.from('kendaraan').insert({
        id_user: user.id,
        jenis,
        merk,
        no_polisi: noPolisi,
        tahun: parsedTahun,
      })

      if (error) throw error

      setMerk('')
      setNoPolisi('')
      setTahun('2022')
      setSuccessMsg('Kendaraan berhasil ditambahkan!')
      await fetchKendaraan()
    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal menyimpan kendaraan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Kelola Kendaraan Saya</h1>

      {/* Form Tambah Kendaraan */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
        <h2 className="text-lg font-semibold mb-4 text-gray-700">Tambah Kendaraan Baru</h2>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-lg text-sm mb-4">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm mb-4">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleTambah} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jenis Kendaraan</label>
            <select
              value={jenis}
              onChange={(e) => setJenis(e.target.value as 'Motor' | 'Mobil')}
              className="w-full p-2.5 border rounded-lg bg-white outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            >
              <option value="Motor">Motor</option>
              <option value="Mobil">Mobil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Merk / Model</label>
            <input
              type="text"
              placeholder="Contoh: Honda Vario / Toyota Avanza"
              required
              value={merk}
              onChange={(e) => setMerk(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Polisi</label>
            <input
              type="text"
              placeholder="D 1234 ABC"
              required
              value={noPolisi}
              onChange={(e) => setNoPolisi(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tahun Kendaraan</label>
            <input
              type="number"
              required
              value={tahun}
              onChange={(e) => setTahun(e.target.value)}
              className="w-full p-2.5 border rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-2.5 rounded-lg transition"
            >
              {loading ? 'Menyimpan...' : 'Simpan Kendaraan'}
            </button>
          </div>
        </form>
      </div>

      {/* Daftar Kendaraan */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {kendaraanList.length === 0 ? (
          <p className="text-gray-500 text-sm md:col-span-2 text-center py-6">
            Belum ada kendaraan yang ditambahkan.
          </p>
        ) : (
          kendaraanList.map((k) => (
            <div key={k.id_kendaraan} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex justify-between items-center">
              <div>
                <span className={`inline-block px-2.5 py-0.5 rounded text-xs font-semibold mb-2 ${k.jenis === 'Mobil' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {k.jenis}
                </span>
                <h3 className="font-bold text-gray-800 text-lg">{k.merk}</h3>
                <p className="text-sm text-gray-500">{k.no_polisi} • Tahun {k.tahun}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}