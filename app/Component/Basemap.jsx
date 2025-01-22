"use client";

import React, { useEffect, useRef } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import Basemap from "@arcgis/core/Basemap";
import VectorTileLayer from "@arcgis/core/layers/VectorTileLayer";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Expand from "@arcgis/core/widgets/Expand";

const BasemapComponent = ({ view }) => {
  const basemapRef = useRef(null);

  useEffect(() => {
    if (view && !basemapRef.current) {
      // Create BasemapGallery widget
      const basemapGallery = new BasemapGallery({
        view: view
      });

      // Create expand widget
      const bgExpand = new Expand({
        view: view,
        content: basemapGallery,
        expandIconClass: "esri-icon-basemap",
        expanded: false
      });

      // Add widget to the view
      view.ui.add(bgExpand, "top-right");

      // Store reference
      basemapRef.current = basemapGallery;

      // Cleanup
      return () => {
        if (basemapRef.current) {
          view.ui.remove(bgExpand);
          basemapRef.current.destroy();
        }
      };
    }
  }, [view]);

  return null;
};

const MapComponent = () => {
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

      const view = new MapView({
        container: mapRef.current,
        center: [-100, 40], // Longitude, Latitude
        zoom: 3,
        map: map,
      });

      return () => {
        if (view) {
          view.destroy();
        }
      };
    }
  }, []);

  return (
    <div ref={mapRef} style={{ height: "100vh", width: "100vw" }}>
      <BasemapComponent view={view} />
    </div>
  );
};

export default MapComponent;
