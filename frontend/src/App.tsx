
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import RootLayout from "./components/layout/RootLayout";
import AuthLayout from "./components/layout/AuthLayout";
import { Toaster } from "sonner";
import { authStore } from "./stores/authStore";

// Lazy load pages for code splitting
const LoginPage = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage"));
const ForgotPasswordPage = lazy(() => import("./pages/auth/ForgotPasswordPage"));
const TripsPage = lazy(() => import("./pages/client/TripsPage"));
const TripDetailPage = lazy(() => import("./pages/client/TripDetailPage"));
const CreateReservationPage = lazy(() => import("./pages/client/CreateReservationPage"));
const ReservationsPage = lazy(() => import("./pages/client/ReservationsPage"));
const ProfilePage = lazy(() => import("./pages/client/ProfilePage"));
const VerificationPage = lazy(() => import("./pages/client/VerificationPage"));
const MyFilesPage = lazy(() => import("./pages/client/MyFilesPage"));
const RequestTripPage = lazy(() => import("./pages/client/RequestTripPage"));
const MyQuotesPage = lazy(() => import("./pages/client/MyQuotesPage"));

// Admin pages
const CreateTripPage = lazy(() => import("./pages/admin/CreateTripPage"));
const LabelPricesPage = lazy(() => import("./pages/admin/LabelPricesPage"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const ProductsPage = lazy(() => import("./pages/admin/ProductsPage"));
const StopsPage = lazy(() => import("./pages/admin/StopsPage"));
const AccountsPage = lazy(() => import("./pages/admin/AccountsPage"));
const ExchangeRatePage = lazy(() => import("./pages/admin/ExchangeRatePage"));
const BankDetailsPage = lazy(() => import("./pages/admin/BankDetailsPage"));
const GeneralSettingsPage = lazy(() => import("./pages/admin/GeneralSettingsPage"));
const FleetSettingsPage = lazy(() => import("./pages/admin/FleetSettingsPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminReservationsPage = lazy(() => import("./pages/admin/AdminReservationsPage"));
const AdminTripsPage = lazy(() => import("./pages/admin/AdminTripsPage"));
const AdminTripSpacesPage = lazy(() => import("./pages/admin/AdminTripSpacesPage"));
const ClientFilesPage = lazy(() => import("./pages/admin/ClientFilesPage"));
const NotificationsPage = lazy(() => import("./pages/admin/NotificationsPage"));
const PendingVerificationsPage = lazy(() => import("./pages/admin/PendingVerificationsPage"));
const DocumentSettingsPage = lazy(() => import("./pages/admin/DocumentSettingsPage"));
const QRScannerPage = lazy(() => import("./pages/admin/QRScannerPage"));
const TripQuotesPage = lazy(() => import("./pages/admin/TripQuotesPage"));

// Configure QueryClient with performance optimizations
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes - data considered fresh
      gcTime: 1000 * 60 * 10,   // 10 minutes - cache retention
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      retry: 1, // Only 1 retry on failure
    },
  },
});

// Loading fallback component
const PageLoader = () => (
  <div className="flex justify-center items-center min-h-[50vh]">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-keikichi-lime-600"></div>
  </div>
);

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
        <Suspense fallback={<PageLoader />}>
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
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
