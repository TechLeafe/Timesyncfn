
import { RouterProvider } from "react-router-dom";

import { route } from "./routes/route";

// MOBILE DEVICE RESTRICTION
import { isMobileDevice } from "./utils/deviceDetection";
import MobileAccessRestriction from "./Components/MobileAccessRestriction";

function App() {
  // BLOCK DETECTED MOBILE DEVICES
  if (isMobileDevice()) {
    return <MobileAccessRestriction />;
  }

  return <RouterProvider router={route} />;
}

export default App;
