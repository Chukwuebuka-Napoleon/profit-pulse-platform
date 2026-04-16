import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  ArrowDownToLine,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminNotificationBell } from "@/components/AdminNotificationBell";

const navItems = [
  { label: "Overview", icon: LayoutDashboard, path: "/admin-dashboard" },
  { label: "Users", icon: Users, path: "/admin-dashboard/users" },
  { label: "Deposits", icon: ArrowDownToLine, path: "/admin-dashboard/deposits" },
  { label: "KYC Review", icon: FileCheck, path: "/admin-dashboard/kyc" },
  { label: "Actions", icon: Settings, path: "/admin-dashboard/actions" },
];

export function AdminSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card border border-border text-foreground"
      >
        {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-surface-overlay/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
      )}

      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="p-6 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-destructive/20 flex items-center justify-center">
                <Shield className="h-5 w-5 text-destructive" />
              </div>
              <span className="text-lg font-bold text-foreground">Admin <span className="text-destructive">Portal</span></span>
            </div>
            <AdminNotificationBell />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => { navigate(item.path); setMobileOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={() => navigate("/")}>
            <LogOut className="h-5 w-5" />
            Exit Admin
          </Button>
        </div>
      </aside>
    </>
  );
}
