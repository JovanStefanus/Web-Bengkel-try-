import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default async function CustomerDashboard() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header Dashboard Customer dengan Tombol Logout */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Selamat Datang, {profile?.nama || 'Customer'}!
          </h1>
          <p className="text-gray-500 text-sm">Platform Marketplace Bengkel Motor & Mobil</p>
        </div>
        <LogoutButton />
      </div>

      {/* Grid Kartu Menu Navigasi */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          href="/customer/kendaraan"
          className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition group"
        >
          <div className="text-3xl mb-2">🚗</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Kendaraan Saya</h3>
          <p className="text-xs text-gray-500 mt-1">Tambah & kelola daftar motor / mobil Anda</p>
        </Link>

        <Link
          href="/customer/cari-bengkel"
          className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition group"
        >
          <div className="text-3xl mb-2">🔧</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Cari Bengkel Terdekat</h3>
          <p className="text-xs text-gray-500 mt-1">Peta Leaflet & radius 5-10km PostGIS</p>
        </Link>

        <Link
          href="/customer/booking"
          className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition group"
        >
          <div className="text-3xl mb-2">📡</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Status Servis Real-time</h3>
          <p className="text-xs text-gray-500 mt-1">Pantau proses pengerjaan secara langsung</p>
        </Link>
      </div>
    </div>
  )
}