"use client";

import { Box, Button, TextField } from "@mui/material";
import React, { useEffect, useRef, useState } from "react";
import "@arcgis/core/assets/esri/themes/light/main.css";
import Map from "@arcgis/core/Map.js";
import MapView from "@arcgis/core/views/MapView.js";
import Popup from "@arcgis/core/widgets/Popup";
import { Print, Visibility, VisibilityOff } from "@mui/icons-material";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import Legend from "@arcgis/core/widgets/Legend.js";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

// Helper function to load an image and convert it to canvas data
const loadImageToCanvas = (src) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      resolve(canvas.toDataURL());
    };
    img.onerror = reject;
    img.src = src;
  });
};

const MapComponent = () => {
  const mapRef = useRef();
  const [view, setView] = useState();
  const [isMasking, setIsMasking] = useState(false);
  const [title, setTitle] = useState("");
  const [legend, setLegend] = useState(null);

  useEffect(() => {
    const fetchAPI = async () => {
      const map = new Map({
        basemap: "streets",
      });

      const view = new MapView({
        map: map,
        container: mapRef.current,
        center: [106.80252962638318, -6.2185601286463585],
        zoom: 15,
        ui: {
          components: ["attribution"],
        },
        popupEnabled: true,
        popup: new Popup({
          defaultPopupTemplateEnabled: true,
          dockEnabled: false,
          dockOptions: {
            buttonEnabled: false,
            breakpoint: false,
          },
          visibleElements: {
            closeButton: true,
          },
        }),
      });
      setView(view);

      const legendWidget = new Legend({
        view: view,
        container: document.createElement("div"),
      });
      view.ui.add(legendWidget, "bottom-right");
      setLegend(legendWidget);

      try {
        const response = await fetch(
          "https://jakartasatu.jakarta.go.id/apimobile/app/web/maps"
        );
        const data = await response.json();
        const layers = data.data[1].maps[1].layers.map(
          (layer) =>
            new FeatureLayer({
              url: layer.service_url,
              title: layer.name,
            })
        );
        view.map.addMany(layers);
      } catch (error) {
        console.error("Error fetching layers:", error);
      }
    };

    fetchAPI();

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, []);

  const printHandler = async () => {
    if (!view || !title) return;

    try {
      // Take screenshot
      const screenshot = await view.takeScreenshot({
        area: { x: 100, y: 100, width: 500, height: 400 },
        format: "png",
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [420, 297], // A3 size
      });

      const viewCanvas = document.createElement("canvas");
      viewCanvas.width = screenshot.data.width;
      viewCanvas.height = screenshot.data.height;
      const context = viewCanvas.getContext("2d");
      const img = document.createElement("img");
      img.src = screenshot.dataUrl;

      img.onload = async () => {
        context.drawImage(img, 0, 0, screenshot.data.width, screenshot.data.height);

        pdf.addImage(viewCanvas, "PNG", 10, 10, 290, 277);

        // Add logos
        const jakartaLogo = await loadImageToCanvas("/print/logojkt_new.png");
        pdf.addImage(jakartaLogo, "PNG", 315, 267, 20, 20);

        const jakarta1Logo = await loadImageToCanvas("/print/logo_jktsatu.png");
        pdf.addImage(jakarta1Logo, "PNG", 345, 267, 20, 20);

        const arahUtara = await loadImageToCanvas("/print/arah_utara.png");
        pdf.addImage(arahUtara, "PNG", 350, 55, 20, 30);

        // Add title
        pdf.setFontSize(20);
        pdf.setTextColor(0, 0, 0);
        pdf.setFont("arial", "normal", "normal");
        pdf.text(title, 360, 20, { align: "center" });

        // Add two columns with bold titles and separator
        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold"); // Bold for "Proyeksi Peta"
        pdf.text("Proyeksi Peta", 315, 250);
        pdf.setFont(undefined, "normal");
        pdf.setFontSize(12);
        pdf.text("Projection: Universal Transvers Mercator", 315, 260);
        pdf.text("Zona: UTM 47 S", 315, 270);
        pdf.text("Datum: WGS 1984", 315, 280);

        pdf.setFontSize(14);
        pdf.setFont(undefined, "bold"); // Bold for "Sumber"
        pdf.text("Sumber", 370, 250);
        pdf.setFont(undefined, "normal");
        pdf.setFontSize(12);
        pdf.text("Data JakartaSatu", 370, 260);

        // Add vertical separator line
        pdf.setLineWidth(0.5);
        pdf.line(365, 245, 365, 292); // Vertical line between columns

        // Add legend
        const legendElement = document.querySelector(".esri-legend");
        if (legendElement) {
          const legendCanvas = await html2canvas(legendElement);
          pdf.addImage(legendCanvas.toDataURL(), "PNG", 305, 100, 110, 140);
        }

        // Add borders
        pdf.setLineWidth(1);
        pdf.rect(5, 5, 410, 287);
        pdf.rect(305, 5, 110, 45);
        pdf.rect(305, 50, 110, 50);
        pdf.rect(305, 100, 110, 140);
        pdf.rect(305, 240, 110, 52);

        // Open PDF
        const pdfBlob = pdf.output("blob");
        window.open(URL.createObjectURL(pdfBlob));
      };
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    }
  };

  return (
    <Box
      id="map-div"
      sx={{
        width: "100%",
        height: "100%",
        position: "relative",
      }}
      ref={mapRef}
    >
      <Box
        sx={{
          position: "absolute",
          left: "3%",
          top: "3%",
          width: "300px",
          backgroundColor: "white",
          padding: "10px",
          borderRadius: "4px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
        }}
      >
        <TextField
          value={title}
          size="small"
          multiline
          onChange={(e) => setTitle(e.target.value)}
          required
          label="Required"
          placeholder="Masukan Judul Peta"
          fullWidth
        />
        <Box sx={{ display: "flex", gap: "10px" }}>
          <Button
            startIcon={isMasking ? <Visibility /> : <VisibilityOff />}
            variant="contained"
            onClick={() => setIsMasking(!isMasking)}
            size="small"
            sx={{
              backgroundColor: "#003577",
              "&:hover": { backgroundColor: "#002755" },
            }}
          >
            Print Area
          </Button>
          <Button
            startIcon={<Print />}
            variant="contained"
            onClick={printHandler}
            size="small"
            disabled={!title}
            sx={{
              backgroundColor: "#00c400",
              "&:hover": { backgroundColor: "#009900" },
            }}
          >
            Print
          </Button>
        </Box>
      </Box>

      {isMasking && (
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "290mm",
            height: "277mm",
            background: "rgba(255, 51, 0, 0.1)",
            border: "2px dashed rgb(255, 51, 0)",
            pointerEvents: "none",
            zIndex: 998,
          }}
        />
      )}
    </Box>
  );
};

export default MapComponent;
