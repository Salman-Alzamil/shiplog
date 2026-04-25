import { useEffect } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import Billing from "./pages/Billing";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import ProjectDetail from "./pages/ProjectDetail";
import PublicChangelog from "./pages/PublicChangelog";

function TokenCapture() {
  const [params] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = params.get("token");
    if (token) {
      localStorage.setItem("token", token);
      navigate("/dashboard", { replace: true });
    }
  }, [params, navigate]);

  return null;
}

export default function App() {
  return (
    <>
      <TokenCapture />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/project/:id" element={<ProjectDetail />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/changelog/:slug" element={<PublicChangelog />} />
      </Routes>
    </>
  );
}
