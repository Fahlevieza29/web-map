"use client";
import { Box, Button, TextField } from "@mui/material";
import React, { useState, useEffect } from "react";
import { Print as PrintIcon, Visibility, VisibilityOff } from "@mui/icons-material";
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

const PrintMapButton = ({ mapInstance, legendElement }) => {
  const [isMasking, setIsMasking] = useState(false);
  const [title, setTitle] = useState("");

  const showMaskArea = () => {
    setIsMasking((prevstate) => !prevstate);
  };

  const printHandler = async () => {
    if (!mapInstance || !title) return;

    try {
      // Capture map screenshot
      const mapContainer = mapInstance.getContainer();
      const screenshotCanvas = await html2canvas(mapContainer);

      // Create PDF document
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [420, 297], // A3 size format
      });

      // Add map screenshot to PDF
      pdf.addImage(screenshotCanvas.toDataURL(), "PNG", 10, 10, 290, 277);

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

      // Add two columns: Proyeksi Peta and Sumber
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

      // Add legend if available
      if (legendElement) {
        const legendCanvas = await html2canvas(legendElement);
        const legendImage = legendCanvas.toDataURL("image/png");
        pdf.addImage(legendImage, "PNG", 305, 98, 110, 140);
      }

      // Draw borders
      pdf.setLineWidth(1);
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(5, 5, 410, 287);
      pdf.rect(305, 5, 110, 45);
      pdf.rect(305, 50, 110, 50);
      pdf.rect(305, 100, 110, 140);
      pdf.rect(305, 240, 110, 52);

      // Open PDF in new window
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsMasking(false);
    }
  };

  return (
    <Box
      sx={{
        position: "absolute",
        right: "20px",
        top: "20px",
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
        label="Judul Peta"
        placeholder="Masukan Judul Peta"
        fullWidth
      />
      <Box sx={{ display: "flex", gap: "10px" }}>
        <Button
          startIcon={isMasking ? <Visibility /> : <VisibilityOff />}
          variant="contained"
          onClick={showMaskArea}
          size="small"
          sx={{
            backgroundColor: "#003577",
            "&:hover": { backgroundColor: "#002755" },
          }}
        >
          Print Area
        </Button>
        <Button
          startIcon={<PrintIcon />}
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
            zIndex: 999,
          }}
        />
      )}
    </Box>
  );
};

export default PrintMapButton;
