
import { useEffect, useRef, useState } from "react";
import { Box } from "@mui/material";
import { subscribeToGlobalLoading } from "../../api/globalLoader";
import ClassicSpinner from "./ClassicSpinner";

const MINIMUM_VISIBLE_TIME = 700;

function GlobalLoader() {
  const [loading, setLoading] = useState(false);

  const visibleRef = useRef(false);
  const shownAtRef = useRef(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const unsubscribe = subscribeToGlobalLoading((isLoading) => {
      if (isLoading) {
        // Cancel a pending hide if another request starts.
        if (hideTimerRef.current) {
          clearTimeout(hideTimerRef.current);
          hideTimerRef.current = null;
        }

        // Show immediately when loading starts.
        if (!visibleRef.current) {
          visibleRef.current = true;
          shownAtRef.current = Date.now();
          setLoading(true);
        }

        return;
      }

      if (!visibleRef.current) return;

      const elapsed = Date.now() - shownAtRef.current;

      const remaining = Math.max(
        0,
        MINIMUM_VISIBLE_TIME - elapsed
      );

      hideTimerRef.current = setTimeout(() => {
        visibleRef.current = false;
        setLoading(false);
        hideTimerRef.current = null;
      }, remaining);
    });

    return () => {
      unsubscribe();

      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
    };
  }, []);

  if (!loading) return null;

  return (
    <Box
      className="global-loader-overlay"
      role="status"
      aria-label="Loading page content"
    >
      <ClassicSpinner />
    </Box>
  );
}

export default GlobalLoader;
