"use client";

import { useEffect, useRef, useState } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import TileLayer from "@arcgis/core/layers/TileLayer";
import { Box, Button, IconButton } from "@mui/material";
import { Layers, Menu, MenuOpen, Delete } from "@mui/icons-material";
import SideBySideControl from "./Component/SideBySideControl";
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

  const mejaKerjaToggle = () => setMejaKerjaOpen(!mejaKerjaOpen);
  const handleCatalogToggle = () => setCatalogOpen(!catalogOpen);

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
      const customBasemap = new TileLayer({
        url: "https://tataruang.jakarta.go.id/server/rest/services/peta_dasar/Peta_Dasar_DKI_Jakarta/MapServer", // Ganti dengan URL basemap kustom Anda
      });
      
      const map = new Map({
        layers: [customBasemap],
      });

      const view = new MapView({
        container: mapContainerRef.current,
        map: map,
        center: [106.80252962638318, -6.2185601286463585], // [longitude, latitude]
        zoom: 15,
      });

      viewRef.current = view;
      setView(view);
      setIsMapReady(true);
    }
  }, []);

  return (
    <Box sx={{ height: "100vh", width: "100vw", position: "relative" }}>
      {/* Map Container */}
      <Box
        ref={mapContainerRef}
        sx={{
          height: "100%",
          width: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          zIndex: 10,
        }}
      />

      {isMapReady && (
        <>
          {/* Map Controls */}
         
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
                view={view}
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
