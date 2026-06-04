import Navbar from "./components/Navbar.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  return (
    <AuthProvider>
      <main className="min-h-screen bg-white text-clinic-ink">
        <Navbar />
        <AppRoutes />
      </main>
    </AuthProvider>
  );
}
