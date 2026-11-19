
import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";

import { route } from "./routes/route";
import GlobalLoader from "./Components/Loader/GlobalLoader";

// MOBILE DEVICE RESTRICTION
import { isMobileDevice } from "./utils/deviceDetection";
import MobileAccessRestriction from "./Components/MobileAccessRestriction";

function App() {
  // BLOCK DETECTED MOBILE DEVICES
  if (isMobileDevice()) {
    return <MobileAccessRestriction />;
  }

  return (
    <>
      <Suspense
        fallback={
          <div
            role="status"
            style={{
              alignItems: "center",
              display: "flex",
              justifyContent: "center",
              minHeight: "100vh",
            }}
          >
            Loading page...
          </div>
        }
      >
        <RouterProvider router={route} />
      </Suspense>

      <GlobalLoader />
    </>
  );
}

export default App;
