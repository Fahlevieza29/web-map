"use client";

import dynamic from 'next/dynamic';
import { Box } from '@mui/material'; 

const MapComponent = dynamic(() => import('../app/MapComponent'), { ssr: false });

export default function Home() {
  return (
    <Box sx={{ width: '100vw', height: '100vh', backgroundColor: 'white' }}>
      <MapComponent />
    </Box>
  );
}