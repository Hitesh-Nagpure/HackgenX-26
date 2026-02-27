import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import { ChatWidget } from "./ChatWidget";
import { useAuth } from "./AuthProvider";
import { cn } from "@/lib/utils";


const Layout = () => {
  const location = useLocation();
  const { hasRole } = useAuth();
  const path = location.pathname;

  // Determine portal type
  const isAdminPortal = path.startsWith("/admin");
  const isWorkerPortal = path.startsWith("/worker");
  const isUserPortal = path.startsWith("/complaints") || path.startsWith("/complaint/new");
  const isPublicPage = path === "/" || path === "/billboard" || path === "/leaderboard";

  return (
    <div className={cn(
      "flex min-h-screen flex-col transition-colors duration-500",
      isAdminPortal && "bg-slate-50",
      isWorkerPortal && "bg-emerald-50/30",
      isUserPortal && "bg-blue-50/30",
      isPublicPage && "bg-background"
    )}>
      <Navbar />

      <div className="flex flex-1">
        {/* Potentially add a sidebar for Admin/Worker if needed in the future */}
        <main className={cn(
          "flex-1",
          isAdminPortal && "p-4 md:p-8",
          isWorkerPortal && "p-4 md:p-6",
          isUserPortal && "p-4 md:p-6 container max-w-6xl mx-auto",
          isPublicPage && ""
        )}>
          <Outlet />
        </main>
      </div>

      <ChatWidget />

      {!isAdminPortal && (
        <footer className="border-t border-border bg-card py-10">
          <div className="container">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div>
                <h3 className="font-bold text-lg mb-4 text-primary">NagarNiti</h3>
                <p className="text-sm text-muted-foreground">
                  Harmonizing urban living through technology and transparency.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li><a href="/" className="hover:text-primary transition-colors">Home</a></li>
                  <li><a href="/billboard" className="hover:text-primary transition-colors">Billboard</a></li>
                  <li><a href="/leaderboard" className="hover:text-primary transition-colors">Leaderboard</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <p className="text-sm text-muted-foreground">
                  Need help? Contact our support team for any city-related grievance assistance.
                </p>
              </div>
            </div>
            <div className="pt-8 border-t border-border text-center text-xs text-muted-foreground">
              © 2026 NagarNiti — Smart Urban Grievance & Service Response System
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

export default Layout;

