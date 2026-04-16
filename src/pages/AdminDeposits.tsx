import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface DepositRow {
  id: string;
  user_id: string;
  amount: number;
  status: string;
  description: string | null;
  payment_method: string | null;
  tx_ref: string | null;
  user_email: string | null;
  created_at: string;
  profile_name?: string;
}

export default function AdminDeposits() {
  const [deposits, setDeposits] = useState<DepositRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { toast } = useToast();

  const fetchDeposits = useCallback(async () => {
    const { data, error } = await supabase
      .from("transactions")
      .select("id, user_id, amount, status, description, payment_method, tx_ref, user_email, created_at")
      .eq("type", "deposit")
      .order("created_at", { ascending: false });

    if (!error && data) {
      const userIds = [...new Set(data.map((d) => d.user_id))];
      const { data: profiles } = userIds.length > 0
        ? await supabase.from("profiles").select("user_id, display_name").in("user_id", userIds)
        : { data: [] };

      const profileMap = new Map<string, string>(profiles?.map((p) => [p.user_id, p.display_name ?? ""] as [string, string]) ?? []);
      setDeposits(data.map((d) => ({ ...d, profile_name: profileMap.get(d.user_id) || undefined })));
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchDeposits(); }, [fetchDeposits]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('admin-deposits')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
      }, () => {
        fetchDeposits();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchDeposits]);

  const handleAction = async (id: string, action: "confirmed" | "cancelled", userId?: string, amount?: number) => {
    setActionLoading(true);
    const { error } = await supabase
      .from("transactions")
      .update({ status: action })
      .eq("id", id);
    setActionLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: action === "confirmed" ? "Deposit Approved" : "Deposit Declined" });

      // Trigger referral bonus calculation on confirmed deposits
      if (action === "confirmed" && userId && amount) {
        supabase.functions.invoke("referral-bonus", {
          body: { deposit_id: id, user_id: userId, amount },
        });
      }
    }
  };

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      confirmed: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${styles[status] ?? "bg-muted text-muted-foreground border-border"}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Deposit Management</h1>
        <p className="text-muted-foreground mt-1">Full audit trail of all deposits</p>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-sm">Loading deposits…</p>
      ) : deposits.length === 0 ? (
        <p className="text-muted-foreground text-sm">No deposits found.</p>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">User</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Amount</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Method</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Tx Ref</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Status</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Date</th>
                  <th className="px-4 py-3 text-left text-muted-foreground font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {deposits.map((d) => (
                  <tr key={d.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{d.profile_name || "Unknown"}</p>
                      <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[120px]">{d.user_id}</p>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{d.user_email || "—"}</td>
                    <td className="px-4 py-3 font-mono font-bold text-foreground">${d.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-muted-foreground capitalize">{d.payment_method || "—"}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-muted-foreground truncate max-w-[140px] block">{d.tx_ref || "—"}</span>
                    </td>
                    <td className="px-4 py-3">{statusBadge(d.status)}</td>
                    <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(d.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      {d.status === "pending" ? (
                        <div className="flex gap-1.5">
                          <Button variant="neon" size="sm" disabled={actionLoading} onClick={() => handleAction(d.id, "confirmed", d.user_id, d.amount)} className="gap-1 text-xs h-7">
                            <CheckCircle className="h-3 w-3" /> Approve
                          </Button>
                          <Button variant="destructive" size="sm" disabled={actionLoading} onClick={() => handleAction(d.id, "cancelled")} className="gap-1 text-xs h-7">
                            <XCircle className="h-3 w-3" /> Decline
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
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
