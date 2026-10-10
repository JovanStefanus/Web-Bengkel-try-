'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ProfilBengkelPage() {
  const [bengkel, setBengkel] = useState<any>(null)
  const [nama, setNama] = useState('')
  const [alamat, setAlamat] = useState('')
  const [lat, setLat] = useState(-6.9175)
  const [lng, setLng] = useState(107.6191)
  const [jenisKendaraan, setJenisKendaraan] = useState<'Motor' | 'Mobil' | 'Semua'>('Semua')
  const [jamOperasional, setJamOperasional] = useState('08:00 - 17:00')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  const supabase = createClient()

  const fetchBengkel = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('bengkel').select('*').eq('id_pemilik', user.id).maybeSingle()
    if (data) {
      setBengkel(data)
      setNama(data.nama)
      setAlamat(data.alamat)
      setLat(data.lat)
      setLng(data.lng)
      setJenisKendaraan(data.jenis_kendaraan)
      setJamOperasional(data.jam_operasional)
    }
  }

  useEffect(() => {
    fetchBengkel()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMsg('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const payload = {
      id_pemilik: user.id,
      nama,
      alamat,
      lat: Number(lat),
      lng: Number(lng),
      jenis_kendaraan: jenisKendaraan,
      jam_operasional: jamOperasional,
      status_verifikasi: 'verified',
    }

    let error
    if (bengkel) {
      const res = await supabase.from('bengkel').update(payload).eq('id_bengkel', bengkel.id_bengkel)
      error = res.error
    } else {
      const res = await supabase.from('bengkel').insert(payload)
      error = res.error
    }

    if (error) {
      setMsg('Error: ' + error.message)
    } else {
      setMsg('Profil bengkel berhasil disimpan!')
      await fetchBengkel()
    }
    setLoading(false)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Profil Bengkel Saya</h1>

      {msg && <div className="p-3 mb-4 rounded-lg bg-blue-50 text-blue-700 text-sm">{msg}</div>}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nama Bengkel</label>
          <input
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            className="w-full p-2.5 border rounded-lg text-gray-800 outline-none"
            placeholder="Contoh: Bengkel Maju Jaya"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Alamat Lengkap</label>
          <textarea
            required
            rows={2}
            value={alamat}
            onChange={(e) => setAlamat(e.target.value)}
            className="w-full p-2.5 border rounded-lg text-gray-800 outline-none"
            placeholder="Jl. Merdeka No. 123, Bandung"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude (Lat)</label>
            <input
              type="number"
              step="any"
              required
              value={lat}
              onChange={(e) => setLat(Number(e.target.value))}
              className="w-full p-2.5 border rounded-lg text-gray-800 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude (Lng)</label>
            <input
              type="number"
              step="any"
              required
              value={lng}
              onChange={(e) => setLng(Number(e.target.value))}
              className="w-full p-2.5 border rounded-lg text-gray-800 outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Melayani Kendaraan</label>
            <select
              value={jenisKendaraan}
              onChange={(e) => setJenisKendaraan(e.target.value as any)}
              className="w-full p-2.5 border rounded-lg bg-white text-gray-800 outline-none"
            >
              <option value="Semua">Semua (Motor & Mobil)</option>
              <option value="Motor">Khusus Motor</option>
              <option value="Mobil">Khusus Mobil</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Jam Operasional</label>
            <input
              type="text"
              required
              value={jamOperasional}
              onChange={(e) => setJamOperasional(e.target.value)}
              className="w-full p-2.5 border rounded-lg text-gray-800 outline-none"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
        >
          {loading ? 'Menyimpan...' : 'Simpan Profil Bengkel'}
        </button>
      </form>
    </div>
  )
}