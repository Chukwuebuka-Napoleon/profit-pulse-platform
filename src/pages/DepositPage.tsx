import { useState, useEffect } from "react";
import { CreditCard, Bitcoin, Copy, Check, ExternalLink, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";

const PRESET_AMOUNTS = [100, 500, 1000, 5000];

const CRYPTO_WALLETS = [
  {
    currency: "BTC",
    name: "Bitcoin",
    address: "bc1qu2g0jau7anad0rcwu3td48q837kxxxjlyakcex",
    icon: "₿",
    color: "text-orange-400",
  },
  {
    currency: "ETH",
    name: "Ethereum",
    address: "0x76610784AeB09668BB02C77c891c57a24C44Df58",
    icon: "Ξ",
    color: "text-blue-400",
  },
  {
    currency: "USDT",
    name: "Tether (TRC-20)",
    address: "TTrCWfNkQkUZksaWNHrGR22T53VpixW8wJ",
    icon: "₮",
    color: "text-emerald-400",
  },
];

export default function DepositPage() {
  const [loading, setLoading] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [copiedAddr, setCopiedAddr] = useState<string | null>(null);
  const [tab, setTab] = useState<"card" | "crypto">("card");
  const [amount, setAmount] = useState("");
  const [cryptoAmount, setCryptoAmount] = useState("");
  const [cryptoTxHash, setCryptoTxHash] = useState("");
  const [selectedCrypto, setSelectedCrypto] = useState(CRYPTO_WALLETS[0].currency);
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get("status") === "successful") {
      toast({ title: "Payment Received!", description: "Your deposit is being processed and will appear shortly." });
    }
    if (searchParams.get("status") === "cancelled") {
      toast({ title: "Payment Canceled", description: "Your deposit was not completed.", variant: "destructive" });
    }
  }, [searchParams, toast]);

  const handleDeposit = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 1) {
      toast({ title: "Invalid Amount", description: "Please enter a valid deposit amount.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-deposit", {
        body: { amount: numAmount },
      });
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddr(address);
    toast({ title: "Copied!", description: "Wallet address copied to clipboard." });
    setTimeout(() => setCopiedAddr(null), 2000);
  };

  const handleCryptoSubmit = async () => {
    const numAmount = parseFloat(cryptoAmount);
    if (!numAmount || numAmount < 1) {
      toast({ title: "Invalid Amount", description: "Please enter a valid amount.", variant: "destructive" });
      return;
    }
    const trimmedHash = cryptoTxHash.trim();
    if (!trimmedHash || trimmedHash.length < 10) {
      toast({ title: "Invalid Transaction Hash", description: "Please enter a valid transaction hash.", variant: "destructive" });
      return;
    }
    setCryptoLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const wallet = CRYPTO_WALLETS.find(w => w.currency === selectedCrypto);
      const txRef = `crypto-${selectedCrypto.toLowerCase()}-${Date.now()}`;

      const { error } = await supabase.from("transactions").insert({
        user_id: user.id,
        type: "deposit",
        amount: numAmount,
        status: "pending",
        description: `Crypto deposit (${selectedCrypto}) — TX: ${trimmedHash}`,
        payment_method: `crypto-${selectedCrypto.toLowerCase()}`,
        tx_ref: txRef,
        user_email: user.email,
      });
      if (error) throw error;

      toast({ title: "Deposit Submitted", description: "Your crypto deposit is pending admin review." });
      setCryptoAmount("");
      setCryptoTxHash("");
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setCryptoLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Deposit Funds</h1>
        <p className="text-muted-foreground mt-1">Add funds to your account via card or crypto</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("card")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "card"
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <CreditCard className="h-4 w-4" />
          Pay Online
        </button>
        <button
          onClick={() => setTab("crypto")}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
            tab === "crypto"
              ? "bg-primary/10 text-primary border border-primary/30"
              : "bg-card border border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bitcoin className="h-4 w-4" />
          Cryptocurrency
        </button>
      </div>

      {/* Card Deposits via Flutterwave */}
      {tab === "card" && (
        <div className="space-y-5">
          <p className="text-sm text-muted-foreground">
            Enter a deposit amount. You'll be redirected to a secure Flutterwave checkout page supporting cards, bank transfers, and mobile money.
          </p>
          <div className="bg-card border border-border rounded-xl p-6 max-w-md space-y-5">
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Amount (USD)</label>
              <Input
                type="number"
                placeholder="Enter amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-secondary border-border font-mono text-lg"
                min={1}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESET_AMOUNTS.map((preset) => (
                <button
                  key={preset}
                  onClick={() => setAmount(String(preset))}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    amount === String(preset)
                      ? "bg-primary/10 text-primary border-primary/30"
                      : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  ${preset.toLocaleString()}
                </button>
              ))}
            </div>
            <Button
              variant="neon"
              className="w-full"
              disabled={loading || !amount}
              onClick={handleDeposit}
            >
              {loading ? (
                "Redirecting..."
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Pay ${amount ? parseFloat(amount).toLocaleString() : "0"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Crypto Deposits */}
      {tab === "crypto" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Send crypto to the wallet addresses below. Deposits are credited after network confirmation.
          </p>
          <div className="space-y-4">
            {CRYPTO_WALLETS.map((wallet) => (
              <div
                key={wallet.currency}
                className="bg-card border border-border rounded-xl p-5 flex items-center gap-4"
              >
                <div
                  className={`h-12 w-12 rounded-full bg-secondary flex items-center justify-center text-xl font-bold ${wallet.color}`}
                >
                  {wallet.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground">
                    {wallet.name}{" "}
                    <span className="text-muted-foreground font-normal text-sm">({wallet.currency})</span>
                  </p>
                  <p className="text-xs font-mono text-muted-foreground truncate mt-1">{wallet.address}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyAddress(wallet.address)}
                  className="shrink-0"
                >
                  {copiedAddr === wallet.address ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>

          {/* Crypto Deposit Submission Form */}
          <div className="bg-card border border-border rounded-xl p-6 max-w-md space-y-4">
            <h3 className="font-semibold text-foreground">Submit Crypto Deposit</h3>
            <p className="text-xs text-muted-foreground">After sending crypto, fill in the details below for admin verification.</p>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Cryptocurrency</label>
              <div className="flex gap-2">
                {CRYPTO_WALLETS.map((w) => (
                  <button
                    key={w.currency}
                    onClick={() => setSelectedCrypto(w.currency)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                      selectedCrypto === w.currency
                        ? "bg-primary/10 text-primary border-primary/30"
                        : "bg-secondary border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {w.currency}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Amount (USD equivalent)</label>
              <Input
                type="number"
                placeholder="Enter amount sent"
                value={cryptoAmount}
                onChange={(e) => setCryptoAmount(e.target.value)}
                className="bg-secondary border-border font-mono"
                min={1}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">Transaction Hash</label>
              <Input
                placeholder="Paste your transaction hash"
                value={cryptoTxHash}
                onChange={(e) => setCryptoTxHash(e.target.value)}
                className="bg-secondary border-border font-mono text-xs"
              />
            </div>
            <Button
              variant="neon"
              className="w-full"
              disabled={cryptoLoading || !cryptoAmount || !cryptoTxHash.trim()}
              onClick={handleCryptoSubmit}
            >
              {cryptoLoading ? "Submitting..." : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Deposit for Review
                </>
              )}
            </Button>
          </div>

          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 text-sm text-muted-foreground">
            <strong className="text-foreground">Important:</strong> Only send the correct cryptocurrency to each
            address. Sending the wrong token may result in permanent loss of funds.
          </div>
        </div>
      )}
    </div>
  );
}
