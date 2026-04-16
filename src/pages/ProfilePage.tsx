import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Upload, CheckCircle, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SecurityCenter } from "@/components/SecurityCenter";

export default function ProfilePage() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [kycStatus, setKycStatus] = useState("pending");

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name ?? "");
      setKycStatus(profile.kyc_status);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved", description: "Profile updated successfully." });
    }
  };

  const handleKycUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(filePath, file);

    if (uploadError) {
      toast({ title: "Upload Error", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ kyc_status: "submitted", kyc_document_url: filePath })
      .eq("user_id", user.id);

    setUploading(false);
    if (updateError) {
      toast({ title: "Error", description: updateError.message, variant: "destructive" });
    } else {
      setKycStatus("submitted");
      toast({ title: "KYC Submitted", description: "Your identity document has been submitted for review." });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings</p>
      </div>

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="bg-secondary border border-border">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-card border border-border rounded-xl p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{displayName || "Investor"}</h2>
                  <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Full Name</Label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Email</Label>
                  <Input defaultValue={user?.email ?? ""} className="bg-secondary border-border" readOnly />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Phone</Label>
                  <Input placeholder="+1 (555) 000-0000" value={phone} onChange={(e) => setPhone(e.target.value)} className="bg-secondary border-border" />
                </div>
                <Button variant="neon" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-2">Identity Verification (KYC)</h2>
              <p className="text-sm text-muted-foreground mb-6">Upload a government-issued ID to verify your identity and unlock full platform features.</p>

              {kycStatus === "submitted" || kycStatus === "verified" ? (
                <div className="border-2 border-dashed border-success/30 rounded-xl p-8 text-center bg-success/5">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4" />
                  <h3 className="text-foreground font-semibold">
                    {kycStatus === "verified" ? "Identity Verified" : "Document Submitted"}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {kycStatus === "verified" ? "Your identity has been verified." : "Your KYC document is under review. This typically takes 24–48 hours."}
                  </p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors">
                  <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-foreground font-semibold">Upload Document</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Passport, Driver's License, or National ID</p>
                  <label>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleKycUpload} />
                    <Button variant="neon-outline" asChild disabled={uploading}>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {uploading ? "Uploading..." : "Choose File"}
                      </span>
                    </Button>
                  </label>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="mt-6">
          <SecurityCenter />
        </TabsContent>
      </Tabs>
    </div>
  );
}
