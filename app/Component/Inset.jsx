"use client";

import { useEffect, useRef } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import TileLayer from "@arcgis/core/layers/TileLayer";

const Inset = () => {
  const insetRef = useRef(null);

  // Initialize ArcGIS Map
  useEffect(() => {
    if (InsetRef.current) {
      const customBasemap = new TileLayer({
        url: "https://tataruang.jakarta.go.id/server/rest/services/peta_dasar/Peta_Dasar_DKI_Jakarta/MapServer", // Replace with your custom basemap URL
      });

      const map = new Map({
        basemap: "streets", // Optional: Set a basemap in addition to the custom basemap
        layers: [customBasemap],
      });

      const view = new MapView({
        container: InsetRef.current,
        map: map,
        center: [106.80252962638318, -6.2185601286463585], // [longitude, latitude]
        zoom: 10,
      });

      return () => {
        view.destroy(); // Clean up the view on component unmount
      };
    }
  }, []);

  return (
    <div
      ref={InsetRef}
      style={{ height: "100vh", width: "100vw", position: "relative" }}
    ></div>
  );
};

export default Inset;
