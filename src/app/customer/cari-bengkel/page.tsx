'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

// Import Map secara Dynamic (Client Side Only)
const BengkelMap = dynamic(() => import('@/components/map/BengkelMap'), { ssr: false })

interface Bengkel {
  id_bengkel: number
  nama: string
  alamat: string
  lat: number
  lng: number
  jenis_kendaraan: string
  rating: number
  jam_operasional: string
  jarak_km: number
}

interface Kendaraan {
  id_kendaraan: number
  jenis: string
  merk: string
  no_polisi: string
}

interface JenisServis {
  id_jenis_servis?: number
  id_servis?: number
  nama_servis: string
  harga: number
}

export default function CariBengkelPage() {
  // Posisi Default (Area Bandung)
  const [lat, setLat] = useState(-6.9175)
  const [lng, setLng] = useState(107.6191)
  const [radiusKm, setRadiusKm] = useState(10)
  const [filterJenis, setFilterJenis] = useState('Semua')

  const [bengkelList, setBengkelList] = useState<Bengkel[]>([])
  const [kendaraanList, setKendaraanList] = useState<Kendaraan[]>([])
  const [selectedBengkel, setSelectedBengkel] = useState<Bengkel | null>(null)
  const [servisList, setServisList] = useState<JenisServis[]>([])

  // State Form Booking
  const [selectedKendaraan, setSelectedKendaraan] = useState<number | null>(null)
  const [selectedServis, setSelectedServis] = useState<number[]>([])
  const [tanggalBooking, setTanggalBooking] = useState('')
  const [keluhan, setKeluhan] = useState('')
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  const supabase = createClient()

  // Ambil Lokasi GPS User otomatis
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude)
          setLng(pos.coords.longitude)
        },
        () => console.log('Geolocation ditolak/gagal, memakai koordinat default Bandung.')
      )
    }
  }, [])

  // Fetch Bengkel Terdekat via PostGIS Stored Procedure
  const fetchBengkel = async () => {
    const { data } = await supabase.rpc('bengkel_terdekat', {
      p_lat: lat,
      p_lng: lng,
      p_radius_km: radiusKm,
      p_jenis_kendaraan: filterJenis,
    })

    if (data) setBengkelList(data as Bengkel[])
  }

  // Fetch Kendaraan Milik Customer
  const fetchKendaraan = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase.from('kendaraan').select('*').eq('id_user', user.id)
    if (data && data.length > 0) {
      setKendaraanList(data as Kendaraan[])
      setSelectedKendaraan(data[0].id_kendaraan)
    }
  }

  useEffect(() => {
    fetchBengkel()
    fetchKendaraan()
  }, [lat, lng, radiusKm, filterJenis])

  // Pilih Bengkel & Ambil Daftar Servisnya
  const handleSelectBengkel = async (bengkel: Bengkel) => {
    setSelectedBengkel(bengkel)
    setSuccessMsg('')
    setErrorMsg('')
    setSelectedServis([]) // Reset pilihan centang saat memilih bengkel baru

    const { data } = await supabase
      .from('jenis_servis')
      .select('*')
      .eq('id_bengkel', bengkel.id_bengkel)

    if (data) setServisList(data as JenisServis[])
    else setServisList([])
  }

  // Submit Booking Servis
  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedBengkel) {
      alert('Pilih bengkel terlebih dahulu.')
      return
    }
    if (!selectedKendaraan) {
      alert('Pilih kendaraan Anda terlebih dahulu.')
      return
    }
    if (selectedServis.length === 0) {
      alert('Silakan pilih minimal satu jenis servis!')
      return
    }

    setLoading(true)
    setErrorMsg('')
    setSuccessMsg('')

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Pengguna tidak terautentikasi.')

      // 1. Buat Record Booking Utama
      const { data: booking, error } = await supabase
        .from('booking')
        .insert({
          id_customer: user.id,
          id_bengkel: selectedBengkel.id_bengkel,
          id_kendaraan: selectedKendaraan,
          tanggal_booking: tanggalBooking,
          keluhan,
          jarak_km: selectedBengkel.jarak_km || 0,
          status: 'menunggu',
        })
        .select()
        .single()

      if (error) throw error

      // 2. Buat Detail Servis Booking
      const details = selectedServis.map((id_servis) => ({
        id_booking: booking.id_booking,
        id_servis,
    }))

      const { error: detailError } = await supabase.from('booking_detail').insert(details)
      if (detailError) throw detailError

      setSuccessMsg('Booking berhasil dibuat! Menunggu konfirmasi bengkel.')
      setSelectedBengkel(null)
      setSelectedServis([])
      setKeluhan('')
    } catch (err: any) {
      alert('Gagal membuat booking: ' + (err.message || 'Terjadi kesalahan'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Cari Bengkel Terdekat</h1>

      {successMsg && (
        <div className="bg-green-50 border border-green-200 text-green-700 p-4 rounded-xl mb-6">
          {successMsg}
        </div>
      )}

      {/* Filter Options */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm mb-6 flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Filter Kendaraan:</label>
          <select
            value={filterJenis}
            onChange={(e) => setFilterJenis(e.target.value)}
            className="p-2 border rounded-lg bg-white text-sm outline-none text-gray-800"
          >
            <option value="Semua">Semua Jenis</option>
            <option value="Motor">Khusus Motor</option>
            <option value="Mobil">Khusus Mobil</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">Radius Jarak:</label>
          <select
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="p-2 border rounded-lg bg-white text-sm outline-none text-gray-800"
          >
            <option value={5}>Max 5 Km</option>
            <option value={10}>Max 10 Km</option>
            <option value={20}>Max 20 Km</option>
          </select>
        </div>
      </div>

      {/* Peta & Daftar Bengkel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <BengkelMap userLat={lat} userLng={lng} bengkelList={bengkelList} onSelectBengkel={handleSelectBengkel} />
        </div>

        <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
          <h2 className="font-semibold text-gray-700">Bengkel Ditemukan ({bengkelList.length})</h2>
          {bengkelList.map((b) => (
            <div
              key={b.id_bengkel}
              onClick={() => handleSelectBengkel(b)}
              className="p-4 bg-white rounded-xl border border-gray-200 hover:border-blue-500 cursor-pointer transition shadow-sm"
            >
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-gray-800">{b.nama}</h3>
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold">
                  {b.jarak_km} km
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">{b.alamat}</p>
              <div className="mt-3 flex items-center justify-between text-xs text-gray-600">
                <span>⭐ {b.rating || 'Baru'}</span>
                <span>🕒 {b.jam_operasional}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal / Panel Form Booking */}
      {selectedBengkel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-lg w-full p-6 rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Booking Servis</h2>
            <p className="text-sm text-gray-500 mb-4">{selectedBengkel.nama} — {selectedBengkel.alamat}</p>

            <form onSubmit={handleBooking} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Kendaraan Anda</label>
                <select
                  value={selectedKendaraan || ''}
                  onChange={(e) => setSelectedKendaraan(Number(e.target.value))}
                  required
                  className="w-full p-2.5 border rounded-lg bg-white text-gray-800"
                >
                  {kendaraanList.map((k) => (
                    <option key={k.id_kendaraan} value={k.id_kendaraan}>
                      {k.merk} ({k.no_polisi}) - {k.jenis}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Jenis Servis</label>
                <div className="space-y-2 border p-3 rounded-lg max-h-40 overflow-y-auto bg-white">
                  {servisList.length === 0 ? (
                    <p className="text-xs text-gray-400 italic">Belum ada pilihan servis di bengkel ini.</p>
                  ) : (
                    servisList.map((s) => {
                      // Penanganan ID unik yang aman
                      const idServis = Number(s.id_jenis_servis || s.id_servis)
                      const isChecked = selectedServis.includes(idServis)

                      return (
                        <label
                          key={idServis}
                          className="flex items-center justify-between text-sm p-1.5 hover:bg-gray-50 rounded cursor-pointer text-gray-800 border-b last:border-0"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              value={idServis}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedServis((prev) => [...prev, idServis])
                                } else {
                                  setSelectedServis((prev) => prev.filter((id) => id !== idServis))
                                }
                              }}
                              className="w-4 h-4 text-blue-600 rounded cursor-pointer"
                            />
                            <span>{s.nama_servis}</span>
                          </div>
                          <span className="font-semibold text-blue-600">
                            Rp {Number(s.harga).toLocaleString('id-ID')}
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal & Waktu Booking</label>
                <input
                  type="date"
                  required
                  value={tanggalBooking}
                  onChange={(e) => setTanggalBooking(e.target.value)}
                  className="w-full p-2.5 border rounded-lg text-gray-800"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Catatan / Keluhan Kendaraan</label>
                <textarea
                  rows={3}
                  placeholder="Ceritakan kendala pada kendaraan Anda..."
                  value={keluhan}
                  onChange={(e) => setKeluhan(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none text-gray-800"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedBengkel(null)}
                  className="w-1/2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-lg font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-1/2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-2.5 rounded-lg font-semibold"
                >
                  {loading ? 'Memproses...' : 'Konfirmasi Booking'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}