import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { deposit_id, user_id, amount } = await req.json();

    if (!deposit_id || !user_id || !amount) {
      return new Response(JSON.stringify({ error: "Missing fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if this user was referred by someone
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("referred_by")
      .eq("user_id", user_id)
      .single();

    if (!profile?.referred_by) {
      return new Response(JSON.stringify({ message: "No referrer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if bonus already exists for this deposit
    const { data: existing } = await supabaseAdmin
      .from("referral_bonuses")
      .select("id")
      .eq("deposit_id", deposit_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ message: "Bonus already exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bonusAmount = Number(amount) * 0.15;

    // Create pending referral bonus
    const { error: bonusError } = await supabaseAdmin
      .from("referral_bonuses")
      .insert({
        referrer_id: profile.referred_by,
        referred_id: user_id,
        deposit_id,
        amount: bonusAmount,
        status: "pending",
      });

    if (bonusError) throw bonusError;

    // Create admin notification
    await supabaseAdmin.from("admin_notifications").insert({
      type: "referral_bonus",
      title: "Referral Bonus Pending",
      message: `A 15% referral bonus of $${bonusAmount.toFixed(2)} is pending approval.`,
      metadata: { referrer_id: profile.referred_by, deposit_id, amount: bonusAmount },
    });

    return new Response(JSON.stringify({ success: true, bonus: bonusAmount }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
