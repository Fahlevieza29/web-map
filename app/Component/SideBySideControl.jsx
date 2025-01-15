import { useEffect, useRef, useState } from "react";
import { Box, IconButton } from "@mui/material";
import { CompareArrows } from "@mui/icons-material";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";

const SideBySideControl = ({ view, addedLayers }) => {
  const [isSplitView, setIsSplitView] = useState(false);
  const leftMapRef = useRef(null);
  const rightMapRef = useRef(null);
  const leftViewRef = useRef(null);
  const rightViewRef = useRef(null);

  const toggleSplitView = () => {
    setIsSplitView(!isSplitView);
  };

  // Function to sync map movements
  const syncMapViews = (sourceView, targetView) => {
    if (!sourceView || !targetView) return;

    // Watch for changes in the source view's camera
    sourceView.watch("camera", (camera) => {
      targetView.camera = camera;
    });
  };

  useEffect(() => {
    if (isSplitView && view) {
      // Initialize left map using the same map instance as the main view
      if (leftMapRef.current && !leftViewRef.current) {
        const leftView = new MapView({
          container: leftMapRef.current,
          map: view.map, // Use the same map instance as the main view
          center: view.center,
          zoom: view.zoom,
          constraints: {
            rotationEnabled: false
          }
        });
        leftViewRef.current = leftView;
      }

      // Initialize right map with Satellite basemap only
      if (rightMapRef.current && !rightViewRef.current) {
        const rightMap = new Map({
          basemap: "satellite"
        });
        
        const rightView = new MapView({
          container: rightMapRef.current,
          map: rightMap,
          center: view.center,
          zoom: view.zoom,
          constraints: {
            rotationEnabled: false
          }
        });
        rightViewRef.current = rightView;
      }

      // Sync views
      if (leftViewRef.current && rightViewRef.current) {
        syncMapViews(leftViewRef.current, rightViewRef.current);
        syncMapViews(rightViewRef.current, leftViewRef.current);
      }
    }

    // Cleanup function
    return () => {
      if (!isSplitView) {
        if (leftViewRef.current) {
          leftViewRef.current.destroy();
          leftViewRef.current = null;
        }
        if (rightViewRef.current) {
          rightViewRef.current.destroy();
          rightViewRef.current = null;
        }
      }
    };
  }, [isSplitView, view, addedLayers]);

  return (
    <>
      <Box sx={{ position: "absolute", top: "150px", right: "30px", zIndex: 1000 }}>
        <IconButton
          onClick={toggleSplitView}
          sx={{
            backgroundColor: "white",
            "&:hover": { backgroundColor: "white" },
            width: "40px",
            height: "40px",
            boxShadow: 2,
          }}
        >
          <CompareArrows />
        </IconButton>
      </Box>

      {isSplitView && (
        <Box 
          sx={{ 
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            zIndex: 900,
            display: "flex"
          }}
        >
          <Box
            ref={leftMapRef}
            sx={{
              width: "50%",
              height: "100%",
              borderRight: "2px solid white",
            }}
          />
          <Box
            ref={rightMapRef}
            sx={{
              width: "50%",
              height: "100%",
            }}
          />
        </Box>
      )}
    </>
  );
};

export default SideBySideControl;