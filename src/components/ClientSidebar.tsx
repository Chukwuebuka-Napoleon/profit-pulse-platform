import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  TrendingUp,
  Wallet,
  ArrowUpRight,
  ArrowRightLeft,
  User,
  Users,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Mail } from "lucide-react";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "My Portfolio", icon: Wallet, path: "/dashboard/portfolio" },
  { label: "Invest", icon: TrendingUp, path: "/dashboard/invest" },
  { label: "Deposit", icon: Wallet, path: "/dashboard/deposit" },
  { label: "Withdraw", icon: ArrowUpRight, path: "/dashboard/withdraw" },
  { label: "Transactions", icon: ArrowRightLeft, path: "/dashboard/transactions" },
  { label: "Referrals", icon: Users, path: "/dashboard/referrals" },
  { label: "Profile", icon: User, path: "/dashboard/profile" },
];

export function ClientSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

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
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Profit<span className="text-primary">Pulse</span></span>
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

        <div className="p-4 border-t border-border space-y-1">
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-xs text-muted-foreground">Theme</span>
            <ThemeToggle />
          </div>
          <a
            href="mailto:Profitpulsecustomer@gmail.com?subject=ProfitPulse%20Support%20Request"
            className="flex items-center gap-3 px-4 py-2 rounded-md text-sm text-muted-foreground hover:text-primary hover:bg-secondary transition-colors"
          >
            <Mail className="h-5 w-5" />
            <span className="flex flex-col leading-tight">
              Customer Care
              <span className="text-xs break-all">Profitpulsecustomer@gmail.com</span>
            </span>
          </a>
          <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
