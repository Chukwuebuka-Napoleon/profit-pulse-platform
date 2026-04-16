import { useEffect, useState, useCallback } from "react";
import { DollarSign, Users, TrendingUp, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export default function AdminOverview() {
  const [stats, setStats] = useState([
    { label: "Total Liquidity", value: "Loading...", icon: DollarSign },
    { label: "Active Investors", value: "Loading...", icon: Users },
    { label: "Total Deposits", value: "Loading...", icon: TrendingUp },
    { label: "Pending Actions", value: "Loading...", icon: Activity },
  ]);

  const fetchStats = useCallback(async () => {
    const [profilesRes, txRes, pendingRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact" }),
      supabase.from("transactions").select("amount, type, status"),
      supabase.from("transactions").select("id", { count: "exact" }).eq("status", "pending"),
    ]);

    const allTx = txRes.data ?? [];
    const totalDeposits = allTx.filter(t => t.type === "deposit" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
    const totalWithdrawals = allTx.filter(t => t.type === "withdrawal" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
    const liquidity = totalDeposits - totalWithdrawals;

    setStats([
      { label: "Total Liquidity", value: `$${liquidity.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: DollarSign },
      { label: "Active Investors", value: String(profilesRes.count ?? 0), icon: Users },
      { label: "Total Deposits", value: `$${totalDeposits.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, icon: TrendingUp },
      { label: "Pending Actions", value: String(pendingRes.count ?? 0), icon: Activity },
    ]);
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-overview')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
      }, () => {
        fetchStats();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchStats]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">System Overview</h1>
        <p className="text-muted-foreground mt-1">Platform-wide statistics</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-6">
            <div className="p-2 rounded-lg bg-primary/10 w-fit mb-4">
              <s.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
