import { useEffect, useState, useCallback } from "react";
import { Copy, Check, Users, DollarSign, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Referral {
  user_id: string;
  display_name: string | null;
  created_at: string;
}

interface ReferralBonus {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export default function ReferralsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [bonuses, setBonuses] = useState<ReferralBonus[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;

    // Get own referral code
    const { data: profile } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("user_id", user.id)
      .single();

    if (profile) setReferralCode(profile.referral_code);

    // Get people I referred
    const { data: referred } = await supabase
      .from("profiles")
      .select("user_id, display_name, created_at")
      .eq("referred_by", user.id);

    setReferrals(referred ?? []);

    // Get my referral bonuses
    const { data: bonusData } = await supabase
      .from("referral_bonuses")
      .select("id, amount, status, created_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    setBonuses(bonusData ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('referrals')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'referral_bonuses', filter: `referrer_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchData())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchData]);

  const referralLink = referralCode
    ? `${window.location.origin}/?ref=${referralCode}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    setTimeout(() => setCopied(false), 2000);
  };

  const totalEarned = bonuses.filter(b => b.status === "approved").reduce((s, b) => s + b.amount, 0);
  const totalPending = bonuses.filter(b => b.status === "pending").reduce((s, b) => s + b.amount, 0);

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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Referrals</h1>
        <p className="text-muted-foreground mt-1">Invite friends and earn 15% bonus on their deposits</p>
      </div>

      {/* Referral Link */}
      <div className="bg-card border border-border rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" /> Your Referral Link
        </h2>
        <div className="flex gap-2">
          <div className="flex-1 bg-secondary rounded-lg px-4 py-3 text-sm font-mono text-foreground truncate border border-border">
            {referralLink || "Loading..."}
          </div>
          <Button variant="neon" onClick={handleCopy} disabled={!referralCode} className="gap-2">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">{referrals.length}</div>
          <div className="text-sm text-muted-foreground mt-1">Total Referrals</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-success/10"><DollarSign className="h-5 w-5 text-success" /></div>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            ${totalEarned.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Total Earned</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 rounded-lg bg-warning/10"><DollarSign className="h-5 w-5 text-warning" /></div>
          </div>
          <div className="text-2xl font-bold font-mono text-foreground">
            ${totalPending.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-sm text-muted-foreground mt-1">Pending Bonus</div>
        </div>
      </div>

      {/* Referral List */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-6 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">My Referrals</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No referrals yet. Share your link to start earning!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {referrals.map((r) => (
                  <tr key={r.user_id} className="hover:bg-secondary/50 transition-colors">
                    <td className="p-4 font-medium text-foreground">{r.display_name ?? "—"}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bonus History */}
      {bonuses.length > 0 && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="p-6 border-b border-border">
            <h2 className="text-lg font-semibold text-foreground">Bonus History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {bonuses.map((b) => (
                  <tr key={b.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="p-4 font-mono font-semibold text-foreground">
                      ${b.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        b.status === "approved" ? "bg-success/10 text-success" :
                        b.status === "rejected" ? "bg-destructive/10 text-destructive" :
                        "bg-warning/10 text-warning"
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
