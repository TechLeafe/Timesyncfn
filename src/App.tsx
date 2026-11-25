
import { RouterProvider } from "react-router-dom";
import { route } from "./routes/route";
import { isMobileDevice } from "./utils/deviceDetection";
import MobileAccessRestriction from "./Components/MobileAccessRestriction";

function App() {
  // Block detected mobile devices
  if (isMobileDevice()) {
    return <MobileAccessRestriction />;
  }

  return <RouterProvider router={route} />;
}

export default App;
