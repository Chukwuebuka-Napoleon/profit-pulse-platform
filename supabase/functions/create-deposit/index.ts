import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  // Service role client for inserting notifications
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated");

    const { amount } = await req.json();
    if (!amount || amount < 1) throw new Error("Invalid amount");

    const flwSecretKey = Deno.env.get("FLUTTERWAVE_SECRET_KEY");
    if (!flwSecretKey) throw new Error("Payment provider not configured");

    const txRef = `dep-${user.id}-${Date.now()}`;
    const origin = req.headers.get("origin") || "https://localhost:5173";

    const response = await fetch("https://api.flutterwave.com/v3/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${flwSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tx_ref: txRef,
        amount: amount,
        currency: "USD",
        redirect_url: `${origin}/dashboard/deposit?status=successful&tx_ref=${txRef}`,
        customer: {
          email: user.email,
          name: user.user_metadata?.full_name || user.email,
        },
        customizations: {
          title: "Account Deposit",
          description: `Deposit $${amount} to your account`,
        },
        meta: {
          user_id: user.id,
        },
      }),
    });

    const result = await response.json();

    if (result.status !== "success") {
      throw new Error(result.message || "Failed to initialize payment");
    }

    const userName = user.user_metadata?.full_name || user.email;

    // Create a pending transaction with payment details
    await supabaseClient.from("transactions").insert({
      user_id: user.id,
      type: "deposit",
      amount: amount,
      status: "pending",
      description: `Deposit via Flutterwave (ref: ${txRef})`,
      payment_method: "flutterwave",
      tx_ref: txRef,
      user_email: user.email,
    });

    // Create admin notification
    await supabaseAdmin.from("admin_notifications").insert({
      type: "deposit",
      title: "New Deposit Request",
      message: `${userName} initiated a $${amount.toLocaleString()} deposit via Flutterwave.`,
      metadata: {
        user_id: user.id,
        user_email: user.email,
        user_name: userName,
        amount,
        tx_ref: txRef,
        payment_method: "flutterwave",
      },
    });

    return new Response(JSON.stringify({ url: result.data.link }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
