import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Zap, Star, Crown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  { id: "starter", name: "Starter", roi: "10%", roiNum: 10, min: 100, icon: Zap },
  { id: "silver", name: "Silver", roi: "20%", roiNum: 20, min: 500, icon: Star },
  { id: "gold", name: "Gold", roi: "35%", roiNum: 35, min: 2000, icon: Crown },
];

export default function InvestPage() {
  const [selected, setSelected] = useState("silver");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const plan = plans.find((p) => p.id === selected)!;

  const handleCommit = async () => {
    const val = parseFloat(amount);
    if (!val || val < plan.min) {
      toast({ title: "Invalid Amount", description: `Minimum deposit for ${plan.name} is $${plan.min}`, variant: "destructive" });
      return;
    }
    if (!user) return;

    setLoading(true);
    try {
      // Create investment
      const { error: invError } = await supabase.from("investments").insert({
        user_id: user.id,
        plan: plan.id,
        amount: val,
        roi_percent: plan.roiNum,
      });
      if (invError) throw invError;

      // Create deposit transaction
      const { error: txError } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: val,
        status: "pending",
        description: `${plan.name} plan investment`,
      });
      if (txError) throw txError;

      toast({ title: "Investment Committed!", description: `$${val.toLocaleString()} committed to ${plan.name} plan. Awaiting confirmation.` });
      setAmount("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Invest</h1>
        <p className="text-muted-foreground mt-1">Select a plan and commit funds</p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {plans.map((p) => (
          <button
            key={p.id}
            onClick={() => setSelected(p.id)}
            className={`text-left rounded-xl p-5 border transition-all ${selected === p.id ? "border-primary neon-glow-sm bg-card" : "border-border bg-card hover:border-primary/40"}`}
          >
            <div className="flex items-center justify-between mb-3">
              <p.icon className="h-5 w-5 text-primary" />
              {selected === p.id && <Check className="h-4 w-4 text-primary" />}
            </div>
            <h3 className="font-semibold text-foreground">{p.name}</h3>
            <div className="text-2xl font-bold text-primary font-mono mt-1">{p.roi}</div>
            <p className="text-sm text-muted-foreground mt-1">Min. ${p.min.toLocaleString()}</p>
          </button>
        ))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-md">
        <h2 className="text-lg font-semibold text-foreground mb-4">Commit Funds to {plan.name}</h2>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-foreground">Amount (USD)</Label>
            <Input
              type="number"
              placeholder={`Min $${plan.min}`}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-secondary border-border font-mono"
            />
          </div>
          {amount && parseFloat(amount) >= plan.min && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Expected Return</span>
                <span className="font-mono text-primary font-semibold">
                  +${(parseFloat(amount) * plan.roiNum / 100).toFixed(2)}/mo
                </span>
              </div>
            </div>
          )}
          <Button variant="neon" className="w-full" onClick={handleCommit} disabled={loading}>
            {loading ? "Processing..." : "Commit Funds"}
          </Button>
        </div>
      </div>
    </div>
  );
}
