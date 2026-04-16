import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { generateTransactionPdf, generateMonthlyReport } from "@/utils/generatePdfStatement";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  confirmed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  cancelled: "bg-destructive/10 text-destructive",
};

export default function TransactionsPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTransactions(data ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('client-transactions')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`,
      }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchTransactions]);

  const handleDownloadMonthly = () => {
    const now = new Date();
    const month = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    generateMonthlyReport(transactions, month);
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-muted-foreground mt-1">Your deposit and withdrawal history</p>
        </div>
        {transactions.length > 0 && (
          <Button variant="neon-outline" size="sm" onClick={handleDownloadMonthly} className="gap-2">
            <FileText className="h-4 w-4" />
            Monthly Report
          </Button>
        )}
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {transactions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No transactions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground">
                  <th className="text-left p-4 font-medium">ID</th>
                  <th className="text-left p-4 font-medium">Type</th>
                  <th className="text-left p-4 font-medium">Amount</th>
                  <th className="text-left p-4 font-medium">Date</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">PDF</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary/50 transition-colors">
                    <td className="p-4 font-mono text-muted-foreground text-xs">{tx.id.slice(0, 8)}...</td>
                    <td className="p-4 text-foreground capitalize">{tx.type}</td>
                    <td className="p-4 font-mono font-semibold text-foreground">${tx.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</td>
                    <td className="p-4 text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusStyles[tx.status] ?? ""}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {tx.status === "confirmed" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generateTransactionPdf(tx)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
