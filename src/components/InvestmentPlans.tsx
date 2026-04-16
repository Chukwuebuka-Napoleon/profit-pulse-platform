import { Check, Zap, Crown, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlanCardProps {
  name: string;
  roi: string;
  minDeposit: string;
  features: string[];
  icon: React.ReactNode;
  popular?: boolean;
  onInvest: () => void;
}

function PlanCard({ name, roi, minDeposit, features, icon, popular, onInvest }: PlanCardProps) {
  return (
    <div className={`relative rounded-xl p-6 border transition-all duration-300 hover:-translate-y-2 ${popular ? "border-primary neon-glow bg-card" : "border-border bg-card hover:border-primary/50"}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full">
          MOST POPULAR
        </div>
      )}
      <div className="text-center mb-6">
        <div className={`inline-flex p-3 rounded-xl mb-4 ${popular ? "bg-primary/20" : "bg-secondary"}`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold text-foreground">{name}</h3>
        <div className="mt-2">
          <span className="text-4xl font-bold text-primary font-mono">{roi}</span>
          <span className="text-muted-foreground text-sm ml-1">ROI</span>
        </div>
        <p className="text-muted-foreground text-sm mt-1">Min. {minDeposit}</p>
      </div>
      <ul className="space-y-3 mb-6">
        {features.map((f, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-secondary-foreground">
            <Check className="h-4 w-4 text-primary flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      <Button onClick={onInvest} variant={popular ? "neon" : "neon-outline"} className="w-full">
        Start Investing
      </Button>
    </div>
  );
}

interface InvestmentPlansProps {
  onInvest: () => void;
}

export function InvestmentPlans({ onInvest }: InvestmentPlansProps) {
  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">Investment Plans</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">Choose the plan that fits your investment strategy. All plans include 24/7 monitoring and instant withdrawals.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <PlanCard
            name="Starter"
            roi="10%"
            minDeposit="$100"
            icon={<Zap className="h-6 w-6 text-primary" />}
            features={["10% Monthly ROI", "24/7 Support", "Daily Payouts", "Instant Withdrawal"]}
            onInvest={onInvest}
          />
          <PlanCard
            name="Silver"
            roi="20%"
            minDeposit="$500"
            icon={<Star className="h-6 w-6 text-primary" />}
            popular
            features={["20% Monthly ROI", "Priority Support", "Compounding Interest", "Dedicated Manager"]}
            onInvest={onInvest}
          />
          <PlanCard
            name="Gold"
            roi="35%"
            minDeposit="$2,000"
            icon={<Crown className="h-6 w-6 text-primary" />}
            features={["35% Monthly ROI", "VIP Support", "Custom Strategy", "Early Access Features"]}
            onInvest={onInvest}
          />
        </div>
      </div>
    </section>
  );
}
