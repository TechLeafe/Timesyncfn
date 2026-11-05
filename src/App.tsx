import { Suspense } from "react";
import { RouterProvider } from "react-router-dom";
import { route } from "./routes/route";
import GlobalLoader from "./Components/Loader/GlobalLoader";

function App() {
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