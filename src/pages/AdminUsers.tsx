import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, ChevronDown, ChevronUp, ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface UserRow {
  user_id: string;
  display_name: string | null;
  kyc_status: string;
  created_at: string;
  balance: number;
  referral_code: string | null;
  referred_by: string | null;
  referred_by_name: string | null;
  is_admin: boolean;
  sub_accounts: { user_id: string; display_name: string | null }[];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    const { data: profiles } = await supabase.from("profiles").select("*");
    if (!profiles) { setLoading(false); return; }

    const [{ data: allTx }, { data: allRoles }] = await Promise.all([
      supabase.from("transactions").select("user_id, type, amount, status"),
      supabase.from("user_roles").select("user_id, role"),
    ]);

    const profileMap = new Map(profiles.map(p => [p.user_id, p]));
    const adminSet = new Set(
      (allRoles ?? []).filter(r => r.role === "admin").map(r => r.user_id)
    );

    const userRows: UserRow[] = profiles.map((p) => {
      const userTx = (allTx ?? []).filter(t => t.user_id === p.user_id && t.status === "confirmed");
      const deposits = userTx.filter(t => t.type === "deposit").reduce((s, t) => s + t.amount, 0);
      const withdrawals = userTx.filter(t => t.type === "withdrawal").reduce((s, t) => s + t.amount, 0);
      const interest = userTx.filter(t => t.type === "interest").reduce((s, t) => s + t.amount, 0);

      const referrerProfile = p.referred_by ? profileMap.get(p.referred_by) : null;
      const subAccounts = profiles
        .filter(sp => sp.referred_by === p.user_id)
        .map(sp => ({ user_id: sp.user_id, display_name: sp.display_name }));

      return {
        user_id: p.user_id,
        display_name: p.display_name,
        kyc_status: p.kyc_status,
        created_at: p.created_at,
        balance: deposits - withdrawals + interest,
        referral_code: p.referral_code ?? null,
        referred_by: p.referred_by ?? null,
        referred_by_name: referrerProfile?.display_name ?? null,
        is_admin: adminSet.has(p.user_id),
        sub_accounts: subAccounts,
      };
    });

    setUsers(userRows);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-users')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => fetchUsers())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_roles' }, () => fetchUsers())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchUsers]);

  const handleKycAction = async (userId: string, newStatus: "verified" | "rejected") => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: newStatus })
      .eq("user_id", userId);

    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "verified" ? "KYC Verified" : "KYC Rejected", description: `User KYC status updated to ${newStatus}.` });
      fetchUsers();
    }
  };

  const handleToggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    setActionLoading(userId);
    if (currentlyAdmin) {
      const { error } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .eq("role", "admin");
      setActionLoading(null);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Admin Revoked", description: "User is no longer an admin." });
        fetchUsers();
      }
    } else {
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: userId, role: "admin" });
      setActionLoading(null);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Admin Granted", description: "User is now an admin." });
        fetchUsers();
      }
    }
  };

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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground mt-1">All registered users, referrals, balances, and role management</p>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {users.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No users yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-4 font-medium">Name</th>
                  <th className="text-left p-4 font-medium">Balance</th>
                  <th className="text-left p-4 font-medium">Referred By</th>
                  <th className="text-left p-4 font-medium">Referrals</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">KYC Status</th>
                  <th className="text-left p-4 font-medium">Joined</th>
                  <th className="text-left p-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map((u) => (
                  <>
                    <tr key={u.user_id} className="hover:bg-secondary/50 transition-colors">
                      <td className="p-4">
                        <div className="font-medium text-foreground">{u.display_name ?? "—"}</div>
                        <div className="font-mono text-muted-foreground text-xs">{u.user_id.slice(0, 8)}...</div>
                      </td>
                      <td className="p-4 font-mono font-semibold text-foreground">
                        ${u.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-foreground">
                        {u.referred_by_name ? (
                          <span className="text-primary font-medium">{u.referred_by_name}</span>
                        ) : (
                          <span className="text-muted-foreground">None</span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.sub_accounts.length > 0 ? (
                          <button
                            onClick={() => setExpandedUser(expandedUser === u.user_id ? null : u.user_id)}
                            className="flex items-center gap-1 text-primary font-medium hover:underline text-xs"
                          >
                            {u.sub_accounts.length} referral{u.sub_accounts.length > 1 ? "s" : ""}
                            {expandedUser === u.user_id ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </button>
                        ) : (
                          <span className="text-muted-foreground text-xs">0</span>
                        )}
                      </td>
                      <td className="p-4">
                        {u.is_admin ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">Admin</span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-muted/50 text-muted-foreground">User</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          u.kyc_status === "verified" ? "bg-success/10 text-success" :
                          u.kyc_status === "rejected" ? "bg-destructive/10 text-destructive" :
                          u.kyc_status === "submitted" ? "bg-warning/10 text-warning" :
                          "bg-muted/50 text-muted-foreground"
                        }`}>
                          {u.kyc_status}
                        </span>
                      </td>
                      <td className="p-4 text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="p-4">
                        <div className="flex gap-1.5 flex-wrap">
                          {u.kyc_status !== "verified" && (
                            <>
                              <Button
                                variant="neon"
                                size="sm"
                                disabled={actionLoading === u.user_id}
                                onClick={() => handleKycAction(u.user_id, "verified")}
                                className="gap-1 text-xs h-7"
                              >
                                <CheckCircle className="h-3 w-3" /> Verify
                              </Button>
                              {u.kyc_status !== "rejected" && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={actionLoading === u.user_id}
                                  onClick={() => handleKycAction(u.user_id, "rejected")}
                                  className="gap-1 text-xs h-7"
                                >
                                  <XCircle className="h-3 w-3" /> Reject
                                </Button>
                              )}
                            </>
                          )}
                          <Button
                            variant={u.is_admin ? "outline" : "secondary"}
                            size="sm"
                            disabled={actionLoading === u.user_id}
                            onClick={() => handleToggleAdmin(u.user_id, u.is_admin)}
                            className="gap-1 text-xs h-7"
                          >
                            {u.is_admin ? (
                              <><ShieldOff className="h-3 w-3" /> Revoke Admin</>
                            ) : (
                              <><ShieldCheck className="h-3 w-3" /> Make Admin</>
                            )}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedUser === u.user_id && u.sub_accounts.length > 0 && (
                      <tr key={`${u.user_id}-subs`}>
                        <td colSpan={8} className="px-8 py-3 bg-secondary/30">
                          <div className="text-xs font-medium text-muted-foreground mb-2">Sub-accounts referred by {u.display_name}:</div>
                          <div className="space-y-1">
                            {u.sub_accounts.map(sa => (
                              <div key={sa.user_id} className="flex items-center gap-2 text-sm">
                                <span className="text-foreground font-medium">{sa.display_name ?? "—"}</span>
                                <span className="text-muted-foreground font-mono text-xs">{sa.user_id.slice(0, 8)}...</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
