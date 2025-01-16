import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Button,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import React, { useState } from "react";
import { Print as PrintIcon } from "@mui/icons-material";
import CloseIcon from "@mui/icons-material/Close";
import jsPDF from "jspdf";

const Print = ({ view, buttonSize }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [title, setTitle] = useState("");
  const [isReadyToPrint, setIsReadyToPrint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paperSize, setPaperSize] = useState("A3");
  const [orientation, setOrientation] = useState("landscape");
  const [error, setError] = useState(null);
  const [selectedExtent, setSelectedExtent] = useState(null);

  const paperSizes = {
    A3: { width: 420, height: 297 },
  };

  const handlePrintClick = () => {
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setTitle("");
    setError(null);
  };

  const handleAreaSelect = () => {
    setIsDialogOpen(false);
    setIsMasking(true);
    setIsReadyToPrint(true);
    setSelectedExtent(view.extent.clone());
  };

  // Function to get features within extent
  const getFeaturesInExtent = async (layer, extent) => {
    if (!layer.visible) return [];
    
    try {
      const query = layer.createQuery();
      query.geometry = extent;
      query.spatialRelationship = "intersects";
      const result = await layer.queryFeatures(query);
      return result.features;
    } catch (error) {
      console.error(`Error querying features for layer ${layer.title}:`, error);
      return [];
    }
  };

  // Function to get unique symbols from features
  const getUniqueSymbols = (features, renderer) => {
    const symbols = new Set();
    
    if (renderer.type === "simple") {
      symbols.add(renderer.symbol);
    } else if (renderer.type === "unique-value") {
      features.forEach(feature => {
        const value = feature.attributes[renderer.field];
        const symbolInfo = renderer.uniqueValueInfos.find(info => 
          info.value.toString() === value.toString()
        );
        if (symbolInfo) symbols.add(symbolInfo);
      });
    } else if (renderer.type === "class-breaks") {
      features.forEach(feature => {
        const value = feature.attributes[renderer.field];
        const symbolInfo = renderer.classBreakInfos.find(info => 
          value >= info.minValue && value <= info.maxValue
        );
        if (symbolInfo) symbols.add(symbolInfo);
      });
    }
    
    return Array.from(symbols);
  };

  // Function to convert ArcGIS color to RGB array
  const getColorFromSymbol = (color) => {
    if (!color) return [0, 0, 0];
    return [color.r || 0, color.g || 0, color.b || 0];
  };

  // Drawing functions remain the same as in your original code
  const drawPointSymbol = (pdf, x, y, symbol) => {
    if (!symbol) return;
    
    const [r, g, b] = getColorFromSymbol(symbol.color);
    pdf.setFillColor(r, g, b);
    pdf.setDrawColor(r, g, b);

    const size = 2;
    if (symbol.type === "simple-marker") {
      switch (symbol.style) {
        case "circle":
          pdf.circle(x, y, size, "F");
          break;
        case "square":
          pdf.rect(x - size, y - size, size * 2, size * 2, "F");
          break;
        case "diamond":
          pdf.lines(
            [[size, 0], [0, size], [-size, 0], [0, -size]],
            x, y, [1, 1], "F"
          );
          break;
        case "cross":
          pdf.line(x - size, y, x + size, y);
          pdf.line(x, y - size, x, y + size);
          break;
        default:
          pdf.circle(x, y, size, "F");
      }
    }
  };

  const drawLineSymbol = (pdf, x, y, symbol) => {
    if (!symbol) return;

    const [r, g, b] = getColorFromSymbol(symbol.color);
    pdf.setDrawColor(r, g, b);
    
    const width = symbol.width || 0.5;
    pdf.setLineWidth(width);
    
    switch (symbol.style) {
      case "dash":
        pdf.setLineDashPattern([2, 2], 0);
        break;
      case "dot":
        pdf.setLineDashPattern([1, 1], 0);
        break;
      case "dashdot":
        pdf.setLineDashPattern([3, 1, 1, 1], 0);
        break;
      default:
        pdf.setLineDashPattern([], 0);
    }
    
    pdf.line(x - 5, y, x + 5, y);
    pdf.setLineDashPattern([], 0);
  };

  const drawPolygonSymbol = (pdf, x, y, symbol) => {
    if (!symbol) return;

    const [r, g, b] = getColorFromSymbol(symbol.color);
    pdf.setFillColor(r, g, b);
    
    if (symbol.outline) {
      const [outlineR, outlineG, outlineB] = getColorFromSymbol(symbol.outline.color);
      pdf.setDrawColor(outlineR, outlineG, outlineB);
      pdf.setLineWidth(symbol.outline.width || 0.5);
    }

    const style = symbol.outline ? "FD" : "F";
    pdf.rect(x - 5, y - 3, 10, 6, style);
  };

  // Modified legend function to only show features in extent
  const addLegend = async (pdf, visibleLayers, extent) => {
    let legendY = 110;
    pdf.setFontSize(14);
    pdf.text("Legenda", 315, 102);

    for (const layer of visibleLayers) {
      if (!layer.visible) continue;

      const features = await getFeaturesInExtent(layer, extent);
      if (features.length === 0) continue;

      const renderer = layer.renderer;
      if (!renderer) continue;

      pdf.setFontSize(10);
      pdf.text(layer.title || "Layer", 315, legendY);
      legendY += 8;

      const symbols = getUniqueSymbols(features, renderer);
      
      for (const symbolInfo of symbols) {
        const symbol = symbolInfo.symbol || symbolInfo;
        const label = symbolInfo.label || symbolInfo.value || "";

        handleGeometryType(pdf, layer, symbol, 318, legendY - 1);
        if (label) {
          pdf.text(label.toString(), 325, legendY);
        }
        legendY += 8;
      }
      
      legendY += 4;
    }
  };

  // Helper function to handle geometry type
  const handleGeometryType = (pdf, layer, symbol, x, y) => {
    switch (layer.geometryType) {
      case "point":
      case "multipoint":
        drawPointSymbol(pdf, x, y, symbol);
        break;
      case "polyline":
        drawLineSymbol(pdf, x, y, symbol);
        break;
      case "polygon":
        drawPolygonSymbol(pdf, x, y, symbol);
        break;
    }
  };

  // Function to calculate optimal image dimensions
  const calculateImageDimensions = (containerWidth, containerHeight, imageWidth, imageHeight) => {
    const ratio = Math.min(containerWidth / imageWidth, containerHeight / imageHeight);
    return {
      width: imageWidth * ratio,
      height: imageHeight * ratio
    };
  };

  const handlePrintArea = async () => {
    if (!view || !selectedExtent) return;

    setIsLoading(true);
    try {
      const visibleLayers = view.map.layers.filter(layer => layer.visible);

      await view.when();

      // Calculate dimensions for the screenshot
      const { width, height } = paperSizes[paperSize];
      const isLandscape = orientation === "landscape";
      const pageWidth = isLandscape ? width : height;
      const pageHeight = isLandscape ? height : width;
      const mapWidth = pageWidth * 0.7;
      const mapHeight = pageHeight * 0.93;

      // Take screenshot with calculated dimensions
      const screenshot = await view.takeScreenshot({
        extent: selectedExtent,
        format: "png",
        quality: 100,
        width: Math.round(mapWidth * 4), // Higher resolution for better quality
        height: Math.round(mapHeight * 4)
      });

      // Initialize PDF
      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: [width, height]
      });

      // Add map image with calculated dimensions
      pdf.addImage(
        screenshot.dataUrl,
        "PNG",
        10,
        10,
        mapWidth,
        mapHeight,
        undefined,
        "FAST"
      );

      // Add title
      pdf.setFontSize(20);
      const maxTitleWidth = pageWidth * 0.7;
      if (pdf.getStringUnitWidth(title) * 20 > maxTitleWidth) {
        const titleParts = pdf.splitTextToSize(title, maxTitleWidth);
        titleParts.forEach((line, index) => {
          pdf.text(line, pageWidth * 0.85, 20 + index * 10, { align: "center" });
        });
      } else {
        pdf.text(title, pageWidth * 0.85, 20, { align: "center" });
      }

      // Add extent information
      pdf.setFontSize(8);
      pdf.text(
        `Extent: ${selectedExtent.xmin.toFixed(2)}, ${selectedExtent.ymin.toFixed(2)}, ${selectedExtent.xmax.toFixed(2)}, ${selectedExtent.ymax.toFixed(2)}`,
        15,
        pageHeight - 10
      );

      // Add legend for features in extent
      await addLegend(pdf, visibleLayers, selectedExtent);

      // Add borders
      pdf.setLineWidth(1);
      pdf.setDrawColor(0,0,0);
      pdf.rect(5, 5, pageWidth - 10, pageHeight - 10);
      pdf.rect(mapWidth + 15, 5, pageWidth - mapWidth - 20, pageHeight - 10);

      // Generate and open PDF
      const pdfBlob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(pdfBlob);
      window.open(blobUrl);
    } catch (error) {
      console.error("Error generating PDF:", error);
      setError("Error generating PDF. Please try again.");
    } finally {
      setIsLoading(false);
      setIsMasking(false);
      setIsReadyToPrint(false);
      setSelectedExtent(null);
    }
  };
  
    return (
      <>
        <Box sx={{
          display: "flex", 
          alignItems: "center",
          gap: "8px", 
        }}
      >
        {/* Tombol Cetak Area Ini */}
        {isReadyToPrint && (
          <Button
            variant="contained"
            onClick={handlePrintArea}
            disabled={isLoading}
            sx={{
              backgroundColor: "#003577",
              "&:hover": {
                backgroundColor: "#002755",
              },
              zIndex: 1000,
              borderRadius: "12px", 
              padding: "12px 24px", 
              fontSize: "16px", 
              width: "200px", 
              textTransform: "none", 
            }}
          >
            {isLoading ? <CircularProgress size={20} color="inherit" /> : "Cetak Area Ini"}
          </Button>
        )}

        {/* Tombol Print */}
        <IconButton
          onClick={handlePrintClick}
          disabled={isLoading}
          sx={{
            display: "flex",
            flexDirection: "column",
            borderRadius: 2,
            backgroundColor: "white",
            width: 48, 
            rowGap: "7px",
            boxShadow: 1,
          }}
        >
          {isLoading ? <CircularProgress size={24} /> : <PrintIcon />}
        </IconButton>
      </Box>

      {/* Dialog untuk input judul */}
      <Dialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "12px", // Rounded corners untuk dialog
            padding: "16px",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontWeight: "bold",
            fontSize: "18px",
            padding: 0,
          }}
        >
          Cetak Peta
          <IconButton
            aria-label="close"
            onClick={handleDialogClose}
            sx={{
              position: "relative",
              color: (theme) => theme.palette.grey[500],
              marginLeft: "auto",
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
            size="medium"
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ketik Judul Peta yang Ingin Dicetak"
            sx={{
              marginBottom: 2,
              "& .MuiOutlinedInput-root": {
                borderRadius: "8px", // Rounded input field
              },
            }}
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
              borderRadius: "8px", // Rounded button
              textTransform: "none", // Disable uppercase text
            }}
          >
            Next
          </Button>
        </DialogContent>
      </Dialog>

      {/* Masking saat area dipilih */}
      {isMasking && (
        <Box
          sx={{
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "250mm",
            height: "150mm",
            background: "rgba(255, 51, 0, 0.1)",
            border: "2px dashed rgb(255, 51, 0)",
            pointerEvents: "none",
            zIndex: 999,
          }}
        />
      )}

      {/* Snackbar untuk pesan error */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: "100%" }}>
          {error}
        </Alert>
      </Snackbar>
    </>
    );
  };
  
  export default Print;