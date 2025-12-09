import { Outlet, useLocation } from "react-router-dom";
import Header from "./Header";
import { GlobalNotificationHandler } from "../notifications/GlobalNotificationHandler";
import { VerificationBanner } from "../verification/VerificationBanner";

const RootLayout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <GlobalNotificationHandler />
      <Header />
      <main className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <VerificationBanner />
        <div key={location.pathname} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default RootLayout;
