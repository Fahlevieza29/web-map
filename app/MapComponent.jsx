"use client";

import { useEffect, useRef, useState } from 'react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Box, Button } from '@mui/material';
import SideBySideControl from './SideBySideControl'; // Import komponen side-by-side
import Print from './Print';


const MapComponent = () => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null); // Referensi untuk instance peta
  const baseLayerRef = useRef(null); // Referensi untuk basemap awal
  const [showSideBySide, setShowSideBySide] = useState(false); // State untuk side-by-side

  useEffect(() => {
    if (!mapInstanceRef.current && mapContainerRef.current) {
      // Inisialisasi peta awal
      const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      });

      const map = L.map(mapContainerRef.current, {
        center: [-6.2185601286463585, 106.80252962638318], // Koordinat Jakarta
        zoom: 15,
        layers: [baseLayer], // Gunakan basemap awal
      });

      // Simpan instance peta dan basemap awal di referensi
      mapInstanceRef.current = map;
      baseLayerRef.current = baseLayer;
    }
  }, []);

  return (
    <Box
      sx={{
        height: '100vh',
        width: '100vw',
        position: 'relative',
      }}
    >
      <Box
        ref={mapContainerRef}
        sx={{
          height: '100%',
          width: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />
      
      <Print mapInstance={mapInstanceRef.current} legendElement={document.querySelector('.leaflet-control-layers')} />
      
      <SideBySideControl mapInstance={mapInstanceRef.current} showSideBySide={showSideBySide} />
      {!showSideBySide ? (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setShowSideBySide(true)}
          sx={{
            position: 'absolute',
            bottom: '700px',
            right: '15px',
            zIndex: 1000,
          }}
        >
          Show Side-by-Side
        </Button>
      ) : (
        <Button
          variant="contained"
          color="secondary"
          onClick={() => setShowSideBySide(false)}
          sx={{
            position: 'absolute',
            bottom: '700px',
            right: '15px',
            zIndex: 1000,
          }}
        >
          Close Side-by-Side
        </Button>
      )}
    </Box>
  );
};

export default MapComponent;
