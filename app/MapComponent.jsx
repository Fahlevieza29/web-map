"use client";

import { useEffect, useRef, useState } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
// ArcGIS imports
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import TileLayer from "@arcgis/core/layers/TileLayer";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery";
import Expand from "@arcgis/core/widgets/Expand";
import Graphic from "@arcgis/core/Graphic";
import Search from "@arcgis/core/widgets/Search";
import Swipe from "@arcgis/core/widgets/Swipe";
import ScaleBar from "@arcgis/core/widgets/ScaleBar";
import Sketch from "@arcgis/core/widgets/Sketch";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
// MUI imports
import { Box, Button, IconButton } from "@mui/material";
import { Layers, Menu, MenuOpen, Delete } from "@mui/icons-material";
// Components
import Print from "./Component/Print";
import LayerList from "./Component/LayerList";
import Catalog from "./Component/Catalog";
import LayerInfo from "./Component/LayerInfo";
import LayerQuery from "./Component/LayerQuery";

const modalStyle = {
  position: "absolute",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "center",
  top: "50vh",
  left: "50vw",
  transform: "translate(-50%, -50%)",
  width: "50vw",
  height: "50vh",
  bgcolor: "white",
  border: "2px solid #000",
  boxShadow: 24,
  p: 2,
  borderRadius: 4,
  color: "black",
  zIndex: 2000,
};

