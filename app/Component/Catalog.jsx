import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import { Close, SelectAll } from "@mui/icons-material";
import {
  Box,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  Input,
  InputLabel,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Switch,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { styled } from "@mui/material/styles";
import "./style.css";

const IOSSwitch = styled((props) => (
  <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  "& .MuiSwitch-switchBase": {
    padding: 0,
    margin: 2,
    transitionDuration: "300ms",
    "&.Mui-checked": {
      transform: "translateX(16px)",
      color: "#fff",
      "& + .MuiSwitch-track": {
        backgroundColor: "#65C466",
        // border: "1px solid rgba(0,0,0,.1)",
        opacity: 1,
        border: 0,
        ...theme.applyStyles("dark", {
          backgroundColor: "#2ECA45",
        }),
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.5,
      },
    },
    "&.Mui-focusVisible .MuiSwitch-thumb": {
      color: "#33cf4d",
      border: "6px solid #fff",
    },
    "&.Mui-disabled .MuiSwitch-thumb": {
      color: theme.palette.grey[100],
      ...theme.applyStyles("dark", {
        color: theme.palette.grey[600],
      }),
    },
    "&.Mui-disabled + .MuiSwitch-track": {
      opacity: 0.7,
      ...theme.applyStyles("dark", {
        opacity: 0.3,
      }),
    },
  },
  "& .MuiSwitch-thumb": {
    boxSizing: "border-box",
    width: 22,
    height: 22,
  },
  "& .MuiSwitch-track": {
    borderRadius: 26 / 2,
    backgroundColor: "#E9E9EA",
    opacity: 1,
    border: "1px solid rgba(0,0,0,.2)",
    transition: theme.transitions.create(["background-color"], {
      duration: 500,
    }),
    ...theme.applyStyles("dark", {
      backgroundColor: "#39393D",
    }),
  },
}));

const icons = [
  {
    name: "HIDROGRAFI",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/ic_hidrografi_1.png"
  },
  {
    name: "BATAS WILAYAH",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/ic_batas wilayah_1.png"
  },
  {
    name: "Kependudukan",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/kependudukan.svg"
  },
  {
    name: "LINGKUNGAN TERBANGUN",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/ic_lingkungan terbangun_1.png"
  },
  {
    name: "PERENCANAAN",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/rencana tata ruang.svg"
  },
  {
    name: "KADASTER",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/data pertanahan.svg"
  },
  {
    name: "TRANSPORTASI",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/ic_transportasi_1.png"
  },
  {
    name: "UTILITAS",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/ic_utilitas_1.png"
  },
  {
    name: "VEGETASI",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/ic_vegetasi_1.png"
  },
  {
    name: "Penggunaan Lahan",
    icon: "https://jakartasatu.jakarta.go.id/apimobile/app/storage/penggunaan lahan.svg"
  },
]

