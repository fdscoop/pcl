// supabase/functions/razorpay-webhook/index.ts

// @ts-nocheck
// This file runs in Deno when deployed. TypeScript/IDE diagnostics in the
// editor may not resolve remote Deno imports; we disable type checking here
// to avoid spurious 'Cannot find module' and 'Cannot find name Deno' errors.
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.48.0";

// 🔐 Environment variables (set via `supabase secrets set`)
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Create Supabase client (server-side, safe)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// CORS headers for webhook responses
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-razorpay-signature',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response("Method not allowed", { 
      status: 405,
      headers: corsHeaders 
    });
  }

  // Get raw body text for signature verification
  const bodyText = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  console.log("🔔 Razorpay webhook received");
  console.log("📋 Signature present:", !!signature);
  console.log("📋 Signature value:", signature);
  console.log("📋 Body length:", bodyText.length);
  console.log("📋 First 100 chars of body:", bodyText.substring(0, 100));

  // Check if environment variables are set
  if (!RAZORPAY_WEBHOOK_SECRET) {
    console.error("❌ RAZORPAY_WEBHOOK_SECRET not configured");
    return new Response("Secret not configured", { 
      status: 500,
      headers: corsHeaders 
    });
  }

  if (!signature) {
    console.error("❌ No x-razorpay-signature header present");
    return new Response("Missing signature header", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  // 1️⃣ Verify webhook signature
  const isValid = await verifyRazorpaySignature(
    bodyText,
    signature,
    RAZORPAY_WEBHOOK_SECRET,
  );

  console.log("🔐 Signature verification result:", isValid);

  if (!isValid) {
    console.error("❌ Invalid Razorpay signature");
    console.error("   Expected signature:", signature);
    return new Response("Invalid signature", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  // 2️⃣ Parse event JSON
  let event: any;
  try {
    event = JSON.parse(bodyText);
  } catch (err) {
    console.error("❌ Invalid JSON body", err);
    return new Response("Invalid JSON", { 
      status: 400,
      headers: corsHeaders 
    });
  }

  const eventType = event?.event;
  const payload = event?.payload;

  console.log("✅ Razorpay event received:", eventType);

  // 3️⃣ Handle payment.captured
  if (eventType === "payment.captured") {
    const payment = payload?.payment?.entity;

    if (!payment) {
      console.error("❌ No payment entity in payload");
    } else {
      try {
        // Razorpay supports sending back custom notes. We include the local
        // payment record id in notes when opening checkout so the webhook can
        // directly map the Razorpay payment to our payments row.
        const notes = payment?.notes || {};
        let paymentRow = null;

        if (notes?.payment_id) {
          // If frontend passed our payment id into Razorpay notes, update by id
          const { error: updErr } = await supabase
            .from("payments")
            .update({
              status: payment.captured ? "completed" : "pending",
              payment_method: payment.method,
              payment_gateway: "razorpay",
              transaction_id: payment.id,
              webhook_received: true,
              webhook_data: JSON.stringify(payment),
              updated_at: new Date().toISOString(),
            })
            .eq("id", notes.payment_id);

          if (updErr) {
            console.error("❌ Error updating payment by id:", updErr);
          } else {
            console.log("✅ Payment updated by id:", notes.payment_id);
          }

          // Fetch the payment row we just updated
          const { data: fetched, error: fetchErr } = await supabase
            .from("payments")
            .select("*")
            .eq("id", notes.payment_id)
            .maybeSingle();

          if (fetchErr) console.error('❌ Error fetching payment by id:', fetchErr);
          paymentRow = fetched || null;
        } else {
          // Fallback: try to update by transaction_id (in case we already set it earlier)
          const { error: updErr } = await supabase
            .from("payments")
            .update({
              status: payment.captured ? "completed" : "pending",
              payment_method: payment.method,
              payment_gateway: "razorpay",
              transaction_id: payment.id,
              webhook_received: true,
              webhook_data: JSON.stringify(payment),
              updated_at: new Date().toISOString(),
            })
            .eq("transaction_id", payment.id);

          if (updErr) {
            console.error("❌ Error updating payment by transaction_id:", updErr);
          } else {
            console.log("✅ Payment updated by transaction_id:", payment.id);
          }

          const { data: fetched, error: fetchErr } = await supabase
            .from("payments")
            .select("*")
            .eq("transaction_id", payment.id)
            .maybeSingle();

          if (fetchErr) console.error('❌ Error fetching payment by transaction_id:', fetchErr);
          paymentRow = fetched || null;
        }

        // If we located a payment row and it references a match, attempt to finalize
        // the match (mark confirmed). Handle any DB errors gracefully.
        if (paymentRow && paymentRow.match_id) {
          try {
            const { error: matchErr } = await supabase
              .from('matches')
              .update({ 
                status: 'confirmed', 
                updated_at: new Date().toISOString() 
              })
              .eq('id', paymentRow.match_id);

            if (matchErr) {
              // If database constraint prevents confirmation (e.g., overlap constraint), log it.
              console.error('❌ Error confirming match for match_id', paymentRow.match_id, matchErr);
              // Optionally you could mark payment as 'issue' or notify admins here.
            } else {
              console.log('✅ Match confirmed for match_id', paymentRow.match_id);
            }
          } catch (err) {
            console.error('❌ Unexpected error while confirming match:', err);
          }
        } else {
          console.log('ℹ️ No local payment row found or no match_id present to confirm.');
        }
      } catch (err) {
        console.error('❌ Error handling payment.captured webhook:', err);
      }
    }
  }

  // 4️⃣ Handle payment.failed
  if (eventType === "payment.failed") {
    const payment = payload?.payment?.entity;

    if (!payment) {
      console.error("❌ No payment entity in payload");
    } else {
      try {
        const notes = payment?.notes || {};
        let paymentRow = null;

        // Try to find payment by id from notes or transaction_id
        if (notes?.payment_id) {
          const { data: fetched, error: fetchErr } = await supabase
            .from("payments")
            .select("*")
            .eq("id", notes.payment_id)
            .maybeSingle();

          if (fetchErr) console.error('❌ Error fetching payment by id:', fetchErr);
          paymentRow = fetched || null;
        } else {
          const { data: fetched, error: fetchErr } = await supabase
            .from("payments")
            .select("*")
            .eq("transaction_id", payment.id)
            .maybeSingle();

          if (fetchErr) console.error('❌ Error fetching payment by transaction_id:', fetchErr);
          paymentRow = fetched || null;
        }

        // Update payment status to failed
        const updateQuery = notes?.payment_id 
          ? supabase.from("payments").update({
              status: "failed",
              transaction_id: payment.id,
              webhook_received: true,
              webhook_data: JSON.stringify(payment),
              updated_at: new Date().toISOString(),
            }).eq("id", notes.payment_id)
          : supabase.from("payments").update({
              status: "failed",
              webhook_received: true,
              webhook_data: JSON.stringify(payment),
              updated_at: new Date().toISOString(),
            }).eq("transaction_id", payment.id);

        const { error } = await updateQuery;

        if (error) {
          console.error("❌ Error updating failed payment:", error);
        } else {
          console.log("✅ Failed payment updated:", payment.id);
        }

        // If payment is linked to a match, cancel the match
        if (paymentRow && paymentRow.match_id) {
          const { error: matchErr } = await supabase
            .from('matches')
            .update({ 
              status: 'cancelled',
              updated_at: new Date().toISOString()
            })
            .eq('id', paymentRow.match_id);

          if (matchErr) {
            console.error('❌ Error cancelling match after failed payment:', matchErr);
          } else {
            console.log('✅ Match cancelled for match_id', paymentRow.match_id);
          }
        }
      } catch (err) {
        console.error('❌ Error handling payment.failed webhook:', err);
      }
    }
  }

  // 5️⃣ Handle refund events
  if (eventType === "refund.processed") {
    const refund = payload?.refund?.entity;
    const payment = payload?.payment?.entity;

    if (!refund || !payment) {
      console.error("❌ No refund or payment entity in refund webhook");
    } else {
      try {
        // Update payment status and record refund details
        const { error: updErr } = await supabase
          .from("payments")
          .update({
            status: "refunded",
            webhook_received: true,
            webhook_data: JSON.stringify({ refund, payment }),
            updated_at: new Date().toISOString(),
          })
          .eq("transaction_id", payment.id);

        if (updErr) {
          console.error("❌ Error updating refunded payment:", updErr);
        } else {
          console.log("✅ Refunded payment updated:", payment.id);
        }
      } catch (err) {
        console.error('❌ Error handling refund.processed webhook:', err);
      }
    }
  }

  // Always respond quickly so Razorpay is happy
  return new Response("ok", { 
    status: 200,
    headers: corsHeaders 
  });
});

// ---------------- Signature verification helper ----------------

async function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!secret) {
    console.error("❌ RAZORPAY_WEBHOOK_SECRET is not set");
    return false;
  }

  try {
    console.log("🔐 Verifying signature:");
    console.log("   Secret length:", secret.length);
    console.log("   Body length:", body.length);
    console.log("   Signature length:", signature.length);

    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const bodyData = encoder.encode(body);

    console.log("   Encoded secret bytes:", keyData.length);
    console.log("   Encoded body bytes:", bodyData.length);

    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, bodyData);
    // Razorpay sends base64-encoded HMAC-SHA256 signature. Convert the
    // raw signature bytes to base64 for comparison.
    const expectedSignature = bufferToBase64(signatureBuffer);

    console.log("   Expected signature:", expectedSignature);
    console.log("   Received signature:", signature);
    console.log("   Match:", expectedSignature === signature);

    return expectedSignature === signature;
  } catch (err) {
    console.error("❌ Error verifying Razorpay signature:", err);
    return false;
  }
}

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  // Convert bytes to binary string then to base64
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  // btoa is available in Deno runtime
  return btoa(binary);
}