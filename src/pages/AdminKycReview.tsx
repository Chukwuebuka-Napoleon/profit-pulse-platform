import { useEffect, useState, useCallback } from "react";
import { CheckCircle, XCircle, ExternalLink, FileText, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface KycUser {
  user_id: string;
  display_name: string | null;
  kyc_status: string;
  kyc_document_url: string | null;
  created_at: string;
}

export default function AdminKycReview() {
  const [users, setUsers] = useState<KycUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchKycUsers = useCallback(async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("user_id, display_name, kyc_status, kyc_document_url, created_at")
      .in("kyc_status", ["submitted", "pending"])
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchKycUsers(); }, [fetchKycUsers]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-kyc-review")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => fetchKycUsers())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchKycUsers]);

  const handleAction = async (userId: string, newStatus: "verified" | "rejected") => {
    setActionLoading(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ kyc_status: newStatus })
      .eq("user_id", userId);

    setActionLoading(null);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: newStatus === "verified" ? "KYC Approved" : "KYC Rejected",
        description: `User verification status set to ${newStatus}.`,
      });
    }
  };

  const handleViewDocument = async (url: string) => {
    // The url stored is the storage path, generate a signed URL
    const { data, error } = await supabase.storage
      .from("kyc-documents")
      .createSignedUrl(url, 300); // 5 min expiry

    if (error || !data?.signedUrl) {
      toast({ title: "Error", description: "Could not load document. " + (error?.message ?? ""), variant: "destructive" });
      return;
    }
    setPreviewUrl(data.signedUrl);
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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">KYC Document Review</h1>
        <p className="text-muted-foreground mt-1">Review and approve user identity documents</p>
      </div>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-3xl max-h-[85vh] w-full mx-4 bg-card border border-border rounded-xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-foreground font-semibold">Document Preview</h3>
              <div className="flex gap-2">
                <a href={previewUrl} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm" className="gap-1 text-xs">
                    <ExternalLink className="h-3 w-3" /> Open in new tab
                  </Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>✕</Button>
              </div>
            </div>
            <div className="p-4 flex items-center justify-center overflow-auto max-h-[70vh]">
              <img src={previewUrl} alt="KYC Document" className="max-w-full max-h-full object-contain rounded" />
            </div>
          </div>
        </div>
      )}

      {users.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-12 text-center">
          <CheckCircle className="h-12 w-12 text-primary/30 mx-auto mb-4" />
          <p className="text-muted-foreground">No pending KYC submissions to review.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {users.map((u) => (
            <div key={u.user_id} className="bg-card border border-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{u.display_name ?? "Unknown"}</p>
                  <p className="text-xs text-muted-foreground font-mono">{u.user_id.slice(0, 12)}...</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Submitted {new Date(u.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  u.kyc_status === "submitted" ? "bg-warning/10 text-warning" : "bg-muted/50 text-muted-foreground"
                }`}>
                  {u.kyc_status}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {u.kyc_document_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDocument(u.kyc_document_url!)}
                    className="gap-1 text-xs"
                  >
                    <FileText className="h-3.5 w-3.5" /> View Document
                  </Button>
                ) : (
                  <span className="text-xs text-muted-foreground italic">No document</span>
                )}
                <Button
                  variant="neon"
                  size="sm"
                  disabled={actionLoading === u.user_id}
                  onClick={() => handleAction(u.user_id, "verified")}
                  className="gap-1 text-xs"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={actionLoading === u.user_id}
                  onClick={() => handleAction(u.user_id, "rejected")}
                  className="gap-1 text-xs"
                >
                  <XCircle className="h-3.5 w-3.5" /> Reject
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
