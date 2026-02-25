import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-card py-6">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 Nagar Niti — Smart Urban Grievance & Service Response System
        </div>
      </footer>
    </div>
  );
};

export default Layout;
