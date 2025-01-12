import { useEffect, useRef } from 'react';
import 'leaflet/dist/leaflet.css';
import 'leaflet-side-by-side';
import L from 'leaflet';

const SideBySide = ({ showSideBySide, mapInstance }) => {
  const sideBySideRef = useRef(null); // Referensi kontrol side-by-side
  const leftLayerRef = useRef(null); // Referensi layer kiri
  const rightLayerRef = useRef(null); // Referensi layer kanan
  const baseLayerRef = useRef(null); // Referensi basemap awal

  useEffect(() => {
    if (!mapInstance) return;

    // Tambahkan basemap awal jika belum ada
    if (!baseLayerRef.current) {
      const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      });
      baseLayerRef.current = baseLayer;
      baseLayer.addTo(mapInstance);
    }

    // Logika untuk mengelola basemap dan kontrol side-by-side
    if (!showSideBySide) {
      // Pastikan basemap awal ditambahkan kembali jika side-by-side dinonaktifkan
      if (baseLayerRef.current) {
        baseLayerRef.current.addTo(mapInstance);
      }

      // Hapus side-by-side jika ada
      if (sideBySideRef.current) {
        sideBySideRef.current.remove();
        sideBySideRef.current = null;
      }

      // Hapus layer kiri dan kanan
      if (leftLayerRef.current) {
        mapInstance.removeLayer(leftLayerRef.current);
        leftLayerRef.current = null;
      }
      if (rightLayerRef.current) {
        mapInstance.removeLayer(rightLayerRef.current);
        rightLayerRef.current = null;
      }

      // Hapus elemen splitter jika ada
      document.querySelectorAll('.leaflet-sbs-divider').forEach((divider) => divider.remove());
      document.querySelectorAll('.leaflet-sbs-handle').forEach((handle) => handle.remove());
    } else {
      // Hapus basemap awal jika side-by-side diaktifkan
      if (baseLayerRef.current) {
        mapInstance.removeLayer(baseLayerRef.current);
      }

      // Tambahkan layer untuk side-by-side
      const leftLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      });
      const rightLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        }
      );

      // Simpan referensi layer
      leftLayerRef.current = leftLayer.addTo(mapInstance);
      rightLayerRef.current = rightLayer.addTo(mapInstance);

      // Tambahkan kontrol side-by-side
      const sideBySide = L.control.sideBySide(leftLayerRef.current, rightLayerRef.current).addTo(mapInstance);
      sideBySideRef.current = sideBySide;
    }
  }, [showSideBySide, mapInstance]);

  return null; 
};

export default SideBySide;
