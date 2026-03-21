/**
 * Edge Function: process-payment
 *
 * Receives a Culqi token, creates a charge via Culqi API,
 * and updates the payment record in the database.
 *
 * Environment variables (set in Supabase Dashboard → Edge Functions → Secrets):
 *   CULQI_SECRET_KEY  — sk_live_... or sk_test_...
 *
 * Deploy:
 *   supabase functions deploy process-payment
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CULQI_API = "https://api.culqi.com/v2";

interface RequestBody {
  token: string;
  payment_id: number;
  amount_cents: number;
  email: string;
  description: string;
}

interface CulqiCharge {
  id: string;
  amount: number;
  currency_code: string;
  reference_code: string;
  outcome: { type: string; merchant_message: string; user_message: string };
}

Deno.serve(async (req: Request) => {
  // CORS
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const culqiSecret = Deno.env.get("CULQI_SECRET_KEY");
  if (!culqiSecret) {
    return json({ error: "Pasarela de pagos no configurada" }, 500);
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const { token, payment_id, amount_cents, email, description } = body;

  if (!token || !payment_id || !amount_cents || !email) {
    return json({ error: "Faltan campos requeridos" }, 400);
  }

  // --- Step 1: Create charge in Culqi ---
  let charge: CulqiCharge;
  try {
    const res = await fetch(`${CULQI_API}/charges`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${culqiSecret}`,
      },
      body: JSON.stringify({
        amount: amount_cents,
        currency_code: "PEN",
        email,
        source_id: token,
        description: description || "Pago escolar",
        metadata: {
          payment_id: String(payment_id),
        },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      const msg = data?.user_message || data?.merchant_message || "Error al procesar pago";
      return json({ error: msg }, 400);
    }

    charge = data;
  } catch (err) {
    return json({ error: `Error de conexión con Culqi: ${(err as Error).message}` }, 502);
  }

  // --- Step 2: Update payment in database ---
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const today = new Date().toISOString().split("T")[0];

  const { error: dbError } = await supabase
    .from("payments")
    .update({
      status: "paid",
      paid_date: today,
      payment_method: "online",
      transaction_id: charge.id,
    })
    .eq("id", payment_id);

  if (dbError) {
    // Charge went through but DB update failed — log for reconciliation
    console.error("DB update failed after successful charge:", {
      charge_id: charge.id,
      payment_id,
      error: dbError.message,
    });
    return json({
      error: "Pago procesado pero error al registrar. Contacte soporte.",
      charge_id: charge.id,
    }, 500);
  }

  return json({
    success: true,
    charge_id: charge.id,
    reference: charge.reference_code,
  });
});

function json(data: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
