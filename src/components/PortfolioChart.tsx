import { useMemo } from "react";
import { AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface PortfolioChartProps {
  investments: Array<{ amount: number; roi_percent: number; status: string; created_at: string }>;
  transactions: Array<{ amount: number; type: string; status: string; created_at: string }>;
}

export function PortfolioChart({ investments, transactions }: PortfolioChartProps) {
  const chartData = useMemo(() => {
    const now = new Date();
    const days = 30;
    const activeInvestments = investments.filter((investment) => investment.status === "active");
    const projectedPrincipal = activeInvestments.reduce((sum, investment) => sum + investment.amount, 0);
    const projectedDailyProfit = activeInvestments.reduce(
      (sum, investment) => sum + (investment.amount * investment.roi_percent) / 100 / 10,
      0,
    );
    const projectionStart = new Date(now);
    projectionStart.setDate(projectionStart.getDate() - 7);
    projectionStart.setHours(0, 0, 0, 0);
    const data: { date: string; balance: number; projectedBalance?: number }[] = [];

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
      const projectionDay = Math.floor((d.getTime() - projectionStart.getTime()) / 86_400_000);

      data.push({
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        balance: Math.max(0, balance),
        projectedBalance:
          projectedPrincipal > 0 && projectionDay >= 0
            ? projectedPrincipal + projectedDailyProfit * projectionDay
            : undefined,
      });
    }

    return data;
  }, [investments, transactions]);

  if (chartData.every((d) => d.balance === 0 && d.projectedBalance === undefined)) {
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-lg font-semibold text-foreground">Portfolio Performance (30d)</h2>
        <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
          7-day projection · simulated
        </span>
      </div>
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
            formatter={(value: number, name: string) => [
              `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
              name === "projectedBalance" ? "Projected balance" : "Actual balance",
            ]}
          />
          <Area type="monotone" dataKey="balance" stroke="hsl(135, 100%, 40%)" fill="url(#balanceGradient)" strokeWidth={2} />
          <Line
            type="monotone"
            dataKey="projectedBalance"
            stroke="hsl(var(--warning))"
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            connectNulls={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
