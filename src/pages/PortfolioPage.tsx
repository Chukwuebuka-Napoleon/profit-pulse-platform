import { useCallback, useEffect, useState } from "react";
import { Wallet, TrendingUp, Layers } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Tx { id: string; type: string; amount: number; status: string; description: string | null; payment_method: string | null; created_at: string; }
interface Inv { id: string; plan: string; amount: number; roi_percent: number; status: string; created_at: string; }

const usd = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function PortfolioPage() {
  const { user, profile } = useAuth();
  const [txs, setTxs] = useState<Tx[]>([]);
  const [invs, setInvs] = useState<Inv[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const load = useCallback(async () => {
    if (!user) return;
    const [t, i] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("investments").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]);
    setTxs((t.data as Tx[]) ?? []);
    setInvs((i.data as Inv[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("portfolio-tx")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions", filter: `user_id=eq.${user.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, load]);

  const sum = (type: string) => txs.filter(t => t.type === type && t.status === "confirmed").reduce((s, t) => s + Number(t.amount), 0);
  const interest = sum("interest");
  const balance = sum("deposit") + interest - sum("withdrawal");
  const active = invs.filter(i => i.status === "active");
  const shown = filter === "all" ? txs : txs.filter(t => t.type === filter);

  if (loading) return <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Portfolio</h1>
        <p className="text-muted-foreground mt-1">Your private investor overview, {profile?.display_name?.split(" ")[0] || "Investor"}.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Balance", value: usd(balance), icon: Wallet },
          { label: "Total Profit", value: usd(interest), icon: TrendingUp },
          { label: "Active Plans", value: String(active.length), icon: Layers },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-6">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4"><s.icon className="h-5 w-5 text-primary" /></div>
            <div className="text-2xl font-bold font-mono text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border"><h2 className="text-lg font-semibold text-foreground">My Plans</h2></div>
        {invs.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No plans yet. Visit Invest to start one.</div> : (
          <div className="divide-y divide-border">
            {invs.map(i => (
              <div key={i.id} className="flex items-center justify-between p-4 md:p-6">
                <div>
                  <div className="font-medium text-foreground capitalize">{i.plan} plan</div>
                  <div className="text-sm text-muted-foreground">{i.roi_percent}% ROI · started {new Date(i.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono font-semibold text-foreground">{usd(Number(i.amount))}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${i.status === "active" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}`}>{i.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
          <div className="flex flex-wrap gap-2">
            {["all", "deposit", "withdrawal", "interest", "investment"].map(f => (
              <button key={f} onClick={() => setFilter(f)} className={`text-xs px-3 py-1 rounded-full border capitalize ${filter === f ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"}`}>{f}</button>
            ))}
          </div>
        </div>
        {shown.length === 0 ? <div className="p-8 text-center text-sm text-muted-foreground">No transactions.</div> : (
          <div className="divide-y divide-border">
            {shown.map(t => (
              <div key={t.id} className="flex items-center justify-between p-4 md:p-6 gap-4">
                <div className="min-w-0">
                  <div className="font-medium text-foreground capitalize">{t.type}{t.payment_method ? ` · ${t.payment_method}` : ""}</div>
                  <div className="text-sm text-muted-foreground truncate">{new Date(t.created_at).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}{t.description ? ` · ${t.description}` : ""}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className={`font-mono font-semibold ${t.type === "withdrawal" ? "text-destructive" : "text-success"}`}>{t.type === "withdrawal" ? "-" : "+"}{usd(Number(t.amount))}</div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${t.status === "confirmed" ? "bg-success/10 text-success" : t.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>{t.status}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
