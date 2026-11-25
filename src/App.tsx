import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { route } from "./routes/route";
import GlobalLoader from "./Components/Loader/GlobalLoader";

function App() {
  return (
    <>
      <Suspense fallback={<div>Loading page...</div>}>
        <RouterProvider router={route} />
      </Suspense>
      <GlobalLoader />
    </>
  );
}

export default App;