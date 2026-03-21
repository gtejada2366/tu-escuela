/**
 * Culqi Payment Gateway — Client-side integration
 * https://docs.culqi.com/
 *
 * Flow:
 * 1. Load Culqi Checkout JS
 * 2. Open checkout modal (card / Yape)
 * 3. Receive token
 * 4. Send token to Edge Function to create charge
 */

const CULQI_CHECKOUT_URL = "https://js.culqi.com/checkout-js";
const CULQI_PUBLIC_KEY = import.meta.env.VITE_CULQI_PUBLIC_KEY ?? "";

let scriptLoaded = false;
let scriptLoading = false;

/** Load Culqi Checkout script into DOM */
function loadScript(): Promise<void> {
  if (scriptLoaded) return Promise.resolve();
  if (scriptLoading) {
    return new Promise((resolve, reject) => {
      const check = setInterval(() => {
        if (scriptLoaded) { clearInterval(check); resolve(); }
        if (!scriptLoading) { clearInterval(check); reject(new Error("Culqi script failed")); }
      }, 100);
    });
  }

  scriptLoading = true;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CULQI_CHECKOUT_URL;
    script.async = true;
    script.onload = () => { scriptLoaded = true; scriptLoading = false; resolve(); };
    script.onerror = () => { scriptLoading = false; reject(new Error("No se pudo cargar Culqi")); };
    document.head.appendChild(script);
  });
}

export interface CulqiPaymentRequest {
  paymentId: number;
  studentName: string;
  concept: string;
  /** Amount in PEN (soles), e.g. 450.00 */
  amount: number;
  email: string;
}

export interface CulqiTokenResult {
  id: string;
  type: string;
  email: string;
  card_number: string;
  last_four: string;
  active: boolean;
  iin: { card_brand: string; card_type: string };
}

export interface CulqiChargeResult {
  success: boolean;
  chargeId?: string;
  error?: string;
}

declare global {
  interface Window {
    Culqi?: {
      publicKey: string;
      settings: (config: Record<string, unknown>) => void;
      options: (config: Record<string, unknown>) => void;
      open: () => void;
      close: () => void;
      token: CulqiTokenResult | null;
      order: unknown;
      error: { merchant_message: string; user_message: string } | null;
    };
    culqi?: () => void;
  }
}

/**
 * Open Culqi Checkout and return a token on success.
 * Rejects on user cancel or error.
 */
export async function openCulqiCheckout(req: CulqiPaymentRequest): Promise<CulqiTokenResult> {
  if (!CULQI_PUBLIC_KEY) {
    throw new Error("VITE_CULQI_PUBLIC_KEY no configurada");
  }

  await loadScript();

  const culqi = window.Culqi;
  if (!culqi) throw new Error("Culqi no disponible");

  culqi.publicKey = CULQI_PUBLIC_KEY;

  // Amount in céntimos (Culqi uses smallest currency unit)
  const amountCents = Math.round(req.amount * 100);

  culqi.settings({
    title: "Tu Escuela",
    currency: "PEN",
    amount: amountCents,
    order: undefined,
  });

  culqi.options({
    lang: "es",
    installments: false,
    paymentMethods: {
      tarjeta: true,
      yape: true,
      billetera: false,
      bancaMovil: false,
      agente: false,
      cuotealo: false,
    },
    style: {
      logo: undefined,
      bannerColor: "#2563eb",
      buttonBackground: "#2563eb",
      menuColor: "#2563eb",
      linksColor: "#2563eb",
      buttonText: "Pagar",
      buttonTextColor: "#ffffff",
      priceColor: "#1e293b",
    },
  });

  return new Promise<CulqiTokenResult>((resolve, reject) => {
    // Culqi calls window.culqi() on success or error
    window.culqi = () => {
      if (culqi.token) {
        resolve(culqi.token);
      } else if (culqi.error) {
        reject(new Error(culqi.error.user_message || culqi.error.merchant_message));
      } else {
        reject(new Error("Pago cancelado"));
      }
      // Clean up
      window.culqi = undefined;
    };

    culqi.open();
  });
}

/**
 * Send the Culqi token to our Edge Function to create a charge
 * and update the payment record.
 */
export async function processPaymentCharge(
  token: string,
  paymentId: number,
  amount: number,
  email: string,
  description: string,
): Promise<CulqiChargeResult> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  if (!supabaseUrl) return { success: false, error: "Supabase no configurado" };

  const response = await fetch(`${supabaseUrl}/functions/v1/process-payment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      token,
      payment_id: paymentId,
      amount_cents: Math.round(amount * 100),
      email,
      description,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return { success: false, error: data.error || "Error al procesar pago" };
  }

  return { success: true, chargeId: data.charge_id };
}

export function isCulqiEnabled(): boolean {
  return !!CULQI_PUBLIC_KEY;
}
