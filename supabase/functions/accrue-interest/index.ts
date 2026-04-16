import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    // Fetch all active investments
    const { data: investments, error: invError } = await supabaseAdmin
      .from("investments")
      .select("id, user_id, amount, roi_percent, plan")
      .eq("status", "active");

    if (invError) throw invError;
    if (!investments || investments.length === 0) {
      return new Response(JSON.stringify({ message: "No active investments", processed: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const today = new Date().toISOString().split("T")[0];
    let processed = 0;
    const errors: string[] = [];

    for (const inv of investments) {
      // Daily interest = (amount * roi_percent / 100) / 10
      const dailyInterest = (inv.amount * inv.roi_percent / 100) / 10;
      const roundedInterest = Math.round(dailyInterest * 100) / 100;

      if (roundedInterest <= 0) continue;

      // Check if interest was already accrued today for this investment
      const { data: existing } = await supabaseAdmin
        .from("transactions")
        .select("id")
        .eq("investment_id", inv.id)
        .eq("type", "interest")
        .gte("created_at", `${today}T00:00:00Z`)
        .lt("created_at", `${today}T23:59:59Z`)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const { error: txError } = await supabaseAdmin
        .from("transactions")
        .insert({
          user_id: inv.user_id,
          type: "interest",
          amount: roundedInterest,
          status: "confirmed",
          description: `Daily interest - ${inv.plan} plan (${inv.roi_percent}% ROI)`,
          investment_id: inv.id,
        });

      if (txError) {
        errors.push(`Investment ${inv.id}: ${txError.message}`);
      } else {
        processed++;
      }
    }

    // Create admin notification
    if (processed > 0) {
      await supabaseAdmin.from("admin_notifications").insert({
        type: "interest",
        title: "Daily Interest Accrued",
        message: `Interest accrued for ${processed} active investment(s).`,
        metadata: { processed, date: today },
      });
    }

    return new Response(
      JSON.stringify({ message: "Interest accrual complete", processed, errors }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
