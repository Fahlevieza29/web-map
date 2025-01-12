"use client";

import { Box, Button, TextField } from "@mui/material";
import React, { useState } from "react";
import { Print as PrintIcon, Visibility, VisibilityOff } from "@mui/icons-material";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const PrintMapButton = ({ mapInstance, legendElement }) => {
  const [isMasking, setIsMasking] = useState(false);
  const [title, setTitle] = useState("");

  const showMaskArea = () => {
    setIsMasking((prevstate) => !prevstate);
  };

  const printHandler = async () => {
    if (!mapInstance) return;

    try {
      const mmToPx = 3.779527559;
      const maskWidth = 290 * mmToPx;
      const maskHeight = 277 * mmToPx;
      
      // Get map container and create screenshot
      const mapContainer = mapInstance.getContainer();
      const screenshotCanvas = await html2canvas(mapContainer);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [420, 297], // A3 size format
      });

      // Add map screenshot to PDF
      pdf.addImage(screenshotCanvas.toDataURL(), "PNG", 10, 10, 290, 277);

      // Add logos
      try {
        const jakartaLogo = await loadImageToCanvas("/print/logojkt_new.png");
        pdf.addImage(jakartaLogo, "PNG", 315, 267, 20, 20);

        const jakarta1Logo = await loadImageToCanvas("/print/logo_jktsatu.png");
        pdf.addImage(jakarta1Logo, "PNG", 345, 267, 20, 20);

        const arahUtara = await loadImageToCanvas("/print/arah_utara.png");
        pdf.addImage(arahUtara, "PNG", 350, 55, 20, 30);
      } catch (error) {
        console.error("Error loading logos:", error);
      }

      // Add title
      pdf.setFontSize(20);
      pdf.setTextColor(0, 0, 0);
      pdf.setFont("arial", "normal", "normal");
      pdf.text(title, 360, 20, { align: "center" });

      // Add timestamp
      const currentTimestamp = new Date();
      currentTimestamp.setHours(currentTimestamp.getUTCHours() + 7);
      const year = currentTimestamp.getFullYear();
      const month = String(currentTimestamp.getMonth() + 1).padStart(2, "0");
      const day = String(currentTimestamp.getDate()).padStart(2, "0");
      const hours = String(currentTimestamp.getHours()).padStart(2, "0");
      const minutes = String(currentTimestamp.getMinutes()).padStart(2, "0");
      const seconds = String(currentTimestamp.getSeconds()).padStart(2, "0");
      const formattedTimestamp = `Waktu pembuatan : ${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      pdf.setFontSize(14);
      pdf.text(formattedTimestamp, 315, 250, { align: "left" });

      // Add legend if available
      if (legendElement) {
        try {
          const legendCanvas = await html2canvas(legendElement);
          const legendImage = legendCanvas.toDataURL("image/png");
          pdf.addImage(legendImage, "PNG", 305, 98, 110, 140);
        } catch (error) {
          console.error("Error capturing legend:", error);
        }
      }

      // Draw borders
      pdf.setLineWidth(1);
      pdf.setDrawColor(0, 0, 0);
      pdf.rect(5, 5, 410, 287, "D");
      pdf.rect(305, 5, 110, 45, "D");
      pdf.rect(305, 50, 110, 50, "D");
      pdf.rect(305, 100, 110, 140, "D");
      pdf.rect(305, 240, 110, 52, "D");

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

  const loadImageToCanvas = async (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = src;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      };
      img.onerror = reject;
    });
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        position: "absolute",
        right: "20px",
        top: "20px",
        width: "300px",
        rowGap: "10px",
        backgroundColor: "white",
        padding: "10px",
        borderRadius: "4px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
        zIndex: 1000,
      }}
    >
      <TextField
        sx={{ width: "280px" }}
        value={title}
        size="small"
        multiline
        onChange={(e) => setTitle(e.target.value)}
        required
        label="Judul Peta"
        placeholder="Masukan Judul Peta"
      />
      <Box sx={{ display: "flex", gap: "10px" }}>
        <Button
          startIcon={isMasking ? <Visibility /> : <VisibilityOff />}
          variant="contained"
          sx={{
            color: "white",
            boxShadow: "3px 3px 8px 1px rgba(0, 0, 0, 0.25)",
            backgroundColor: "#003577",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#002755"
            }
          }}
          onClick={showMaskArea}
          size="small"
        >
          Print Area
        </Button>
        <Button
          startIcon={<PrintIcon />}
          variant="contained"
          sx={{
            color: "white",
            boxShadow: "3px 3px 8px 1px rgba(0, 0, 0, 0.25)",
            backgroundColor: "#00c400",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#009900"
            }
          }}
          onClick={printHandler}
          size="small"
          disabled={!title}
        >
          Print
        </Button>
      </Box>
      {isMasking && (
        <Box
          sx={{
            position: "fixed",
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