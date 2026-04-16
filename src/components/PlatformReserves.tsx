import { useState, useEffect } from "react";
import { Landmark, ShieldCheck } from "lucide-react";

export function PlatformReserves() {
  const [reserves, setReserves] = useState(142_387_291.43);

  useEffect(() => {
    const interval = setInterval(() => {
      setReserves((prev) => prev + (Math.random() - 0.3) * 1200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Landmark className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Platform Reserves</h3>
            <p className="text-xs text-muted-foreground">Proof of liquidity</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-success">
          <ShieldCheck className="h-4 w-4" />
          <span className="font-medium">Verified</span>
        </div>
      </div>

      <div className="text-3xl font-bold font-mono text-foreground mb-3">
        ${reserves.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "BTC Holdings", value: "$68.4M" },
          { label: "ETH Holdings", value: "$41.2M" },
          { label: "Stablecoins", value: "$32.8M" },
        ].map((item) => (
          <div key={item.label} className="p-3 rounded-lg bg-secondary/50 border border-border">
            <div className="text-xs text-muted-foreground">{item.label}</div>
            <div className="text-sm font-mono font-semibold text-foreground mt-1">{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
