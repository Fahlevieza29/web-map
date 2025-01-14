import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@mui/material';
import CompareArrowsOutlined from '@mui/icons-material/CompareArrowsOutlined';
import CloseTwoTone from '@mui/icons-material/CloseTwoTone';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet-side-by-side';

const SideBySideControl = ({ mapInstance }) => {
  const [showSideBySide, setShowSideBySide] = useState(false);
  const sideBySideRef = useRef(null);
  const leftLayerRef = useRef(null);
  const rightLayerRef = useRef(null);
  const baseLayerRef = useRef(null);

  useEffect(() => {
    if (!mapInstance) return;

    if (showSideBySide) {
      // Remove base layer when enabling side-by-side
      if (baseLayerRef.current) {
        mapInstance.removeLayer(baseLayerRef.current);
      }

      // Initialize left and right layers
      const leftLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      });
      const rightLayer = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        {
          attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        }
      );

      leftLayerRef.current = leftLayer.addTo(mapInstance);
      rightLayerRef.current = rightLayer.addTo(mapInstance);

      // Add side-by-side control
      sideBySideRef.current = L.control.sideBySide(leftLayerRef.current, rightLayerRef.current).addTo(mapInstance);
    } else {
      // Remove side-by-side control
      if (sideBySideRef.current) {
        sideBySideRef.current.remove();
        sideBySideRef.current = null;
      }

      // Remove left and right layers
      if (leftLayerRef.current) {
        mapInstance.removeLayer(leftLayerRef.current);
        leftLayerRef.current = null;
      }
      if (rightLayerRef.current) {
        mapInstance.removeLayer(rightLayerRef.current);
        rightLayerRef.current = null;
      }

      // Re-add base layer
      if (baseLayerRef.current) {
        baseLayerRef.current.addTo(mapInstance);
      } else {
        const baseLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors',
        });
        baseLayerRef.current = baseLayer.addTo(mapInstance);
      }
    }

    // Cleanup DOM elements for the side-by-side splitter
    return () => {
      if (!showSideBySide) {
        document.querySelectorAll('.leaflet-sbs-divider').forEach((divider) => divider.remove());
        document.querySelectorAll('.leaflet-sbs-handle').forEach((handle) => handle.remove());
      }
    };
  }, [showSideBySide, mapInstance]);

  const toggleSideBySide = () => {
    setShowSideBySide((prev) => !prev);
  };

  return (
    <>
      <Button
        variant="contained"
        color={showSideBySide ? 'secondary' : 'primary'}
        onClick={toggleSideBySide}
        startIcon={showSideBySide ? <CloseTwoTone /> : <CompareArrowsOutlined />}
        sx={{
          position: 'absolute',
          top: '10px',
          right: '50px',
          zIndex: 1000,
        }}
      >
        {showSideBySide ? 'Close Side-by-Side' : 'Show Side-by-Side'}
      </Button>
    </>
  );
};

export default SideBySideControl;
