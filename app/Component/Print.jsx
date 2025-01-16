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

const Print = ({ view, addedLayers }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMasking, setIsMasking] = useState(false);
  const [title, setTitle] = useState("");
  const [isReadyToPrint, setIsReadyToPrint] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paperSize, setPaperSize] = useState("A3");
  const [orientation, setOrientation] = useState("landscape");
  const [error, setError] = useState(null);

  const paperSizes = {
    A3: { width: 420, height: 297 },
    A4: { width: 297, height: 210 },
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
  };

  // Function to get map extent
  const getMapExtent = () => {
    if (!view) return null;
    return {
      xmin: view.extent.xmin,
      ymin: view.extent.ymin,
      xmax: view.extent.xmax,
      ymax: view.extent.ymax,
      spatialReference: view.extent.spatialReference,
    };
  };

  // Function to convert ArcGIS color to RGB array
  const getColorFromSymbol = (color) => {
    if (!color) return [0, 0, 0];
    return [
      color.r || 0,
      color.g || 0,
      color.b || 0
    ];
  };

  // Function to draw point symbol
  const drawPointSymbol = (pdf, x, y, symbol) => {
    if (!symbol) return;
    
    // Set symbol color
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
          // Draw diamond shape
          pdf.lines(
            [
              [size, 0],
              [0, size],
              [-size, 0],
              [0, -size],
            ],
            x,
            y,
            [1, 1],
            "F"
          );
          break;
        case "cross":
          // Draw cross shape
          pdf.line(x - size, y, x + size, y);
          pdf.line(x, y - size, x, y + size);
          break;
        default:
          pdf.circle(x, y, size, "F");
      }
    }
  };

  // Function to draw line symbol
  const drawLineSymbol = (pdf, x, y, symbol) => {
    if (!symbol) return;

    // Set line color and width
    const [r, g, b] = getColorFromSymbol(symbol.color);
    pdf.setDrawColor(r, g, b);
    
    const width = symbol.width || 0.5;
    pdf.setLineWidth(width);
    
    // Draw line with style
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
    // Reset dash pattern
    pdf.setLineDashPattern([], 0);
  };

  // Function to draw polygon symbol
  const drawPolygonSymbol = (pdf, x, y, symbol) => {
    if (!symbol) return;

    // Set fill and outline colors
    const [r, g, b] = getColorFromSymbol(symbol.color);
    pdf.setFillColor(r, g, b);
    
    if (symbol.outline) {
      const [outlineR, outlineG, outlineB] = getColorFromSymbol(symbol.outline.color);
      pdf.setDrawColor(outlineR, outlineG, outlineB);
      pdf.setLineWidth(symbol.outline.width || 0.5);
    }

    // Draw rectangle with fill and outline
    const style = symbol.outline ? "FD" : "F";
    pdf.rect(x - 5, y - 3, 10, 6, style);
  };

  // Function to add legend
  const addLegend = async (pdf, visibleLayers) => {
    pdf.setFontSize(14);
    pdf.setFont("helvetica", "bold"); // Use bold font
    pdf.text("LEGENDA", 310, 110); // Legend position

    // Set font size and style for the legend items
    pdf.setFontSize(12);
    pdf.setFont("helvetica", "normal"); // Use normal font for legend items

    let legendY = 120; // Starting position for legend items
    const legendSpacing = 10; // Spacing between legend items);

    for (const layer of visibleLayers) {
      if (!layer.visible) continue;

      const renderer = layer.renderer;
      pdf.setFontSize(10);

      // Handle different renderer types
      if (renderer) {
        switch (renderer.type) {
          case "simple":
            // Draw layer title
            pdf.text(layer.title || "Layer", 325, legendY);
            
            // Draw symbol
            handleGeometryType(pdf, layer, renderer.symbol, 318, legendY - 1);
            legendY += 8;
            break;

          case "unique-value":
            // Draw layer title
            pdf.text(layer.title || "Layer", 315, legendY);
            legendY += 8;

            // Draw each unique value symbol
            renderer.uniqueValueInfos.forEach(info => {
              handleGeometryType(pdf, layer, info.symbol, 318, legendY - 1);
              pdf.text(info.label || info.value.toString(), 325, legendY);
              legendY += 8;
            });
            legendY += 4;
            break;

          case "class-breaks":
            // Draw layer title
            pdf.text(layer.title || "Layer", 315, legendY);
            legendY += 8;

            // Draw each class break symbol
            renderer.classBreakInfos.forEach(info => {
              handleGeometryType(pdf, layer, info.symbol, 318, legendY - 1);
              const label = `${info.minValue} - ${info.maxValue}`;
              pdf.text(label, 325, legendY);
              legendY += 8;
            });
            legendY += 4;
            break;

          default:
            pdf.text(layer.title || "Layer", 315, legendY);
            legendY += 8;
        }
      } else {
        // If no renderer, just show layer title
        pdf.text(layer.title || "Layer", 315, legendY);
        legendY += 8;
      }
    }
  };

  // Helper function to handle geometry type and draw appropriate symbol
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

  // Function to add scale bar and north arrow

  const handlePrintArea = async () => {
    if (!view) return;

    setIsLoading(true);
    try {
      // Get visible layers
      const visibleLayers = view.map.layers.filter((layer) => layer.visible);

      // Wait for view to be ready
      await view.when();

      // Take screenshot
      const screenshot = await view.takeScreenshot({
        format: "png",
        quality: 100,
        width: 2048,
        height: 1536,
      });

      // Get current extent
      const currentExtent = getMapExtent();

      // Initialize PDF
      const { width, height } = paperSizes[paperSize];
      const pdf = new jsPDF({
        orientation: orientation,
        unit: "mm",
        format: [width, height],
      });

      // Calculate dimensions
      const isLandscape = orientation === "landscape";
      const pageWidth = isLandscape ? width : height;
      const pageHeight = isLandscape ? height : width;
      const margin = 5; // Outer margin
      const adjustedMargin = margin + 10; // Shifted a bit more to the right
      const columnWidth = Math.min((pageWidth * 0.3) - adjustedMargin, pageWidth - (pageWidth * 0.7 + adjustedMargin + margin));
      const insetColumnWidth = columnWidth; // Full width for the inset section



      // Add map image
      const mapWidth = pageWidth * 0.7;
      const mapHeight = pageHeight * 0.93;
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

            // Set font size and style for the title
      pdf.setFontSize(20);
      pdf.setFont("helvetica", "bold"); // Bold font for the title

      const maxTitleWidth = columnWidth - 15; // Reduce the title width slightly
      const titleRectHeight = Math.min(pageHeight * 0.15, pageHeight - 2 * margin); // Title rectangle height
      const titleRectX = pageWidth * 0.7 + adjustedMargin + 30; // Move rectangle's X position slightly more to the right
      const titleRectY = margin + 5; // Move rectangle's Y position slightly down

      // Split the title into lines that fit within the adjusted rectangle width
      const titleParts = pdf.splitTextToSize(title, maxTitleWidth);

      let currentY = titleRectY + 15; // Start position for text within the rectangle, slightly lower
      const lineSpacing = 10; // Increased line spacing for better readability

      // Add the title text line by line, ensuring it stays within the rectangle
      titleParts.forEach((line) => {
        const lineWidth = pdf.getTextWidth(line);

        // Calculate the center X position for the current line, ensuring it doesn't cross the rectangle
        const centerX = titleRectX + (maxTitleWidth - lineWidth) / 2;

        // Draw the line centered
        if (currentY + lineSpacing <= titleRectY + titleRectHeight) {
          // If the text fits within the rectangle, draw it
          pdf.text(line, centerX, currentY);
        } else {
          // If text exceeds the rectangle, move to the next line below the rectangle
          console.warn("Text exceeds the rectangle height. Moving to the next row below.");
          currentY += lineSpacing; // Move further down
          pdf.text(line, centerX, currentY); // Draw the line
        }

        // Move to the next line within the rectangle
        currentY += lineSpacing;
      });

      // Ensure the text does not overflow the rectangle
      if (currentY > titleRectY + titleRectHeight) {
        console.warn("Title text has moved below the rectangle.");
      }

         // Add the logo inside the rectangle box
      const logoFilePath = "./print/logo_jktsatu.png"; // Path to the logo
      const logoWidth = 20; // Width of the logo
      const logoHeight = 20; // Height of the logo
      const logoX = pageWidth * 0.7 + adjustedMargin + 5; // X position of the logo
      const logoY = titleRectY + (titleRectHeight - logoHeight) / 2; // Center the logo vertically in the rectangle

      // Add the logo to the rectangle
      pdf.addImage(logoFilePath, "PNG", logoX, logoY, logoWidth, logoHeight);   
      

      // Add timestamp
      const timestamp = new Date().toLocaleString();
      pdf.setFontSize(10);
      pdf.text(`Created: ${timestamp}`, pageWidth * 0.75, pageHeight - 20);

      // Add extent information
      if (currentExtent) {
        pdf.setFontSize(8);
        pdf.text(
          `Extent: ${currentExtent.xmin.toFixed(2)}, ${currentExtent.ymin.toFixed(
            2
          )}, ${currentExtent.xmax.toFixed(2)}, ${currentExtent.ymax.toFixed(2)}`,
          15,
          pageHeight - 10
        );
      }

      // Add legend and map elements
      await addLegend(pdf, visibleLayers);

      // Add borders
      // Add borders for full page
      pdf.rect(margin, margin, pageWidth - 2 * margin, pageHeight - 2 * margin);

      // Title area (15% of page height)
      pdf.rect(pageWidth * 0.7 + adjustedMargin, margin, columnWidth, Math.min(pageHeight * 0.15, pageHeight - 2 * margin));

      // North direction (18% of page height)
      pdf.rect(pageWidth * 0.7 + adjustedMargin, margin + (pageHeight * 0.15), columnWidth, Math.min(pageHeight * 0.18, pageHeight - margin - (margin + (pageHeight * 0.15))));

      // Legend (30% of page height)
      pdf.rect(pageWidth * 0.7 + adjustedMargin, margin + (pageHeight * 0.15) + (pageHeight * 0.18), columnWidth, Math.min(pageHeight * 0.3, pageHeight - margin - (margin + (pageHeight * 0.15) + (pageHeight * 0.18))));

      // Inset (40% of page height) split into 2 horizontal rows
      let insetStartY = margin + (pageHeight * 0.15) + (pageHeight * 0.18) + (pageHeight * 0.3);
      let insetHeight = Math.min(pageHeight * 0.4, pageHeight - margin - insetStartY);
      let halfInsetHeight = insetHeight / 2; // Half height for two rows

      // First row of Inset
      pdf.rect(pageWidth * 0.7 + adjustedMargin, insetStartY, insetColumnWidth, halfInsetHeight);

      // Second row of Inset
      pdf.rect(pageWidth * 0.7 + adjustedMargin, insetStartY + halfInsetHeight, insetColumnWidth, halfInsetHeight);

       
                        
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
    }
  };

  return (
    <>
      <IconButton
        onClick={handlePrintClick}
        disabled={isLoading}
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
        {isLoading ? <CircularProgress size={24} /> : <PrintIcon />}
      </IconButton>

      <Dialog open={isDialogOpen} onClose={handleDialogClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ m: 0, p: 2 }}>
          Print Map
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
            placeholder="Enter map title"
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Paper Size</InputLabel>
            <Select
              value={paperSize}
              label="Paper Size"
              onChange={(e) => setPaperSize(e.target.value)}
            >
              <MenuItem value="A3">A3</MenuItem>
              <MenuItem value="A4">A4</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel>Orientation</InputLabel>
            <Select
              value={orientation}
              label="Orientation"
              onChange={(e) => setOrientation(e.target.value)}
            >
              <MenuItem value="landscape">Landscape</MenuItem>
              <MenuItem value="portrait">Portrait</MenuItem>
            </Select>
          </FormControl>

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
            Select Area
          </Button>
        </DialogContent>
      </Dialog>

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

      {isReadyToPrint && (
        <Button
          variant="contained"
          onClick={handlePrintArea}
          disabled={isLoading}
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
          {isLoading ? <CircularProgress size={24} color="inherit" /> : "Print This Area"}
        </Button>
      )}

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