
import { useEffect, useState } from "react";
import { Backdrop, CircularProgress } from "@mui/material";
import { subscribeToGlobalLoading } from "../../api/globalLoader";
function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return subscribeToGlobalLoading(setLoading);
  }, []);

  
return (
  <Backdrop
    open={loading}
    sx={{
      backgroundColor: "rgba(255, 255, 255, 0.55)",
      zIndex: (theme) => theme.zIndex.modal + 1,
    }}
  >
    <CircularProgress
      size={42}
      thickness={4}
      sx={{ color: "#087b4d" }}
      aria-label="Loading"
    />
  </Backdrop>
);

}

export default GlobalLoader;
