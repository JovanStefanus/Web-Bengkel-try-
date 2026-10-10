'use client'

import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'

interface BengkelItem {
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

interface BengkelMapProps {
  userLat: number
  userLng: number
  bengkelList: BengkelItem[]
  onSelectBengkel?: (bengkel: BengkelItem) => void
}

export default function BengkelMap({ userLat, userLng, bengkelList, onSelectBengkel }: BengkelMapProps) {
  const [L, setL] = useState<any>(null)

  useEffect(() => {
    // Import leaflet secara dinamis untuk client side saja
    import('leaflet').then((leaflet) => {
      // Fix icon marker default leaflet
      delete (leaflet.Icon.Default.prototype as any)._getIconUrl
      leaflet.Icon.Default.mergeOptions({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      })
      setL(leaflet)
    })
  }, [])

  useEffect(() => {
    if (!L) return

    const mapElement = document.getElementById('map')
    if (!mapElement) return

    // Hapus map instance lama jika ada
    const container = L.DomUtil.get('map')
    if (container != null) {
      container._leaflet_id = null
    }

    const map = L.map('map').setView([userLat, userLng], 13)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map)

    // Marker Lokasi Customer (Warna Biru/Default)
    L.marker([userLat, userLng])
      .addTo(map)
      .bindPopup('<b>Lokasi Anda</b>')
      .openPopup()

    // Marker Bengkel Terdekat
    bengkelList.forEach((b) => {
      const marker = L.marker([b.lat, b.lng]).addTo(map)
      marker.bindPopup(`
        <div style="font-family: sans-serif;">
          <h4 style="margin: 0 0 4px 0; font-weight: bold;">${b.nama}</h4>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #555;">${b.alamat}</p>
          <span style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px;">
            ${b.jarak_km} km • ${b.jenis_kendaraan}
          </span>
        </div>
      `)
      marker.on('click', () => {
        if (onSelectBengkel) onSelectBengkel(b)
      })
    })

    return () => {
      map.remove()
    }
  }, [L, userLat, userLng, bengkelList, onSelectBengkel])

  return <div id="map" className="w-full h-[400px] rounded-xl shadow-inner border border-gray-200 z-0" />
}