import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CryptoTicker } from "@/components/CryptoTicker";
import { AuthModal } from "@/components/AuthModal";
import { InvestmentPlans } from "@/components/InvestmentPlans";
import { InvestmentCalculator } from "@/components/InvestmentCalculator";
import { MarketPartners } from "@/components/MarketPartners";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalActivityTicker } from "@/components/GlobalActivityTicker";
import { SystemStatus } from "@/components/SystemStatus";
import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, Zap, BarChart3, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("signup");
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref") || undefined;

  useEffect(() => {
    if (user) navigate("/dashboard");
  }, [user, navigate]);

  useEffect(() => {
    if (refCode && !user) {
      setAuthTab("signup");
      setAuthOpen(true);
    }
  }, [refCode, user]);

  const openAuth = (tab: "login" | "signup") => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <CryptoTicker />

      {/* Navbar */}
      <nav className="border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Profit<span className="text-primary">Pulse</span></span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#plans" className="hover:text-primary transition-colors">Plans</a>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LanguageSelector />
            <Button variant="ghost" onClick={() => openAuth("login")} className="text-foreground">Login</Button>
            <Button variant="neon" onClick={() => openAuth("signup")}>Sign Up</Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-24 md:py-32 px-4 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary mb-8">
            <Zap className="h-3.5 w-3.5" />
            Trusted by 50,000+ investors worldwide
          </div>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight mb-6">
            Your Crypto Profits,{" "}
            <span className="text-primary">Amplified</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Harness the power of algorithmic trading and smart investment strategies. Earn up to 35% monthly ROI with institutional-grade security.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="neon" size="lg" onClick={() => openAuth("signup")} className="text-base px-8">
              Start Investing <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button variant="neon-outline" size="lg" onClick={() => openAuth("login")} className="text-base px-8">
              View Demo
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-8 mt-16 max-w-lg mx-auto">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary font-mono">$2.4B+</div>
              <div className="text-xs text-muted-foreground mt-1">Total Volume</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary font-mono">50K+</div>
              <div className="text-xs text-muted-foreground mt-1">Active Users</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-primary font-mono">99.9%</div>
              <div className="text-xs text-muted-foreground mt-1">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Activity Ticker */}
      <GlobalActivityTicker />

      {/* Features */}
      <section id="features" className="py-20 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: Shield, title: "Bank-Grade Security", desc: "256-bit encryption with multi-sig wallets and cold storage protection." },
              { icon: BarChart3, title: "Smart Analytics", desc: "Real-time portfolio tracking with AI-powered insights and predictions." },
              { icon: Zap, title: "Instant Withdrawals", desc: "Access your funds anytime with lightning-fast withdrawal processing." },
            ].map((f, i) => (
              <div key={i} className="p-6 rounded-xl bg-card border border-border hover:border-primary/30 transition-all group">
                <div className="p-3 rounded-lg bg-primary/10 w-fit mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-muted-foreground text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <div id="plans">
        <InvestmentPlans onInvest={() => openAuth("signup")} />
      </div>

      {/* Investment Calculator */}
      <InvestmentCalculator />

      {/* Market Partners */}
      <MarketPartners />

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Profit<span className="text-primary">Pulse</span></span>
          </div>
          <SystemStatus />
          <p className="text-muted-foreground text-sm">© 2026 ProfitPulse. All rights reserved.</p>
        </div>
      </footer>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} defaultTab={authTab} referralCode={refCode} />
    </div>
  );
};

export default Index;
