import { Close } from "@mui/icons-material"
import { Box, IconButton, Typography } from "@mui/material"
import Link from "next/link"

const LayerInfo = ({ layer, setInfoLayerOpen}) => {
  return (
    <Box sx={{width: "100%", height: "100%"}}>
        <Box sx={{width: "100%", height: "10%", display: "flex", flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
            <Typography variant="h6">{layer.title}</Typography>
            <IconButton onClick={() => setInfoLayerOpen(false)} sx={{width: "36px", height: "36px"}} id={`layer-info-content-close-${layer.id}`}>
                <Close />
            </IconButton>
        </Box>
        <Box sx={{width: "100%", height: "90%", display: "flex", flexDirection: "column", justifyContent: "flex-start"}}>
            <Link href={`${layer.url}/${layer.layerId}`} target='_blank'>
                <Typography sx={{ color: "blue", textDecoration: "underline", textUnderlineOffset: "4px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"}}>{`${layer.url}/${layer.layerId}`}</Typography>
            </Link>
            <Typography>
                Metadata Lainnya ....
            </Typography>
        </Box>
    </Box>
  )
}

export default LayerInfo