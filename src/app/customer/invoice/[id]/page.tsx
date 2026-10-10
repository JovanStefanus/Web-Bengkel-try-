'use client'

import { useEffect, useState, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const bookingId = resolvedParams.id

  const [invoice, setInvoice] = useState<any>(null)
  const [details, setDetails] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)

  // State Ulasan
  const [rating, setRating] = useState(5)
  const [komentar, setKomentar] = useState('')
  const [ulasanExist, setUlasanExist] = useState<any>(null)
  const [submittingReview, setSubmittingReview] = useState(false)

  const supabase = createClient()

  const fetchInvoiceAndReview = async () => {
    setLoading(true)

    // 1. Ambil Invoice
    const { data: inv } = await supabase
      .from('invoice')
      .select('*, booking(*, bengkel(id_bengkel, nama, alamat), kendaraan(merk, no_polisi))')
      .eq('id_booking', bookingId)
      .maybeSingle()

    if (inv) {
      setInvoice(inv)

      // 2. Ambil Rincian Servis
      const { data: dt } = await supabase
        .from('booking_detail')
        .select('*, jenis_servis(nama_servis, harga)')
        .eq('id_booking', bookingId)

      if (dt) setDetails(dt)

      // 3. Cek Apakah Ulasan Sudah Pernah Diberikan
      const { data: rev } = await supabase
        .from('ulasan')
        .select('*')
        .eq('id_booking', bookingId)
        .maybeSingle()

      if (rev) setUlasanExist(rev)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchInvoiceAndReview()
  }, [bookingId])

  const handleBayar = async () => {
    if (!invoice) return
    setPaying(true)

    const { error } = await supabase
      .from('invoice')
      .update({ status_pembayaran: 'lunas' })
      .eq('id_invoice', invoice.id_invoice)

    if (!error) {
      fetchInvoiceAndReview()
    }
    setPaying(false)
  }

  const handleKirimUlasan = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!invoice) return

    setSubmittingReview(true)
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('ulasan').insert({
      id_booking: Number(bookingId),
      id_bengkel: invoice.booking?.bengkel?.id_bengkel,
      id_customer: user?.id,
      rating,
      komentar,
    })

    if (!error) {
      alert('Terima kasih! Ulasan Anda berhasil dikirim.')
      fetchInvoiceAndReview()
    } else {
      alert('Gagal mengirim ulasan: ' + error.message)
    }
    setSubmittingReview(false)
  }

  const calculatedTotal = details.reduce((sum, item) => sum + (Number(item.jenis_servis?.harga) || 0), 0)
  const totalBiaya = Number(invoice?.total_biaya) || calculatedTotal

  if (loading) return <div className="p-6 text-center text-gray-500">Memuat data invoice...</div>

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Link href="/customer/booking" className="text-sm text-blue-600 font-semibold hover:underline inline-block">
        &larr; Kembali ke Status Servis
      </Link>

      <div className="bg-white p-8 rounded-2xl border border-gray-200 shadow-md">
        {/* Header Invoice */}
        <div className="flex justify-between items-start border-b pb-6 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">INVOICE SERVIS</h1>
            <p className="text-xs text-gray-500 mt-1">No. Invoice: #INV-{invoice.id_invoice}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${invoice.status_pembayaran === 'lunas' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
            {invoice.status_pembayaran === 'lunas' ? 'LUNAS' : 'BELUM DIBAYAR'}
          </span>
        </div>

        {/* Info Bengkel & Kendaraan */}
        <div className="grid grid-cols-2 gap-4 text-sm mb-6 bg-gray-50 p-4 rounded-xl">
          <div>
            <p className="text-xs text-gray-500 font-medium">Bengkel:</p>
            <p className="font-bold text-gray-800">{invoice.booking?.bengkel?.nama}</p>
            <p className="text-xs text-gray-600">{invoice.booking?.bengkel?.alamat}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Kendaraan:</p>
            <p className="font-bold text-gray-800">{invoice.booking?.kendaraan?.merk}</p>
            <p className="text-xs text-gray-600">{invoice.booking?.kendaraan?.no_polisi}</p>
          </div>
        </div>

        {/* Rincian Item */}
        <div className="mb-6">
          <h3 className="font-semibold text-gray-700 text-sm mb-3">Rincian Layanan & Sparepart</h3>
          <div className="border rounded-xl divide-y text-sm">
            {details.map((d) => (
              <div key={d.id_detail} className="p-3 flex justify-between items-center text-gray-800">
                <span>{d.jenis_servis?.nama_servis}</span>
                <span className="font-semibold">Rp {Number(d.jenis_servis?.harga || 0).toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Total Tagihan */}
        <div className="border-t pt-4 flex justify-between items-center mb-8">
          <span className="text-gray-600 font-semibold">Total Tagihan:</span>
          <span className="text-2xl font-bold text-blue-600">
            Rp {totalBiaya.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Tombol Bayar */}
        {invoice.status_pembayaran === 'belum_dibayar' ? (
          <button
            onClick={handleBayar}
            disabled={paying}
            className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-bold py-3 rounded-xl transition shadow-sm"
          >
            {paying ? 'Memproses Pembayaran...' : 'Konfirmasi Bayar Sekarang'}
          </button>
        ) : (
          <div className="bg-green-50 border border-green-200 text-green-700 text-center p-3 rounded-xl font-semibold text-sm">
            ✓ Pembayaran Telah Dikonfirmasi Lunas
          </div>
        )}
      </div>

      {/* Form Ulasan & Rating (Hanya jika Pembayaran Lunas) */}
      {invoice.status_pembayaran === 'lunas' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Ulasan & Rating Bengkel</h3>

          {ulasanExist ? (
            <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl text-gray-800">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-yellow-500 font-bold text-lg">{'⭐'.repeat(ulasanExist.rating)}</span>
                <span className="text-xs font-semibold text-gray-500">({ulasanExist.rating}/5)</span>
              </div>
              <p className="text-sm text-gray-700 italic">"{ulasanExist.komentar}"</p>
              <p className="text-xs text-blue-600 mt-2 font-medium">✓ Ulasan Anda telah dikirim</p>
            </div>
          ) : (
            <form onSubmit={handleKirimUlasan} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Rating Bintang:</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className={`text-2xl p-1 transition ${rating >= star ? 'scale-110' : 'opacity-30'}`}
                    >
                      ⭐
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Komentar / Pengalaman Servis:</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Bagaimana pelayanan di bengkel ini?"
                  value={komentar}
                  onChange={(e) => setKomentar(e.target.value)}
                  className="w-full p-2.5 border rounded-lg outline-none text-gray-800"
                />
              </div>

              <button
                type="submit"
                disabled={submittingReview}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  )
}