<<<<<<< HEAD

=======
import { Suspense } from "react";
>>>>>>> 741c35bac296754356e2ab4dea1066d517b96e84
import { RouterProvider } from "react-router-dom";
import { route } from "./routes/route";

function App() {
<<<<<<< HEAD
  // BLOCK DETECTED MOBILE DEVICES
  if (isMobileDevice()) {
    return <MobileAccessRestriction />;
  }

  return <RouterProvider router={route} />;
=======
  return (
    <>
      <Suspense fallback={<div>Loading page...</div>}>
        <RouterProvider router={route} />
      </Suspense>
      <GlobalLoader />
    </>
  );
>>>>>>> 741c35bac296754356e2ab4dea1066d517b96e84
}

export default App;