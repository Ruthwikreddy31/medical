import { useState } from "react";
import Sidebar from "../components/Sidebar.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Dashboard from "../pages/Dashboard.jsx";
import Login from "../pages/Login.jsx";
import Register from "../pages/Register.jsx";
import Reports from "../pages/Reports.jsx";
import Triage from "../pages/Triage.jsx";
import DoctorChatbot from "../components/DoctorChatbot.jsx";

const pages = {
  dashboard: Dashboard,
  triage: Triage,
  reports: Reports
};

export default function AppRoutes() {
  const { session } = useAuth();
  const [authPage, setAuthPage] = useState("login");
  const [currentPage, setCurrentPage] = useState(() => {
    return localStorage.getItem("active-tab") || "dashboard";
  });

  const handleNavigate = (page) => {
    setCurrentPage(page);
    localStorage.setItem("active-tab", page);
  };

  if (!session) {
    return authPage === "register" ? <Register onModeChange={setAuthPage} /> : <Login onModeChange={setAuthPage} />;
  }

  const Page = pages[currentPage] || Dashboard;

  return (
    <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:px-8">
      <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
      <Page onNavigate={handleNavigate} />
      <DoctorChatbot />
    </div>
  );
}
