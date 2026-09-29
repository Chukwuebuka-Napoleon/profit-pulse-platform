import { useEffect, useMemo, useState, useCallback } from "react";
import { Search, Download, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

interface Investor {
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  country: string | null;
  plan: string | null;
  invested: number;
  balance: number;
  kyc: string;
  onboarded: boolean;
  joined: string;
}

const kycClass = (s: string) =>
  s === "verified" ? "bg-success/10 text-success" :
  s === "rejected" ? "bg-destructive/10 text-destructive" :
  s === "submitted" ? "bg-warning/10 text-warning" : "bg-muted/50 text-muted-foreground";

export default function AdminInvestors() {
  const [rows, setRows] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [kyc, setKyc] = useState("all");
  const [plan, setPlan] = useState("all");

  const load = useCallback(async () => {
    const [{ data: profiles }, { data: invs }, { data: txs }] = await Promise.all([
      supabase.from("profiles").select("*"),
      supabase.from("investments").select("user_id, plan, amount, status, created_at"),
      supabase.from("transactions").select("user_id, type, amount, status"),
    ]);
    const list: Investor[] = (profiles ?? []).map((p) => {
      const mine = (invs ?? []).filter((i) => i.user_id === p.user_id);
      const latest = [...mine].sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
      const tx = (txs ?? []).filter((t) => t.user_id === p.user_id && t.status === "confirmed");
      const sum = (type: string) => tx.filter((t) => t.type === type).reduce((s, t) => s + Number(t.amount), 0);
      return {
        user_id: p.user_id,
        name: p.display_name ?? "—",
        email: p.email,
        phone: p.phone,
        country: p.country,
        plan: latest?.plan ?? p.preferred_plan ?? null,
        invested: mine.filter((i) => i.status === "active").reduce((s, i) => s + Number(i.amount), 0),
        balance: sum("deposit") + sum("interest") - sum("withdrawal"),
        kyc: p.kyc_status,
        onboarded: p.onboarding_completed,
        joined: p.created_at,
      };
    }).sort((a, b) => b.joined.localeCompare(a.joined));
    setRows(list);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) =>
      (kyc === "all" || r.kyc === kyc) &&
      (plan === "all" || r.plan === plan) &&
      (!s || [r.name, r.email, r.phone, r.country].some((v) => v?.toLowerCase().includes(s)))
    );
  }, [rows, q, kyc, plan]);

  const exportCsv = () => {
    const head = ["Name", "Email", "Phone", "Country", "Plan", "Invested", "Balance", "KYC", "Onboarded", "Joined"];
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [head, ...filtered.map((r) => [r.name, r.email, r.phone, r.country, r.plan, r.invested, r.balance.toFixed(2), r.kyc, r.onboarded ? "yes" : "no", r.joined.slice(0, 10)])]
      .map((row) => row.map(esc).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = "investors.csv";
    a.click();
  };

  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
  const selectCls = "h-10 rounded-md bg-secondary border border-border px-3 text-sm text-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Investors</h1>
          <p className="text-muted-foreground mt-1">{rows.length} registered · {rows.filter(r => r.invested > 0).length} actively investing</p>
        </div>
        <Button variant="neon-outline" size="sm" onClick={exportCsv} className="gap-2"><Download className="h-4 w-4" /> Export CSV</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, country" className="pl-9 bg-secondary border-border" />
        </div>
        <select value={plan} onChange={(e) => setPlan(e.target.value)} className={selectCls}>
          <option value="all">All plans</option><option value="starter">Starter</option><option value="silver">Silver</option><option value="gold">Gold</option>
        </select>
        <select value={kyc} onChange={(e) => setKyc(e.target.value)} className={selectCls}>
          <option value="all">All KYC</option><option value="pending">Pending</option><option value="submitted">Submitted</option><option value="verified">Verified</option><option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center h-40 items-center"><div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center text-muted-foreground text-sm">No investors match.</div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((r) => (
            <div key={r.user_id} className="bg-card border border-border rounded-xl p-4 grid gap-3 md:grid-cols-[2fr_1fr_1fr_1fr] md:items-center">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground">{r.name}</span>
                  {!r.onboarded && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/10 text-warning">Onboarding</span>}
                </div>
                {r.email && <a href={`mailto:${r.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary break-all"><Mail className="h-3 w-3 shrink-0" />{r.email}</a>}
                {r.phone && <a href={`tel:${r.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary"><Phone className="h-3 w-3" />{r.phone}</a>}
                <p className="text-xs text-muted-foreground">{r.country ?? "—"} · joined {new Date(r.joined).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
              </div>
              <div><p className="text-[11px] text-muted-foreground">Plan</p><p className="text-foreground capitalize">{r.plan ?? "—"}</p></div>
              <div><p className="text-[11px] text-muted-foreground">Invested / Balance</p><p className="font-mono text-foreground text-sm">{money(r.invested)}</p><p className="font-mono text-primary text-sm">{money(r.balance)}</p></div>
              <div><span className={`px-2.5 py-1 rounded-full text-xs font-medium ${kycClass(r.kyc)}`}>KYC {r.kyc}</span></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
