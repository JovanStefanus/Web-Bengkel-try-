import Link from 'next/link'
import LogoutButton from '@/components/LogoutButton'

export default function BengkelDashboard() {
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header Dashboard Bengkel dengan Tombol Logout */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Dashboard Mitra Bengkel</h1>
          <p className="text-gray-500 text-sm">Kelola profil bengkel, layanan, dan booking masuk dari customer</p>
        </div>
        <LogoutButton />
      </div>

      {/* Grid Menu Bengkel (3 Kolom) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link 
          href="/bengkel/profil" 
          className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition group"
        >
          <div className="text-3xl mb-2">🏢</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Profil & Lokasi Bengkel</h3>
          <p className="text-xs text-gray-500 mt-1">Atur nama, alamat, koordinat peta (lat/lng), dan jam operasional</p>
        </Link>

        <Link 
          href="/bengkel/servis" 
          className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition group"
        >
          <div className="text-3xl mb-2">🛠️</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Kelola Layanan Servis</h3>
          <p className="text-xs text-gray-500 mt-1">Atur jenis layanan servis dan tarif harganya</p>
        </Link>

        <Link 
          href="/bengkel/booking" 
          className="p-6 bg-white border border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition group"
        >
          <div className="text-3xl mb-2">📋</div>
          <h3 className="font-bold text-gray-800 group-hover:text-blue-600">Kelola Booking Masuk</h3>
          <p className="text-xs text-gray-500 mt-1">Terima booking masuk dan atur status pengerjaan servis</p>
        </Link>
      </div>
    </div>
  )
}