const MapComponent = () => {
  const mapContainerRef = useRef(null);
  const viewRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [mejaKerjaOpen, setMejaKerjaOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [addedLayers, setAddedLayers] = useState([]);
  const [layerList, setLayerList] = useState([]);
  const [view, setView] = useState(null);
  const [infoLayerOpen, setInfoLayerOpen] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState(null);
  const [queryOpen, setQueryOpen] = useState(false);
  const [data, setData] = useState(null);
  const [searchInput, setSearchInput] = useState("");
  const [allLayer, setAllLayer] = useState("");
  const [group, setGroup] = useState(null);
  const [currentGroupName, setCurrentGroupName] = useState("");
  const [tableLayer, setTableLayer] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // Add state for location
  const [locationPermission, setLocationPermission] = useState('prompt'); // Add new state

  const mejaKerjaToggle = () => setMejaKerjaOpen(!mejaKerjaOpen);
  const handleCatalogToggle = () => {
    setCatalogOpen(!catalogOpen);
    // Add console log for debugging
    console.log("Catalog toggled:", !catalogOpen);
  };

  const handleRemoveAll = () => {
    if (viewRef.current) {
      // Remove all added layers
      addedLayers.forEach((layer) => viewRef.current.map.remove(layer));
      setAddedLayers([]);
      setLayerList([]);
    }
  };

  // Initialize ArcGIS Map
  useEffect(() => {
    if (!viewRef.current && mapContainerRef.current) {
      // Create graphics layer first
      const sketchLayer = new GraphicsLayer();

      // Create satellite layer
      const satelliteLayer = new TileLayer({
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer",
        title: "World Imagery"
      });

      // Create streets layer
      const streetsLayer = new TileLayer({
        url: "https://services.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer",
        title: "World Street Map"
      });

      const map = new Map({
        basemap: "streets-navigation-vector",
        layers: [satelliteLayer, streetsLayer, sketchLayer]  // Add both layers
      });

      const view = new MapView({
        container: mapContainerRef.current,
        map: map,
        center: [106.80252962638318, -6.2185601286463585],
        zoom: 15
      });

      // Configure BasemapGallery
      const basemapGallery = new BasemapGallery({
        view: view,
        source: {
          portal: {
            url: "https://www.arcgis.com",
            useVectorBasemaps: true // Enable vector basemaps
          }
        }
      });

      // Create expand widget
      const bgExpand = new Expand({
        view: view,
        content: basemapGallery,
        expanded: false
      });

      // Add to UI
      view.ui.add(bgExpand, "top-right");

      // Create search widget
      const searchWidget = new Search({
        view: view,
        locationEnabled: true,
        popupEnabled: true,
        position: "top-right"
      });

      // Add widget to the view
      view.ui.add(searchWidget, {
        position: "top-right",
        index: 2
      });

      // Create and add Swipe widget
      const swipe = new Swipe({
        view: view,
        leadingLayers: [satelliteLayer],    // Satellite on one side
        trailingLayers: [streetsLayer],     // Streets on other side
        position: 35,                       // 35% from left
        direction: "horizontal"             // horizontal swipe
      });

      view.ui.add(swipe);

      // Configure ScaleBar
      const scaleBar = new ScaleBar({
        view: view,
        unit: "dual",
        style: "line",
        borderColor: [0, 0, 0, 0.5]
      });

      // Configure Sketch after layer is defined
      const sketch = new Sketch({
        view: view,
        layer: sketchLayer,
        creationMode: "continuous",
        visibleElements: {
          createTools: {
            point: true,
            polyline: true,
            polygon: true,
            rectangle: true,
            circle: true
          },
          selectionTools: {
            "lasso-selection": true,
            "rectangle-selection": true
          },
          settingsMenu: true,
          undoRedoMenu: true
        }
      });

      view.ui.add(sketch, {
        position: "bottom-right",
        index: 0
      });

      view.ui.add(scaleBar, {
        position: "bottom-left"
      });

      viewRef.current = view;
      setView(view);
      setIsMapReady(true);

      requestLocationPermission(); // Add permission check and location tracking
    }
  }, []);

  // Add useEffect for GPS tracking
  useEffect(() => {
    if (viewRef.current && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;

        // Create point geometry
        const point = {
          type: "point",
          longitude: longitude,
          latitude: latitude
        };

        // Create marker symbol
        const markerSymbol = {
          type: "simple-marker",
          color: "red",
          outline: {
            color: "white",
            width: 1
          }
        };

        // Create graphic
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: markerSymbol
        });

        // Add to view
        viewRef.current.graphics.removeAll(); // Clear existing
        viewRef.current.graphics.add(pointGraphic);

        // Center map on location
        viewRef.current.center = [longitude, latitude];
        viewRef.current.zoom = 15;

        setUserLocation({ latitude, longitude });
      }, (error) => {
        console.error("Geolocation error:", error);
      });
    }
  }, [viewRef.current]);

  // Add permission check and location tracking
  const requestLocationPermission = async () => {
    try {
      const permission = await navigator.permissions.query({ name: 'geolocation' });
      setLocationPermission(permission.state);

      if (permission.state === 'granted') {
        startLocationTracking();
      } else if (permission.state === 'prompt') {
        // Request permission
        navigator.geolocation.getCurrentPosition(
          () => {
            setLocationPermission('granted');
            startLocationTracking();
          },
          (error) => {
            console.error('Permission denied:', error);
            setLocationPermission('denied');
          }
        );
      }
    } catch (error) {
      console.error('Error requesting permission:', error);
    }
  };

  const startLocationTracking = () => {
    if (viewRef.current && navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          const point = {
            type: "point",
            longitude: longitude,
            latitude: latitude
          };

          const markerSymbol = {
            type: "simple-marker",
            color: "red",
            outline: {
              color: "white",
              width: 1
            }
          };

          const pointGraphic = new Graphic({
            geometry: point,
            symbol: markerSymbol
          });

          viewRef.current.graphics.removeAll();
          viewRef.current.graphics.add(pointGraphic);
          viewRef.current.center = [longitude, latitude];
          viewRef.current.zoom = 15;

          setUserLocation({ latitude, longitude });
        },
        (error) => {
          console.error('Location tracking error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0
        }
      );
    }
  };

  return (
    <Box sx={{ height: "100vh", width: "100vw", position: "relative" }}>
      <Box
        ref={mapContainerRef}
        sx={{
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 1,
        }}
      />

      {isMapReady && (
        <>
          <Box sx={{ position: "absolute", top: "150px", right: "30px", zIndex: 1000 }}>
            <Print view={view} addedLayers={addedLayers} buttonSize={"48px"} />
          </Box>

          {/* Meja Kerja Desktop */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              columnGap: "10px",
              position: "absolute",
              left: "2%",
              top: "10%",
              zIndex: 1000,
            }}
          >
            {/* Menu Toggle Button */}
            <Box
              sx={{
                display: "flex",
                width: "48px",
                height: "48px",
                backgroundColor: "white",
                borderRadius: 2,
                alignItems: "center",
                justifyContent: "center",
              }}
              id="meja-kerja-desktop"
            >
              <IconButton onClick={mejaKerjaToggle}>
                {mejaKerjaOpen ? <MenuOpen /> : <Menu />}
              </IconButton>
            </Box>

            {/* Meja Kerja Panel */}
            {mejaKerjaOpen && (
              <Box
                sx={{
                  width: "300px",
                  height: "500px",
                  display: "flex",
                  flexDirection: "column",
                  backgroundColor: "white",
                  borderRadius: 2,
                  padding: "13px",
                  boxShadow: 3,
                  overflowY: "auto",
                }}
                id="isi-meja-kerja-desktop"
              >
                {/* Catalog Button */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    marginBottom: "10px",
                  }}
                >
                  <Button
                    sx={{
                      width: "100%",
                      height: "40px",
                      color: "white",
                      backgroundColor: "#ffc425",
                      borderRadius: 2,
                      "&:hover": { backgroundColor: "#ffc425", color: "white" },
                    }}
                    onClick={handleCatalogToggle}
                    endIcon={<Layers />}
                    id="tombol-catalog-layer-desktop"
                  >
                    KATALOG LAYER
                  </Button>
                </Box>

                {/* Layer List */}
                <Box sx={{ flexGrow: 1, width: "100%" }}>
                  <LayerList
                    view={view}
                    addedLayers={addedLayers}
                    layerList={layerList}
                    setAddedLayers={setAddedLayers}
                    setLayerList={setLayerList}
                  />
                </Box>

                {/* Remove All Button */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "100%",
                    marginTop: "10px",
                  }}
                >
                  <Button
                    sx={{
                      width: "100%",
                      height: "40px",
                      color: "white",
                      backgroundColor: "#ff1a1a",
                      borderRadius: 2,
                      "&:hover": { backgroundColor: "#ff1a1a", color: "white" },
                    }}
                    onClick={handleRemoveAll}
                    endIcon={<Delete />}
                  >
                    Hapus Semua
                  </Button>
                </Box>
              </Box>
            )}
          </Box>

          {/* Modals */}
          <Box>
            {/* Catalog Modal */}
            {catalogOpen && (
              <Catalog
                view={viewRef.current}
                handleCatalogToggle={handleCatalogToggle}
                data={data}
                setData={setData}
                searchInput={searchInput}
                setSearchInput={setSearchInput}
                allLayer={allLayer}
                setAllLayer={setAllLayer}
                group={group}
                setGroup={setGroup}
                addedLayers={addedLayers}
                setAddedLayers={setAddedLayers}
                modalStyle={modalStyle}
                currentGroupName={currentGroupName}
                setCurrentGroupName={setCurrentGroupName}
              />
            )}

            {/* Layer Info Modal */}
            <Box
              display={infoLayerOpen ? "flex" : "none"}
              sx={modalStyle}
              id="layer-info-content"
            >
              {selectedLayer && (
                <LayerInfo
                  layer={selectedLayer}
                  setInfoLayerOpen={setInfoLayerOpen}
                />
              )}
            </Box>

            {/* Layer Query Modal */}
            <Box
              display={queryOpen ? "flex" : "none"}
              sx={modalStyle}
              id="layer-query-content"
            >
              {selectedLayer && (
                <LayerQuery
                  view={mapInstanceRef.current}
                  layer={selectedLayer}
                  queryOpen={queryOpen}
                  setQueryOpen={setQueryOpen}
                />
              )}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
};

export default MapComponent;