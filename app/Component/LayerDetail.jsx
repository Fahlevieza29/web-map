import {
    Close,
    Delete,
    FilterAlt,
    GridOn,
    Info,
    Visibility,
    VisibilityOff,
  } from "@mui/icons-material";
  import {
    Box,
    IconButton,
    Modal,
    Slider,
    Stack,
    Tooltip,
    Typography,
  } from "@mui/material";
  import { useState } from "react";
  
  const LayerDetail = ({
    view,
    layer,
    addedLayers,
    setAddedLayers,
    setInfoLayerOpen,
    setTableOpen,
    setTableLayer,
    setSelectedLayer,
    setQueryOpen,
  }) => {
    const [opacity, setOpacity] = useState(layer.opacity);
  
    const handleOpenQuery = () => {
      setQueryOpen(false);
      setSelectedLayer(layer);
      setQueryOpen(true);
    };
  
    const handleInfo = () => {
      setInfoLayerOpen(false);
      setSelectedLayer(layer);
      setInfoLayerOpen(true);
    };
    const handleTable = (layer) => {
      setTableOpen(false);
      setTableLayer(layer);
      setTableOpen(true);
    };
    const handleDelete = (layer) => {
      const layerIndexToRemove = addedLayers.findIndex(
        (addedLayer) => addedLayer.id == layer.id
      );
      if (layerIndexToRemove !== -1) {
        view.map.remove(addedLayers[layerIndexToRemove]);
        setAddedLayers((prevLayers) => {
          const updatedLayers = [...prevLayers];
          updatedLayers.splice(layerIndexToRemove, 1);
          return updatedLayers;
        });
      }
      const tables = document.querySelectorAll(".table-element");
      tables.forEach((element) => {
        element.innerHTML = "";
      })
    };
    const sliderHandle = (layer, value) => {
      setOpacity(value);
      layer.opacity = opacity;
    };
  
    return (
      <Box sx={{ display: "grid", flexDirection: "column" }}>
        <Box
          sx={{
            display: "flex",
            width: "100%",
            flexDirection: "row",
            justifyContent: "space-evenly",
          }}
        >
          <Tooltip title="Info" placement="top">
            <IconButton
              onClick={() => handleInfo()}
              id={`layer-info-${layer.id}`}
            >
              <Info />
            </IconButton>
          </Tooltip>
          <Tooltip title="Table" placement="top">
            <IconButton
              onClick={() => handleTable(layer, view)}
              id={`layer-table-${layer.id}`}
            >
              <GridOn />
            </IconButton>
          </Tooltip>
          <Tooltip title="Query" placement="top">
            <IconButton onClick={handleOpenQuery} id={`layer-query-${layer.id}`}>
              <FilterAlt />
            </IconButton>
          </Tooltip>
          <Tooltip title="Remove" placement="top">
            <IconButton onClick={() => handleDelete(layer)}>
              <Delete />
            </IconButton>
          </Tooltip>
        </Box>
        <Box
          sx={{
            display: "flex",
            width: "auto",
            justifyContent: "start",
            paddingLeft: 2,
          }}
        >
          {layer && (
            <Stack
              spacing={2}
              direction="row"
              sx={{ width: "100%", paddingRight: 2 }}
              alignItems="center"
            >
              <VisibilityOff sx={{ color: "#757575", width: "20px" }} />
              <Slider
                valueLabelDisplay="auto"
                value={opacity}
                min={0}
                max={1}
                step={0.1}
                onChange={(event, value) => sliderHandle(layer, value)}
                sx={{ width: "80%" }}
              />
              <Visibility sx={{ color: "#757575", width: "20px" }} />
            </Stack>
          )}
        </Box>
      </Box>
    );
  };
  
  export default LayerDetail;
  