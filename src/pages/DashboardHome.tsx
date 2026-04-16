import { useEffect, useState, useCallback } from "react";
import { DollarSign, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { PortfolioChart } from "@/components/PortfolioChart";
import { WithdrawalWallet } from "@/components/WithdrawalWallet";
import { PlatformReserves } from "@/components/PlatformReserves";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

interface Investment {
  id: string;
  plan: string;
  amount: number;
  roi_percent: number;
  status: string;
  created_at: string;
}

export default function DashboardHome() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    const [txRes, invRes] = await Promise.all([
      supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("investments").select("*").eq("user_id", user.id),
    ]);
    setTransactions(txRes.data ?? []);
    setInvestments(invRes.data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('dashboard-tx')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchData();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  const confirmedDeposits = transactions.filter(t => t.type === "deposit" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const confirmedWithdrawals = transactions.filter(t => t.type === "withdrawal" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const interest = transactions.filter(t => t.type === "interest" && t.status === "confirmed").reduce((s, t) => s + t.amount, 0);
  const totalBalance = confirmedDeposits - confirmedWithdrawals + interest;
  const activeDeposits = investments.filter(i => i.status === "active").reduce((s, i) => s + i.amount, 0);

  const stats = [
    { label: "Total Balance", value: `$${totalBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, change: interest > 0 ? `+$${interest.toFixed(2)}` : "—", up: true, icon: DollarSign },
    { label: "Total Profit", value: `$${interest.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, change: "from interest", up: true, icon: TrendingUp },
    { label: "Active Deposits", value: `$${activeDeposits.toLocaleString("en-US", { minimumFractionDigits: 2 })}`, change: `${investments.filter(i => i.status === "active").length} active`, up: true, icon: Wallet },
  ];

  const recentTx = transactions.slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, Investor</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <span className={`text-xs font-mono flex items-center gap-1 ${s.up ? "text-success" : "text-destructive"}`}>
                {s.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {s.change}
              </span>
            </div>
            <div className="text-2xl font-bold font-mono text-foreground">{s.value}</div>
            <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <PortfolioChart investments={investments} transactions={transactions} />
        <PlatformReserves />
      </div>

      <div className="grid lg:grid-cols-1 gap-6">
        <WithdrawalWallet transactions={transactions} onWithdrawalCreated={fetchData} />
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Recent Activity</h2>
        </div>
        {recentTx.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet. Start by making a deposit!</div>
        ) : (
          <div className="divide-y divide-border">
            {recentTx.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-4 md:p-6">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${a.type === "withdrawal" ? "bg-destructive/10" : "bg-primary/10"}`}>
                    {a.type === "withdrawal" ? <ArrowDownRight className="h-4 w-4 text-destructive" /> : <ArrowUpRight className="h-4 w-4 text-primary" />}
                  </div>
                  <div>
                    <div className="font-medium text-foreground capitalize">{a.type}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-mono font-semibold ${a.type === "withdrawal" ? "text-destructive" : "text-success"}`}>
                    {a.type === "withdrawal" ? "-" : "+"}${a.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${a.status === "confirmed" ? "bg-success/10 text-success" : a.status === "pending" ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"}`}>
                    {a.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
