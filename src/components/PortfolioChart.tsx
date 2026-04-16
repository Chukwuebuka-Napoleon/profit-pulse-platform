import { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PortfolioChartProps {
  investments: Array<{ amount: number; created_at: string }>;
  transactions: Array<{ amount: number; type: string; status: string; created_at: string }>;
}

export function PortfolioChart({ investments, transactions }: PortfolioChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const days = 30;
    const data: { date: string; balance: number }[] = [];

    // Build a simple cumulative balance over the last 30 days
    for (let i = days; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];

      const depositsUpTo = transactions
        .filter((t) => t.status === "confirmed" && t.type === "deposit" && t.created_at.split("T")[0] <= dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      const withdrawalsUpTo = transactions
        .filter((t) => t.status === "confirmed" && t.type === "withdrawal" && t.created_at.split("T")[0] <= dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      const interestUpTo = transactions
        .filter((t) => t.status === "confirmed" && t.type === "interest" && t.created_at.split("T")[0] <= dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      const balance = depositsUpTo - withdrawalsUpTo + interestUpTo;

      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: Math.max(0, balance),
      });
    }

    return data;
  }, [transactions]);

  if (chartData.every((d) => d.balance === 0)) {
    return (
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio Performance</h2>
        <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
          No transaction data yet. Make your first deposit to see your portfolio chart.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h2 className="text-lg font-semibold text-foreground mb-4">Portfolio Performance (30d)</h2>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(135, 100%, 40%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(135, 100%, 40%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 10%, 20%)" />
          <XAxis dataKey="date" tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "hsl(220, 10%, 55%)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v.toLocaleString()}`} />
          <Tooltip
            contentStyle={{
              background: "hsl(220, 15%, 13%)",
              border: "1px solid hsl(220, 10%, 20%)",
              borderRadius: "8px",
              color: "hsl(0, 0%, 95%)",
            }}
            formatter={(value: number) => [`$${value.toLocaleString()}`, "Balance"]}
          />
          <Area type="monotone" dataKey="balance" stroke="hsl(135, 100%, 40%)" fill="url(#balanceGradient)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