const Catalog = ({
  view,
  handleCatalogToggle,
  searchInput,
  setSearchInput,
  data,
  setData,
  group,
  setGroup,
  allLayer,
  setAllLayer,
  addedLayers,
  setAddedLayers,
  modalStyle,
  currentGroupName,
  setCurrentGroupName
}) => {
  const [apiActive, setApiActive] = useState();
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(
          "https://jakartasatu.jakarta.go.id/apimobile/internal/backend/katalog-data/public-noauth"
        );

        if (!response.ok) {
          setApiActive(false);
          throw new Error("API Response was not ok");
        }

        setApiActive(true);
        const data = await response.json();
        const layers = data.data;

        const processedLayers = layers.map(({ kategori_data, id_data, url_data, nama_alias }) => ({
          kategori_data,
          id_data,
          url_data,
          nama_alias,
        }));

        const regroupLayers = processedLayers.reduce((acc, { kategori_data, id_data, url_data, nama_alias }) => {
          if (!acc.groups[kategori_data]) {
            acc.groups[kategori_data] = { name: kategori_data, layers: [] };
          }

          const newLayer = {
            id: id_data,
            is_default: false,
            is_label: false,
            opacity: 0.5,
            service_url: url_data,
            name: nama_alias,
          };

          acc.groups[kategori_data].layers.push(newLayer);

          acc.allLayers.layers.push(newLayer);

          return acc;
        }, { groups: {}, allLayers: { name: "Semua Data", layers: [] } });

        const rearange = Object.values(regroupLayers.groups).sort((a, b) => a.name.localeCompare(b.name));
        const rearangeAll = regroupLayers.allLayers;

        setData(rearange);
        setAllLayer(rearangeAll);
        if (!currentGroupName) {
          setGroup(rearangeAll);
        } else {
          if (currentGroupName === "Semua Data") {
            setGroup(rearangeAll)
          } else {
            const newGroup = rearange.find((group) => group.name === currentGroupName)
            setGroup(newGroup);
          }
        }
      } catch (error) {
        console.error("Error fetching API: ", error);
      }
    };
    fetchData();
  }, []);

  const addLayer = (layer) => {
    console.log(layer);
    const selectedLayer = new FeatureLayer({
      url: layer.service_url,
      id: layer.id,
      title: layer.name,
      opacity: layer.opacity,
    });
    view.map.add(selectedLayer);
    setAddedLayers((prevLayers) => [...prevLayers, selectedLayer]);
  };

  const removeLayer = (layer) => {
    const layerIndexToRemove = addedLayers.findIndex(
      (addedLayer) => addedLayer.id == layer.id
    );
    if (layerIndexToRemove !== -1) {
      view.map.remove(addedLayers[layerIndexToRemove]);
      setAddedLayers((prevLayers) => {
        const newLayers = [...prevLayers];
        newLayers.splice(layerIndexToRemove, 1);
        return newLayers;
      });
    }
  };

  const handleGroup = (group) => {
    setGroup(group);
    setCurrentGroupName(group.name);
  };

  const searchInputHandle = (e) => {
    setSearchInput(e.target.value);
  };

  return (
    <Box sx={modalStyle} id="box-catalog" display={"flex"}>
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          height: "5%",
          width: "100%",
          justifyContent: "space-between",
        }}
      >
        <Typography variant="h6">Katalog Layer</Typography>
        <IconButton
          onClick={handleCatalogToggle}
          sx={{ width: "36px", height: "36px" }}
          id="close-catalog-button"
        >
          <Close />
        </IconButton>
      </Box>
      <Box sx={{ display: "flex", height: "10%", width: "100%" }}>
        <FormControl
          sx={{ m: 1, width: "100%", height: "100%" }}
          variant="standard"
        >
          <InputLabel htmlFor="search-data">Cari Layer ...</InputLabel>
          <Input
            id="search-data"
            value={searchInput}
            onChange={(e) => searchInputHandle(e)}
          />
        </FormControl>
      </Box>
      {apiActive ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            height: "80%",
            width: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: "row",
              width: "100%",
              justifyContent: "space-between",
            }}
          >
            <Box sx={{ width: "25%" }}>
              <List
                sx={{
                  height: "100%",
                  width: "100%",
                  overflowY: "scroll",
                  overflowX: "hidden",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#888 #f1f1f1",
                  "&::-webkit-scrollbar": { width: "10px" },
                  "&::-webkit-scrollbar-track": { background: "#f1f1f1" },
                  "&::-webkit-scrollbar-thumb": { background: "#888" },
                  "&::-webkit-scrollbar-thumb:hover": { background: "#555" },
                }}
              >
                <ListItem sx={{ padding: 0 }} key={"all-data"}>
                  <ListItemButton
                    onClick={() => handleGroup(allLayer)}
                    sx={{ justifyContent: "center" }}
                    key={"all-data"}
                  >
                    <ListItemIcon>
                      <SelectAll
                        sx={{
                          width: "35px",
                          height: "35px",
                          color: "#579DBC",
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={allLayer.name} />
                  </ListItemButton>
                </ListItem>
                {data?.map((group, index) => (
                  <ListItem sx={{ padding: 0, backgroundColor: group.name === currentGroupName ? "lightblue" : "none" }} key={`group-${index}`}>
                    <ListItemButton
                      onClick={() => handleGroup(group)}
                      sx={{ justifyContent: "center" }}
                      id={`list-catalog-group-${index}`}
                      key={`group-${index}`}
                    >
                      <ListItemIcon>
                        <img
                          src={icons.find((icon) => icon.name === group.name)?.icon || "https://jakartasatu.jakarta.go.id/apimobile/app/storage/lainnya.svg"}
                          style={{ width: "35px", height: "35px" }}
                          alt=""
                        />
                      </ListItemIcon>
                      <ListItemText primary={group.name} key={`group-${index}`} />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
            <Box sx={{ width: "74%" }}>
              <Box
                sx={{
                  height: "100%",
                  overflowY: "scroll",
                  justifyContent: "center",
                  scrollbarWidth: "thin",
                  scrollbarColor: "#888 #f1f1f1",
                  "&::-webkit-scrollbar": { width: "10px" },
                  "&::-webkit-scrollbar-track": { background: "#f1f1f1" },
                  "&::-webkit-scrollbar-thumb": { background: "#888" },
                  "&::-webkit-scrollbar-thumb:hover": { background: "#555" },
                  padding: "5px",
                }}
              >
                <Grid
                  container
                  rowGap={1}
                  columnGap={1}
                  sx={{ paddingBottom: "8px", paddingTop: "8px" }}
                >
                  {group?.layers.map((layer) => {
                    const showSwitch =
                      !searchInput ||
                      layer.name
                        .toLowerCase()
                        .includes(searchInput.toLowerCase());
                    const isChecked =
                      addedLayers?.length > 0 &&
                      addedLayers.some((e) => e.id == layer.id);
                    return (
                      showSwitch && (
                        <Grid
                          item
                          xs={5.9}
                          sx={{
                            display: "flex",
                            justifyContent: "flex-start",
                            alignItems: "flex-start",
                            columnGap: "3px",
                            borderRadius: "3px",
                            boxShadow: "0px 0px 10px 2px rgba(0,0,0,0.1)",
                            backgroundColor: "white",
                            cursor: "pointer",
                          }}
                          key={`card-${layer.name}-${layer.id}`}
                        >
                          <Box
                            onClick={
                              isChecked
                                ? () => removeLayer(layer)
                                : () => addLayer(layer)
                            }
                            sx={{
                              display: "flex",
                              alignItems: "flex-start",
                              justifyContent: "flex-start",
                              width: "100%",
                              padding: "7px",
                              columnGap: "4px",
                            }}
                            className={`button-catalog-${layer.id}`}
                          >
                            <FormControlLabel
                              control={<IOSSwitch />}
                              value={isChecked}
                              checked={isChecked}
                              sx={{ padding: 0, margin: 0 }}
                            />
                            <Typography sx={{ padding: 0, margin: 0 }}>
                              {layer.name}
                            </Typography>
                          </Box>
                        </Grid>
                      )
                    );
                  })}
                </Grid>
              </Box>
            </Box>
          </Box>
        </Box>
      ) : (
        <Box
          sx={{
            height: "80%",
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div className="loader"></div>
        </Box>
      )}
    </Box>
  );
};

export default Catalog;
