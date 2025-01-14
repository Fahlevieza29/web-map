import { Box, IconButton, Dialog, DialogTitle, DialogContent, TextField, Button } from "@mui/material";
import React, { useState } from "react";
import { Print as PrintIcon } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const Print = ({ view }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [title, setTitle] = useState("");
  const [isReadyToPrint, setIsReadyToPrint] = useState(false);

  const handlePrintClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setTitle("");
  };

  const handleAreaSelect = () => {
    setIsDialogOpen(false);
    setIsMasking(true);
    setIsReadyToPrint(true);
  };

  const handlePrintArea = async () => {
    if (!view) return;

    try {
      // Capture the map's viewport
      const mapContainer = view.container;
      const screenshotCanvas = await html2canvas(mapContainer);

      // Create PDF
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: [420, 297], // A3 size
      });

      // Add map image to PDF
      pdf.addImage(screenshotCanvas.toDataURL(), "PNG", 10, 10, 290, 277);

      // Add title to the PDF
      pdf.setFontSize(20);
      pdf.text(title, 360, 20, { align: "center" });

      // Add timestamp
      const timestamp = new Date().toLocaleString();
      pdf.setFontSize(14);
      pdf.text(`Created on: ${timestamp}`, 315, 250);

      // Add border
      pdf.setLineWidth(1);
      pdf.rect(5, 5, 410, 287); // Outer border
      pdf.rect(305, 5, 110, 45); // Title area
      pdf.rect(305, 50, 110, 50); // North direction
      pdf.rect(305, 100, 110, 140); // Legend
      pdf.rect(305, 240, 110, 52); // Timestamp

      // Open PDF in a new tab
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Error generating PDF. Please try again.");
    } finally {
      setIsMasking(false);
      setIsReadyToPrint(false); // Reset state
    }
  };

  return (
    <>
      {/* Print button */}
      <IconButton
        onClick={handlePrintClick}
        sx={{
          position: "absolute",
          right: "20px",
          bottom: "20px",
          backgroundColor: "white",
          borderRadius: "50%",
          padding: "8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
          "&:hover": {
            backgroundColor: "#f5f5f5",
          },
          zIndex: 1000,
        }}
      >
        <PrintIcon />
      </IconButton>

      {/* Dialog for title input */}
      <Dialog open={isDialogOpen} onClose={handleDialogClose}>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Cetak Peta
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            autoFocus
            fullWidth
            value={title}
            size="small"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ketik Judul Peta yang Ingin dicetak"
            sx={{ mb: 2 }}
          />
          <Button
            fullWidth
            variant="contained"
            onClick={handleAreaSelect}
            disabled={!title}
            sx={{
              backgroundColor: "#003577",
              "&:hover": {
                backgroundColor: "#002755",
              },
            }}
          >
            Pilih Area
          </Button>
        </DialogContent>
      </Dialog>

      {/* Masking area */}
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

      {/* Print location button */}
      {isReadyToPrint && (
        <Button
          variant="contained"
          onClick={handlePrintArea}
          sx={{
            position: "absolute",
            bottom: "20px",
            right: "100px",
            backgroundColor: "#003577",
            "&:hover": {
              backgroundColor: "#002755",
            },
            zIndex: 1000,
          }}
        >
          Cetak Lokasi Ini
        </Button>
      )}
    </>
  );
};

export default Print;