"use client";

import { useEffect, useRef } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Basemap from "@arcgis/core/Basemap";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";

const Basemap = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapRef.current) {
      const map = new Map({
        basemap: new Basemap({
          baseLayers: [
            new VectorTileLayer({
              portalItem: {
                id: "7f6ae34b6cf749cd86de9df23421d701", // Replace with your Basemap ID
              },
            }),
          ],
        }),
      });

      new MapView({
        container: mapRef.current,
        center: [-100, 40], // Longitude, Latitude
        zoom: 3,
        map: map,
      });
    }
  }, []);

  return <div ref={mapRef} style={{ height: "100vh", width: "100vw" }}></div>;
};

export default Basemap;
