import { useState, useEffect, useCallback } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Send, Landmark, Bitcoin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

interface WithdrawalWalletProps {
  transactions: Transaction[];
  onWithdrawalCreated: () => void;
}



type DestType = "bank" | "crypto";

export function WithdrawalWallet({ transactions, onWithdrawalCreated }: WithdrawalWalletProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [destType, setDestType] = useState<DestType>("bank");
  const [amount, setAmount] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [cryptoCurrency, setCryptoCurrency] = useState("BTC");
  const [walletAddress, setWalletAddress] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculate available balance: confirmed deposits + confirmed interest - confirmed withdrawals
  const confirmedDeposits = transactions
    .filter((t) => t.type === "deposit" && t.status === "confirmed")
    .reduce((s, t) => s + t.amount, 0);
  const interest = transactions
    .filter((t) => t.type === "interest" && t.status === "confirmed")
    .reduce((s, t) => s + t.amount, 0);
  const confirmedWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "confirmed")
    .reduce((s, t) => s + t.amount, 0);
  const pendingWithdrawals = transactions
    .filter((t) => t.type === "withdrawal" && t.status === "pending")
    .reduce((s, t) => s + t.amount, 0);

  const availableBalance = confirmedDeposits + interest - confirmedWithdrawals - pendingWithdrawals;
  

  const recentWithdrawals = transactions
    .filter((t) => t.type === "withdrawal")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) {
      toast({ title: "Invalid Amount", description: "Enter a valid amount.", variant: "destructive" });
      return;
    }
    if (val > availableBalance) {
      toast({ title: "Insufficient Balance", description: "You don't have enough funds.", variant: "destructive" });
      return;
    }
    if (!user) return;

    if (destType === "bank" && (!bankName.trim() || !accountNumber.trim())) {
      toast({ title: "Missing Info", description: "Fill in bank details.", variant: "destructive" });
      return;
    }
    if (destType === "crypto" && !walletAddress.trim()) {
      toast({ title: "Missing Info", description: "Enter wallet address.", variant: "destructive" });
      return;
    }

    const description =
      destType === "bank"
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

      // Send admin notification
      await supabase.from("admin_notifications").insert({
        type: "withdrawal",
        title: "Withdrawal Request",
        message: `User requested a withdrawal of $${val.toLocaleString("en-US", { minimumFractionDigits: 2 })}. ${description}`,
        metadata: { user_id: user.id, amount: val, method: destType },
      });

      toast({ title: "Withdrawal Requested", description: `$${val.toLocaleString()} withdrawal is pending admin review.` });
      setModalOpen(false);
      setAmount("");
      setBankName("");
      setAccountNumber("");
      setWalletAddress("");
      onWithdrawalCreated();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    if (status === "confirmed") return "bg-success/15 text-success";
    if (status === "pending") return "bg-warning/15 text-warning";
    return "bg-destructive/15 text-destructive";
  };

  const statusLabel = (status: string) => {
    if (status === "confirmed") return "Processed";
    if (status === "pending") return "Pending";
    return "Failed";
  };

  return (
    <div className="space-y-4">
      {/* Wallet Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card via-card to-secondary p-6 md:p-8">
        {/* Subtle matte texture overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Withdrawal Wallet</h3>
                <p className="text-xs text-muted-foreground/70">Available Balance</p>
              </div>
            </div>
            <Button variant="neon" size="sm" onClick={() => setModalOpen(true)} className="gap-1.5">
              <Send className="h-3.5 w-3.5" />
              Withdraw
            </Button>
          </div>

          <div className="space-y-1">
            <div className="text-3xl md:text-4xl font-bold font-mono text-foreground tracking-tight">
              ${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>

          {pendingWithdrawals > 0 && (
            <div className="mt-4 flex items-center gap-2 text-xs text-warning">
              <div className="h-1.5 w-1.5 rounded-full bg-warning animate-pulse" />
              ${pendingWithdrawals.toLocaleString("en-US", { minimumFractionDigits: 2 })} pending withdrawal
            </div>
          )}
        </div>
      </div>

      {/* Recent Withdrawals */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 md:p-5 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Recent Withdrawals</h3>
        </div>
        {recentWithdrawals.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">No withdrawals yet.</div>
        ) : (
          <div className="divide-y divide-border">
            {recentWithdrawals.map((w) => (
              <div key={w.id} className="flex items-center justify-between p-3 md:p-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded-lg bg-destructive/10">
                    <ArrowUpRight className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground truncate max-w-[180px]">
                      {w.description || "Withdrawal"}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(w.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                </div>
                <div className="text-right flex items-center gap-3">
                  <span className="text-sm font-mono font-semibold text-destructive">
                    -${w.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </span>
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusColor(w.status)}`}>
                    {statusLabel(w.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Withdrawal Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Withdraw Funds</DialogTitle>
            <DialogDescription>
              Current wallet balance:{" "}
              <span className="font-mono font-semibold text-foreground">
                ${availableBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Amount */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Amount (USD)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary border-border font-mono"
              />
            </div>

            {/* Destination */}
            <div className="space-y-2">
              <Label className="text-foreground text-sm">Destination</Label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDestType("bank")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                    destType === "bank"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Landmark className="h-3.5 w-3.5" />
                  Bank
                </button>
                <button
                  onClick={() => setDestType("crypto")}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium border transition-all ${
                    destType === "crypto"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Bitcoin className="h-3.5 w-3.5" />
                  Crypto
                </button>
              </div>
            </div>

            {destType === "bank" && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Bank Name</Label>
                  <Input
                    placeholder="e.g. Chase, GTBank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="bg-secondary border-border"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Account Number</Label>
                  <Input
                    placeholder="Account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="bg-secondary border-border font-mono"
                  />
                </div>
              </>
            )}

            {destType === "crypto" && (
              <>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Cryptocurrency</Label>
                  <div className="flex gap-2">
                    {["BTC", "ETH", "USDT"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setCryptoCurrency(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                          cryptoCurrency === c
                            ? "border-primary/30 bg-primary/10 text-primary"
                            : "border-border bg-secondary text-muted-foreground"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground text-sm">Wallet Address</Label>
                  <Input
                    placeholder={`Your ${cryptoCurrency} address`}
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    className="bg-secondary border-border font-mono text-sm"
                  />
                </div>
              </>
            )}

            <Button variant="neon" className="w-full" onClick={handleWithdraw} disabled={loading}>
              {loading ? "Processing..." : "Request Withdrawal"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
