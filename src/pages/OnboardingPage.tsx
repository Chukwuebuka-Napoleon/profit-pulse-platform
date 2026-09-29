import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Check, Zap, Star, Crown, Upload, CheckCircle, ArrowRight, ArrowLeft, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const plans = [
  { id: "starter", name: "Starter", roi: "10%", min: 100, icon: Zap },
  { id: "silver", name: "Silver", roi: "20%", min: 500, icon: Star },
  { id: "gold", name: "Gold", roi: "35%", min: 2000, icon: Crown },
];

const detailsSchema = z.object({
  fullName: z.string().trim().min(2, "Enter your full name").max(100),
  phone: z.string().trim().regex(/^\+?[0-9\s\-()]{7,20}$/, "Enter a valid phone number"),
  country: z.string().trim().min(2, "Enter your country").max(60),
  dob: z.string().refine((v) => {
    const d = new Date(v);
    if (isNaN(d.getTime())) return false;
    const age = (Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000);
    return age >= 18 && age < 120;
  }, "You must be at least 18 years old"),
});

const steps = ["Your details", "Verify identity", "Choose a plan", "First deposit"];

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("");
  const [dob, setDob] = useState("");
  const [kycDone, setKycDone] = useState(false);
  const [plan, setPlan] = useState("silver");

  useEffect(() => {
    if (profile?.onboarding_completed) navigate("/dashboard", { replace: true });
    if (profile?.display_name && !fullName && !profile.display_name.includes("@")) setFullName(profile.display_name);
    if (profile && ["submitted", "verified"].includes(profile.kyc_status)) setKycDone(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const saveDetails = async () => {
    const parsed = detailsSchema.safeParse({ fullName, phone, country, dob });
    if (!parsed.success) {
      toast({ title: "Check your details", description: parsed.error.errors[0].message, variant: "destructive" });
      return;
    }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      display_name: parsed.data.fullName,
      phone: parsed.data.phone,
      country: parsed.data.country,
      date_of_birth: parsed.data.dob,
      email: user.email,
    }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setStep(1);
  };

  const uploadKyc = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 10 * 1024 * 1024) {
      return toast({ title: "File too large", description: "Maximum size is 10MB.", variant: "destructive" });
    }
    setSaving(true);
    const path = `${user.id}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("kyc-documents").upload(path, file);
    if (upErr) {
      setSaving(false);
      return toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
    }
    const { error } = await supabase.from("profiles").update({ kyc_status: "submitted", kyc_document_url: path }).eq("user_id", user.id);
    setSaving(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    await supabase.from("admin_notifications").insert({
      type: "kyc",
      title: "New KYC submission",
      message: `${fullName || user.email} submitted an ID document during onboarding.`,
      metadata: { user_id: user.id },
    });
    setKycDone(true);
  };

  const finish = async (goTo: string) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ preferred_plan: plan, onboarding_completed: true }).eq("user_id", user.id);
    if (!error) {
      await supabase.from("admin_notifications").insert({
        type: "new_investor",
        title: "New investor onboarded",
        message: `${fullName || user.email} completed onboarding and chose the ${plans.find(p => p.id === plan)?.name} plan.`,
        metadata: { user_id: user.id },
      });
    }
    await refreshProfile();
    setSaving(false);
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    navigate(goTo, { replace: true });
  };

  const selectedPlan = plans.find((p) => p.id === plan)!;

  return (
    <div className="min-h-screen bg-background flex items-start md:items-center justify-center p-4 py-10">
      <div className="w-full max-w-xl">
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Welcome to Profit Pulse</h1>
          <p className="text-muted-foreground mt-1">Let's get your investor account ready</p>
        </div>

        <div className="flex gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex-1">
              <div className={`h-1.5 rounded-full ${i <= step ? "bg-primary" : "bg-secondary"}`} />
              <p className={`text-[11px] mt-2 hidden sm:block ${i === step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Your details</h2>
              <div className="space-y-2"><Label>Full name</Label><Input value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Phone number</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000" maxLength={20} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Country</Label><Input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="United Kingdom" maxLength={60} className="bg-secondary border-border" /></div>
              <div className="space-y-2"><Label>Date of birth</Label><Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="bg-secondary border-border" /></div>
              <Button variant="neon" className="w-full gap-2" onClick={saveDetails} disabled={saving}>
                {saving ? "Saving..." : <>Continue <ArrowRight className="h-4 w-4" /></>}
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Verify your identity</h2>
              <p className="text-sm text-muted-foreground">Upload a passport, driver's license, or national ID.</p>
              {kycDone ? (
                <div className="border-2 border-dashed border-success/30 rounded-xl p-8 text-center bg-success/5">
                  <CheckCircle className="h-10 w-10 text-success mx-auto mb-3" />
                  <p className="text-foreground font-medium">Document submitted</p>
                  <p className="text-sm text-muted-foreground mt-1">We'll review it within 24–48 hours.</p>
                </div>
              ) : (
                <label className="block border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/40 transition-colors cursor-pointer">
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={uploadKyc} disabled={saving} />
                  <Upload className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-foreground font-medium">{saving ? "Uploading..." : "Tap to upload document"}</p>
                  <p className="text-xs text-muted-foreground mt-1">Image or PDF, max 10MB</p>
                </label>
              )}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(0)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button variant="neon" className="flex-1 gap-2" onClick={() => setStep(2)} disabled={saving}>
                  {kycDone ? "Continue" : "Do this later"} <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Choose your plan</h2>
              <div className="space-y-3">
                {plans.map((p) => (
                  <button key={p.id} onClick={() => setPlan(p.id)}
                    className={`w-full flex items-center gap-4 text-left rounded-xl p-4 border transition-all ${plan === p.id ? "border-primary neon-glow-sm" : "border-border hover:border-primary/40"}`}>
                    <p.icon className="h-5 w-5 text-primary" />
                    <div className="flex-1">
                      <p className="font-semibold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">From ${p.min.toLocaleString()}</p>
                    </div>
                    <span className="font-mono text-primary font-bold">{p.roi}</span>
                    {plan === p.id && <Check className="h-4 w-4 text-primary" />}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button variant="neon" className="flex-1 gap-2" onClick={() => setStep(3)}>Continue <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground">Make your first deposit</h2>
              <div className="rounded-xl bg-secondary p-4 flex items-center gap-3">
                <Wallet className="h-6 w-6 text-primary" />
                <p className="text-sm text-foreground">
                  Fund your account with at least <span className="font-mono text-primary">${selectedPlan.min.toLocaleString()}</span> to start the {selectedPlan.name} plan. Pay by card or crypto.
                </p>
              </div>
              <Button variant="neon" className="w-full gap-2" onClick={() => finish("/dashboard/deposit")} disabled={saving}>
                {saving ? "Finishing..." : <>Deposit now <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setStep(2)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Back</Button>
                <Button variant="neon-outline" className="flex-1" onClick={() => finish("/dashboard")} disabled={saving}>Skip to dashboard</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
