"use client";

import { useEffect, useRef } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import TileLayer from "@arcgis/core/layers/TileLayer";
import { watch } from "@arcgis/core/core/reactiveUtils";

const Inset = ({ mainView }) => {
  const insetRef = useRef(null);

  useEffect(() => {
    if (!mainView || !insetRef.current) return;

    // Create inset map
    const map = new Map({
      basemap: "streets-navigation-vector"
    });

    // Create inset view
    const insetView = new MapView({
      container: insetRef.current,
      map: map,
      center: mainView.center,
      zoom: mainView.zoom - 3,
      constraints: {
        rotationEnabled: false
      },
      ui: {
        components: [] // Remove all UI components
      }
    });

    // Sync with main view
    const watchHandle = watch(
      () => mainView.extent,
      (extent) => {
        insetView.extent = extent;
      }
    );

    // Cleanup
    return () => {
      watchHandle.remove();
      insetView.destroy();
    };
  }, [mainView]);

  return (
    <div
      ref={insetRef}
      style={{
        width: '100%',
        height: '100%',
        border: '1px solid #ccc',
        backgroundColor: 'white'
      }}
    />
  );
};

export default Inset;
