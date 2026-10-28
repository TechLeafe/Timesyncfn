import { RouterProvider } from "react-router-dom";
import { route } from "./routes/route";
import GlobalLoader from "./Components/Loader/GlobalLoader";

function App() {
  return (
    <>
      <RouterProvider router={route} />
      <GlobalLoader />
    </>
  );
}

export default App;