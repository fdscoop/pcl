import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { crypto } from 'https://deno.land/std@0.177.0/crypto/mod.ts';

// ⚠️ DEV MODE: Environment variables (webhook secret optional for testing)
const RAZORPAY_WEBHOOK_SECRET = Deno.env.get("RAZORPAY_WEBHOOK_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// 🔐 HMAC-SHA256 signature verification (optional in dev mode)
async function verifyRazorpaySignature(
  body: string,
  signature: string,
  secret: string,
): Promise<boolean> {
  if (!secret) {
    console.warn("⚠️ DEV MODE: No webhook secret configured - SKIPPING signature verification");
    return true; // Skip verification in dev mode
  }

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    
    const expectedSignature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(body),
    );
    
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    return signature === expectedHex;
  } catch (error) {
    console.error("Signature verification failed:", error);
    return false;
  }
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Get signature from headers
  const signature = req.headers.get("x-razorpay-signature") || "";
  const bodyText = await req.text();

  console.log("🔔 Razorpay webhook received", {
    signature: signature.substring(0, 10) + "...",
    bodyLength: bodyText.length,
    hasSecret: !!RAZORPAY_WEBHOOK_SECRET
  });

  // 1️⃣ Verify webhook signature (optional in dev mode)
  const isValid = await verifyRazorpaySignature(
    bodyText,
    signature,
    RAZORPAY_WEBHOOK_SECRET,
  );

  if (!isValid) {
    console.error("❌ Invalid Razorpay signature");
    return new Response("Invalid signature", { status: 400 });
  }

  console.log("✅ Webhook signature verified (or skipped in dev mode)");

  // 2️⃣ Parse event JSON
  let event: any;
  try {
    event = JSON.parse(bodyText);
  } catch (err) {
    console.error("❌ Invalid JSON body", err);
    return new Response("Invalid JSON", { status: 400 });
  }

  const eventType = event?.event;
  const payload = event?.payload;

  console.log("✅ Razorpay event received:", eventType);

  // 3️⃣ Handle payment.captured
  if (eventType === "payment.captured") {
    const payment = payload?.payment?.entity;

    if (!payment) {
      console.error("❌ No payment entity in captured event");
      return new Response("Invalid payment data", { status: 400 });
    }

    try {
      console.log("💰 Processing payment.captured:", payment.id);

      // Find payment record using notes.payment_id (our local payment UUID)
      const paymentId = payment.notes?.payment_id;
      console.log("🔍 Looking for payment record with local ID:", paymentId);

      if (!paymentId) {
        console.error("❌ No payment_id in notes - cannot map to local record");
        return new Response("Missing payment_id in notes", { status: 400 });
      }

      // Update payment record with Razorpay payment details
      const { data: paymentRow, error } = await supabase
        .from('payments')
        .update({
          razorpay_payment_id: payment.id,
          razorpay_signature: signature,
          status: 'completed',
          payment_method: payment.method,
          completed_at: new Date().toISOString(),
          webhook_received: true,
          webhook_data: payment,
          webhook_received_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', paymentId)
        .select()
        .single()

      if (error) {
        console.error("❌ Error updating payment:", error);
      } else {
        console.log("✅ Payment updated successfully:", paymentRow.id);
      }

      // If payment is linked to a match, confirm the match
      if (paymentRow && paymentRow.match_id) {
        const { error: matchErr } = await supabase
          .from('matches')
          .update({ 
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentRow.match_id);

        if (matchErr) {
          console.error('❌ Error confirming match:', matchErr);
        } else {
          console.log('✅ Match confirmed for match_id', paymentRow.match_id);
        }
      }

    } catch (err) {
      console.error('❌ Error handling payment.captured webhook:', err);
    }
  }

  // 4️⃣ Handle payment.failed
  if (eventType === "payment.failed") {
    const payment = payload?.payment?.entity;

    if (payment) {
      try {
        console.log("💥 Processing payment.failed:", payment.id);

        const paymentId = payment.notes?.payment_id;
        if (!paymentId) {
          console.error("❌ No payment_id in notes for failed payment");
          return new Response("Missing payment_id in notes", { status: 400 });
        }

        // Update payment record to failed status
        const { data: paymentRow, error } = await supabase
          .from('payments')
          .update({
            razorpay_payment_id: payment.id,
            status: 'failed',
            webhook_received: true,
            webhook_data: payment,
            webhook_received_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('id', paymentId)
          .select()
          .single()

        if (error) {
          console.error("❌ Error updating failed payment:", error);
        } else {
          console.log("✅ Failed payment updated:", paymentRow.id);
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
    console.log("💸 Processing refund.processed event");
    // Handle refund logic here if needed
  }

  return new Response(JSON.stringify({ status: "ok" }), {
    headers: { "Content-Type": "application/json" },
  });
}