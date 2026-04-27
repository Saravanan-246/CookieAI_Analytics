import { RouterProvider } from "react-router-dom";
import { router } from "./router";
import { AuthProvider } from "./providers";

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen w-full bg-[#f7f8fc] text-slate-900 antialiased">
        <RouterProvider router={router} />
      </div>
    </AuthProvider>
  );
}

export default App;