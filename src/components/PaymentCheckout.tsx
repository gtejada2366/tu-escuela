import { useState } from "react";
import { CreditCard, Shield, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { openCulqiCheckout, processPaymentCharge, isCulqiEnabled } from "../lib/culqi";

interface PaymentCheckoutProps {
  paymentId: number;
  studentName: string;
  concept: string;
  amount: number;
  dueDate: string;
  email: string;
  onSuccess: () => void;
  onClose: () => void;
}

type CheckoutState = "idle" | "processing" | "success" | "error";

export function PaymentCheckout({
  paymentId,
  studentName,
  concept,
  amount,
  dueDate,
  email,
  onSuccess,
  onClose,
}: PaymentCheckoutProps) {
  const [state, setState] = useState<CheckoutState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [chargeId, setChargeId] = useState("");

  const handlePay = async () => {
    setState("processing");
    setErrorMsg("");

    try {
      // Step 1: Open Culqi checkout and get token
      const token = await openCulqiCheckout({
        paymentId,
        studentName,
        concept,
        amount,
        email,
      });

      // Step 2: Send token to Edge Function to create charge
      const result = await processPaymentCharge(
        token.id,
        paymentId,
        amount,
        email,
        `${concept} — ${studentName}`,
      );

      if (result.success) {
        setState("success");
        setChargeId(result.chargeId ?? "");
        // Auto-close after 3 seconds
        setTimeout(onSuccess, 3000);
      } else {
        setState("error");
        setErrorMsg(result.error ?? "Error al procesar el pago");
      }
    } catch (err) {
      setState("error");
      setErrorMsg(err instanceof Error ? err.message : "Error desconocido");
    }
  };

  if (!isCulqiEnabled()) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
        <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm text-[#64748b] text-center">
            Pagos en línea no disponible. Contacte a la administración del colegio.
          </p>
          <button onClick={onClose} className="mt-4 w-full py-2 rounded-lg border border-border text-sm hover:bg-[#f8fafc]">
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl max-w-md w-full shadow-xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-lg bg-[#eff6ff]">
              <CreditCard className="w-5 h-5 text-[#2563eb]" />
            </div>
            <h2 className="text-lg text-[#1e293b]">Pagar en Línea</h2>
          </div>
          <p className="text-sm text-[#64748b] mt-1">Pago seguro con tarjeta o Yape</p>
        </div>

        {/* Body */}
        <div className="p-6">
          {state === "success" ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#d1fae5] flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-[#10b981]" />
              </div>
              <h3 className="text-lg text-[#1e293b] mb-2">Pago Exitoso</h3>
              <p className="text-sm text-[#64748b] mb-1">Tu pago ha sido procesado correctamente</p>
              {chargeId && (
                <p className="text-xs text-[#94a3b8]">Referencia: {chargeId}</p>
              )}
            </div>
          ) : state === "error" ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-[#fee2e2] flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-[#dc2626]" />
              </div>
              <h3 className="text-lg text-[#1e293b] mb-2">Error en el Pago</h3>
              <p className="text-sm text-[#dc2626] mb-4">{errorMsg}</p>
              <button
                onClick={() => { setState("idle"); setErrorMsg(""); }}
                className="px-4 py-2 rounded-lg bg-[#2563eb] text-white text-sm hover:bg-[#1d4ed8] transition-colors"
              >
                Intentar de Nuevo
              </button>
            </div>
          ) : (
            <>
              {/* Payment details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748b]">Estudiante</span>
                  <span className="text-sm text-[#1e293b]">{studentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748b]">Concepto</span>
                  <span className="text-sm text-[#1e293b]">{concept}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[#64748b]">Vencimiento</span>
                  <span className="text-sm text-[#1e293b]">{dueDate}</span>
                </div>
                <div className="flex justify-between pt-3 border-t border-border">
                  <span className="text-base text-[#1e293b]">Total a Pagar</span>
                  <span className="text-xl text-[#2563eb] font-semibold">S/ {amount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment methods info */}
              <div className="flex items-center gap-4 mb-6 p-3 rounded-lg bg-[#f8f9fb]">
                <div className="flex items-center gap-2">
                  <img src="https://cdn.culqi.com/bindings/images/visa.svg" alt="Visa" className="h-5" />
                  <img src="https://cdn.culqi.com/bindings/images/mastercard.svg" alt="Mastercard" className="h-5" />
                  <img src="https://cdn.culqi.com/bindings/images/amex.svg" alt="Amex" className="h-5" />
                  <img src="https://cdn.culqi.com/bindings/images/diners.svg" alt="Diners" className="h-5" />
                </div>
                <div className="h-6 w-px bg-border" />
                <span className="text-sm text-[#6b21a8] font-medium">Yape</span>
              </div>

              {/* Pay button */}
              <button
                onClick={handlePay}
                disabled={state === "processing"}
                className="w-full py-3 rounded-lg bg-[#2563eb] text-white text-sm font-medium hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state === "processing" ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    Pagar S/ {amount.toFixed(2)}
                  </>
                )}
              </button>

              {/* Security badge */}
              <div className="flex items-center justify-center gap-1 mt-4">
                <Shield className="w-3 h-3 text-[#10b981]" />
                <span className="text-xs text-[#64748b]">Pago seguro procesado por Culqi — PCI DSS Level 1</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {state !== "processing" && (
          <div className="px-6 pb-6">
            <button
              onClick={state === "success" ? onSuccess : onClose}
              className="w-full py-2 rounded-lg border border-border text-sm text-[#64748b] hover:bg-[#f8fafc] transition-colors"
            >
              {state === "success" ? "Cerrar" : "Cancelar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
