import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, PlusCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface PendingWithdrawal {
  id: string;
  user_id: string;
  amount: number;
  description: string | null;
  created_at: string;
  profile_name?: string;
}

export default function AdminActions() {
  const [userId, setUserId] = useState("");
  const [interestAmount, setInterestAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<PendingWithdrawal[]>([]);
  const [loadingWithdrawals, setLoadingWithdrawals] = useState(true);
  const { toast } = useToast();

  const fetchPendingWithdrawals = useCallback(async () => {
    setLoadingWithdrawals(true);
    const { data, error } = await supabase
      .from("transactions")
      .select("id, user_id, amount, description, created_at")
      .eq("type", "withdrawal")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : { data: [] };

      const profileMap = new Map<string, string>(profiles?.map((p) => [p.user_id, p.display_name ?? ""] as [string, string]) ?? []);
      setPendingWithdrawals(
        data.map((w) => ({ ...w, profile_name: profileMap.get(w.user_id) || undefined }))
      );
    }
    setLoadingWithdrawals(false);
  }, []);

  useEffect(() => {
    fetchPendingWithdrawals();
  }, [fetchPendingWithdrawals]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-withdrawals')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
      }, () => {
        fetchPendingWithdrawals();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchPendingWithdrawals]);

  const handleWithdrawalAction = async (id: string, action: "confirmed" | "cancelled") => {
    setLoading(true);
    const { error } = await supabase
      .from("transactions")
      .update({ status: action })
      .eq("id", id);

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: action === "confirmed" ? "Withdrawal Approved" : "Withdrawal Declined",
        description: `The withdrawal has been ${action === "confirmed" ? "approved" : "declined"}.`,
      });
    }
  };

  const handleApproveDeposit = async () => {
    if (!userId) {
      toast({ title: "Error", description: "Please enter a user ID", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("transactions")
      .update({ status: "confirmed" })
      .eq("user_id", userId)
      .eq("type", "deposit")
      .eq("status", "pending")
      .select();

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deposit Approved", description: `${data?.length ?? 0} pending deposit(s) confirmed for user.` });
    }
  };

  const handleAddInterest = async () => {
    if (!userId || !interestAmount) {
      toast({ title: "Error", description: "Please enter user ID and amount", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("transactions").insert({
      user_id: userId,
      type: "interest",
      amount: parseFloat(interestAmount),
      status: "confirmed",
      description: "Manual interest added by admin",
    });

    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Interest Added", description: `$${interestAmount} added to user's account.` });
      setInterestAmount("");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Action Center</h1>
        <p className="text-muted-foreground mt-1">Manage deposits, withdrawals, and interest</p>
      </div>

      {/* Pending Withdrawals */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">Pending Withdrawal Requests</h2>
        {loadingWithdrawals ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : pendingWithdrawals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No pending withdrawal requests.</p>
        ) : (
          <div className="space-y-3">
            {pendingWithdrawals.map((w) => (
              <div
                key={w.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-lg bg-secondary/50 border border-border"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">
                    {w.profile_name || "Unknown User"}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">{w.user_id}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {w.description} · {new Date(w.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-lg font-bold font-mono text-foreground">
                  ${w.amount.toLocaleString()}
                </span>
                <div className="flex gap-2 shrink-0">
                  <Button
                    variant="neon"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleWithdrawalAction(w.id, "confirmed")}
                    className="gap-1"
                  >
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={loading}
                    onClick={() => handleWithdrawalAction(w.id, "cancelled")}
                    className="gap-1"
                  >
                    <XCircle className="h-3.5 w-3.5" /> Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Manual Actions */}
      <div className="bg-card border border-border rounded-xl p-6 max-w-lg">
        <h2 className="text-lg font-semibold text-foreground mb-4">Manual Actions</h2>
        <div className="space-y-4 mb-6">
          <Label className="text-foreground">User ID</Label>
          <Input
            placeholder="Paste user UUID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="bg-secondary border-border font-mono"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3 mb-8">
          <Button variant="neon" onClick={handleApproveDeposit} disabled={loading} className="gap-2">
            <CheckCircle className="h-4 w-4" /> Approve Deposit
          </Button>
        </div>

        <div className="border-t border-border pt-6">
          <h3 className="text-foreground font-semibold mb-4">Add Interest Manually</h3>
          <div className="flex gap-3">
            <Input
              type="number"
              placeholder="Amount (USD)"
              value={interestAmount}
              onChange={(e) => setInterestAmount(e.target.value)}
              className="bg-secondary border-border font-mono"
            />
            <Button variant="neon-outline" onClick={handleAddInterest} disabled={loading} className="gap-2 shrink-0">
              <PlusCircle className="h-4 w-4" /> Add Interest
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
