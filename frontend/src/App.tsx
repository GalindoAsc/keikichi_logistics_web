
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import RootLayout from "./components/layout/RootLayout";
import AuthLayout from "./components/layout/AuthLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage";
import TripsPage from "./pages/client/TripsPage";
import TripDetailPage from "./pages/client/TripDetailPage";
import CreateReservationPage from "./pages/client/CreateReservationPage";
import ReservationsPage from "./pages/client/ReservationsPage";
import ProfilePage from "./pages/client/ProfilePage";
import VerificationPage from "./pages/client/VerificationPage";
import CreateTripPage from "./pages/admin/CreateTripPage";
import LabelPricesPage from "./pages/admin/LabelPricesPage";
import SettingsPage from "./pages/admin/SettingsPage";
import ProductsPage from "./pages/admin/ProductsPage";
import StopsPage from "./pages/admin/StopsPage";
import AccountsPage from "./pages/admin/AccountsPage";
import ExchangeRatePage from "./pages/admin/ExchangeRatePage";
import BankDetailsPage from "./pages/admin/BankDetailsPage";
import GeneralSettingsPage from "./pages/admin/GeneralSettingsPage";
import FleetSettingsPage from "./pages/admin/FleetSettingsPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import AdminReservationsPage from "./pages/admin/AdminReservationsPage";
import AdminTripsPage from "./pages/admin/AdminTripsPage";
import AdminTripSpacesPage from "./pages/admin/AdminTripSpacesPage";
import ClientFilesPage from "./pages/admin/ClientFilesPage";
import NotificationsPage from "./pages/admin/NotificationsPage";
import PendingVerificationsPage from "./pages/admin/PendingVerificationsPage";
import DocumentSettingsPage from "./pages/admin/DocumentSettingsPage";
import QRScannerPage from "./pages/admin/QRScannerPage";
import MyFilesPage from "./pages/client/MyFilesPage";
import RequestTripPage from "./pages/client/RequestTripPage";
import MyQuotesPage from "./pages/client/MyQuotesPage";
import TripQuotesPage from "./pages/admin/TripQuotesPage";
import { Toaster } from "sonner";
import { authStore } from "./stores/authStore";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: JSX.Element; allowedRoles?: string[] }) => {
  const { accessToken, user } = authStore();

  if (!accessToken) {
    return <Navigate to="/auth/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-right" closeButton richColors />
      <BrowserRouter>
        <Routes>
          <Route element={<RootLayout />}>
            <Route index element={<TripsPage />} />
            <Route
              path="/trips/:id"
              element={
                <ProtectedRoute>
                  <TripDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations/create"
              element={
                <ProtectedRoute>
                  <CreateReservationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reservations"
              element={
                <ProtectedRoute>
                  <ReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/verification"
              element={
                <ProtectedRoute>
                  <VerificationPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/request-trip"
              element={
                <ProtectedRoute>
                  <RequestTripPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-quotes"
              element={
                <ProtectedRoute>
                  <MyQuotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/quotes"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager"]}>
                  <TripQuotesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trips"
              element={
                <ProtectedRoute>
                  <AdminTripsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trips/create"
              element={
                <ProtectedRoute>
                  <CreateTripPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trips/:id/edit"
              element={
                <ProtectedRoute>
                  <CreateTripPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/trips/:id/spaces"
              element={
                <ProtectedRoute>
                  <AdminTripSpacesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/label-prices"
              element={
                <ProtectedRoute>
                  <LabelPricesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/general-settings"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager"]}>
                  <GeneralSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/fleet-settings"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager"]}>
                  <FleetSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/stops"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager"]}>
                  <StopsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/accounts"
              element={
                <ProtectedRoute>
                  <AccountsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/accounts/:userId/files"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager"]}>
                  <ClientFilesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/accounts/:userId"
              element={<Navigate to="files" relative="path" replace />}
            />
            <Route
              path="/my-files"
              element={
                <ProtectedRoute>
                  <MyFilesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/exchange-rate"
              element={
                <ProtectedRoute>
                  <ExchangeRatePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/bank-details"
              element={
                <ProtectedRoute>
                  <BankDetailsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/document-settings"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager"]}>
                  <DocumentSettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute>
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/reservations"
              element={
                <ProtectedRoute>
                  <AdminReservationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verifications"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager"]}>
                  <PendingVerificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/verifications/:userId"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager"]}>
                  <PendingVerificationsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scanner"
              element={
                <ProtectedRoute allowedRoles={["superadmin", "manager", "admin"]}>
                  <QRScannerPage />
                </ProtectedRoute>
              }
            />
          </Route>
          <Route path="/auth" element={<AuthLayout />}>
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
