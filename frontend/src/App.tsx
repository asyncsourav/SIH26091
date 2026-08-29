import { Routes, Route } from "react-router-dom";
import { Navbar } from "@/components/common/Navbar";
import { Footer } from "@/components/common/Footer";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";
import { LandingPage } from "@/pages/LandingPage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { IntakeWizardPage } from "@/pages/IntakeWizardPage";
import { ReportPage } from "@/pages/ReportPage";
import { DemoReportPage } from "@/pages/DemoReportPage";
import { MyApplicationsPage } from "@/pages/MyApplicationsPage";
import { AdminDashboard } from "@/pages/AdminDashboard";
import { PartnerDashboard } from "@/pages/PartnerDashboard";

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/apply"
            element={
              <ProtectedRoute>
                <IntakeWizardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/applications"
            element={
              <ProtectedRoute>
                <MyApplicationsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/report/:applicationId"
            element={
              <ProtectedRoute>
                <ReportPage />
              </ProtectedRoute>
            }
          />
          {/* Public, unauthenticated demo route — backed by the read-only
              GET /api/demo/sunita endpoint, not by weakening auth on the
              real application/report routes above. */}
          <Route path="/demo/sunita" element={<DemoReportPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["ADMIN"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/partner"
            element={
              <ProtectedRoute roles={["PARTNER"]}>
                <PartnerDashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
