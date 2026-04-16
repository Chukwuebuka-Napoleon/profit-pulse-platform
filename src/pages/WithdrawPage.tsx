import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Landmark, Bitcoin, ArrowUpRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

type Method = "bank" | "crypto";

export default function WithdrawPage() {
  const [method, setMethod] = useState<Method>("bank");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("BTC");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleSubmit = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid withdrawal amount.", variant: "destructive" });
      return;
    }
    if (!user) return;

    if (method === "bank" && (!bankName.trim() || !accountNumber.trim())) {
      toast({ title: "Missing Info", description: "Please fill in bank details.", variant: "destructive" });
      return;
    }
    if (method === "crypto" && !walletAddress.trim()) {
      toast({ title: "Missing Info", description: "Please enter your wallet address.", variant: "destructive" });
      return;
    }

    const description =
      method === "bank"
        ? `Bank withdrawal to ${bankName} ****${accountNumber.slice(-4)}`
        : `${cryptoCurrency} withdrawal to ${walletAddress.slice(0, 8)}...`;

    setLoading(true);
    try {
      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "withdrawal",
        amount: val,
        status: "pending",
        description,
      });
      if (error) throw error;

      toast({ title: "Withdrawal Requested", description: `$${val.toLocaleString()} withdrawal is pending review.` });
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setRoutingNumber("");
      setWalletAddress("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Withdraw Funds</h1>
        <p className="text-muted-foreground mt-1">Request a withdrawal to your bank or crypto wallet</p>
      </div>

      {/* Method tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setMethod("bank")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            method === "bank"
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Landmark className="h-4 w-4" />
          Bank Transfer
        </button>
        <button
          onClick={() => setMethod("crypto")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            method === "crypto"
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bitcoin className="h-4 w-4" />
          Crypto Wallet
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-md space-y-5">
        {/* Amount */}
        <div className="space-y-2">
          <Label className="text-foreground">Amount (USD)</Label>
          <Input
            type="number"
            placeholder="Enter amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-secondary border-border font-mono"
          />
        </div>

        {method === "bank" && (
          <>
            <div className="space-y-2">
              <Label className="text-foreground">Bank Name</Label>
              <Input
                placeholder="e.g. Chase, Bank of America"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                className="bg-secondary border-border"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Account Number</Label>
              <Input
                placeholder="Account number"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="bg-secondary border-border font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Routing Number (optional)</Label>
              <Input
                placeholder="Routing number"
                value={routingNumber}
                onChange={(e) => setRoutingNumber(e.target.value)}
                className="bg-secondary border-border font-mono"
              />
            </div>
          </>
        )}

        {method === "crypto" && (
          <>
            <div className="space-y-2">
              <Label className="text-foreground">Cryptocurrency</Label>
              <div className="flex gap-2">
                {["BTC", "ETH", "USDT"].map((c) => (
                  <button
                    key={c}
                    onClick={() => setCryptoCurrency(c)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                      cryptoCurrency === c
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Wallet Address</Label>
              <Input
                placeholder={`Your ${cryptoCurrency} address`}
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>
          </>
        )}

        <Button variant="neon" className="w-full" onClick={handleSubmit} disabled={loading}>
          {loading ? "Submitting..." : (
            <>
              <ArrowUpRight className="h-4 w-4 mr-2" />
              Request Withdrawal
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground">
          Withdrawals are reviewed and typically processed within 24–48 hours.
        </p>
      </div>
    </div>
  );
}
