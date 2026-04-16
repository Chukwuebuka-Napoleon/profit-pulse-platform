import { useState, useMemo } from "react";
import { Calculator, TrendingUp } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const plans = [
  { name: "Starter", roi: 10 },
  { name: "Silver", roi: 20 },
  { name: "Gold", roi: 35 },
];

export function InvestmentCalculator() {
  const [amount, setAmount] = useState(1000);
  const [planName, setPlanName] = useState("Starter");

  const plan = plans.find((p) => p.name === planName) ?? plans[0];
  const dailyRate = plan.roi / 30 / 100;

  const projections = useMemo(() => {
    return [30, 60, 90, 180, 365].map((days) => {
      const total = amount * (1 + dailyRate) ** days;
      return { days, total, profit: total - amount };
    });
  }, [amount, dailyRate]);

  const maxProfit = projections[projections.length - 1].profit;

  return (
    <section className="py-20 px-4 border-t border-border">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 text-sm text-primary mb-4">
            <Calculator className="h-3.5 w-3.5" />
            Investment Calculator
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground">
            See Your <span className="text-primary">Projected Returns</span>
          </h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Enter an amount and select a plan to visualise how your investment could grow over time.
          </p>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 md:p-8">
          <div className="grid sm:grid-cols-2 gap-6 mb-8">
            <div className="space-y-2">
              <Label className="text-foreground">Investment Amount ($)</Label>
              <Input
                type="number"
                min={10}
                value={amount}
                onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                className="bg-secondary border-border font-mono text-lg"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Plan</Label>
              <Select value={planName} onValueChange={setPlanName}>
                <SelectTrigger className="bg-secondary border-border text-lg">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.name} value={p.name}>
                      {p.name} — {p.roi}% / month
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bar chart */}
          <div className="space-y-4">
            {projections.map((p) => (
              <div key={p.days} className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground w-16 text-right font-mono shrink-0">
                  {p.days}d
                </span>
                <div className="flex-1 bg-secondary rounded-full h-8 relative overflow-hidden">
                  <div
                    className="h-full bg-primary/80 rounded-full transition-all duration-500 flex items-center justify-end pr-3"
                    style={{ width: `${Math.max(8, (p.profit / maxProfit) * 100)}%` }}
                  >
                    <span className="text-xs font-mono text-primary-foreground font-semibold whitespace-nowrap">
                      +${p.profit.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                </div>
                <span className="text-sm font-mono text-foreground w-28 text-right shrink-0">
                  ${p.total.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 text-muted-foreground text-xs">
            <TrendingUp className="h-3.5 w-3.5 text-primary" />
            Projections are estimates based on the selected plan's ROI and compounding daily.
          </div>
        </div>
      </div>
    </section>
  );
}
