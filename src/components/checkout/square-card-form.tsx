"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Script from "next/script";
import type { Card, ApplePay, Payments } from "@square/web-payments-sdk-types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export interface SquareCardFormHandle {
  tokenize: () => Promise<{ token: string }>;
}

interface SquareCardFormProps {
  onReady?: () => void;
  onError?: (message: string) => void;
  onApplePayToken?: (token: string) => void; // Called when Apple Pay completes — parent should submit order
  totalAmount: string; // e.g., "12.50" — needed for Apple Pay payment request
}

const SQUARE_SDK_URL =
  process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

export const SquareCardForm = forwardRef<
  SquareCardFormHandle,
  SquareCardFormProps
>(function SquareCardForm({ onReady, onError, onApplePayToken, totalAmount }, ref) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [applePayProcessing, setApplePayProcessing] = useState(false);
  const cardRef = useRef<Card | null>(null);
  const applePayRef = useRef<ApplePay | null>(null);
  const paymentsRef = useRef<Payments | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useImperativeHandle(ref, () => ({
    async tokenize() {
      // If Apple Pay is processing, wait for that result
      if (applePayProcessing) {
        throw new Error("Apple Pay is already processing");
      }

      if (!cardRef.current) {
        throw new Error("Card form is not ready");
      }

      const result = await cardRef.current.tokenize();

      if (result.status === "OK" && result.token) {
        return { token: result.token };
      }

      const tokenErrors = "errors" in result ? result.errors : undefined;
      const errors = tokenErrors
        ?.map((e: { message?: string }) => e.message)
        .filter(Boolean)
        .join("; ");
      throw new Error(errors || "Card verification failed. Please check your card details.");
    },
  }));

  async function initPayments() {
    if (initRef.current) return;
    initRef.current = true;

    try {
      if (!window.Square) {
        throw new Error("Square SDK failed to load");
      }

      const appId = process.env.NEXT_PUBLIC_SQUARE_APPLICATION_ID;
      const locId = process.env.NEXT_PUBLIC_SQUARE_LOCATION_ID;

      if (!appId || !locId) {
        throw new Error("Square configuration is missing");
      }

      const payments = await window.Square.payments(appId, locId);
      paymentsRef.current = payments;

      // Initialize card form
      const card = await payments.card();
      await card.attach("#square-card-container");
      cardRef.current = card;

      // Try to initialize Apple Pay
      try {
        const paymentRequest = payments.paymentRequest({
          countryCode: "US",
          currencyCode: "USD",
          total: {
            amount: totalAmount,
            label: "Total",
          },
        });
        const applePay = await payments.applePay(paymentRequest);
        applePayRef.current = applePay;
        setApplePayAvailable(true);
      } catch {
        // Apple Pay not available on this device/browser — that's fine
        setApplePayAvailable(false);
      }

      setLoading(false);
      onReady?.();
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load payment form";
      setError(msg);
      setLoading(false);
      onError?.(msg);
    }
  }

  async function handleApplePayClick() {
    if (!applePayRef.current) return;

    setApplePayProcessing(true);
    try {
      // tokenize() MUST be called immediately in the click handler per Apple Pay requirements
      const result = await applePayRef.current.tokenize();

      if (result.status === "OK" && result.token) {
        onApplePayToken?.(result.token);
        return;
      }

      const tokenErrors = "errors" in result ? result.errors : undefined;
      const errors = tokenErrors
        ?.map((e: { message?: string }) => e.message)
        .filter(Boolean)
        .join("; ");
      onError?.(errors || "Apple Pay failed");
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Apple Pay failed");
    } finally {
      setApplePayProcessing(false);
    }
  }

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (cardRef.current) {
        cardRef.current.destroy();
        cardRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <Script src={SQUARE_SDK_URL} strategy="afterInteractive" onReady={() => { initPayments(); }} />

      {loading && !error && (
        <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted">
          <LoadingSpinner size="sm" />
          <span>Loading payment form...</span>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Apple Pay button — only shown when available */}
      {applePayAvailable && !loading && !error && (
        <div className="mb-4">
          <div
            onClick={!applePayProcessing ? handleApplePayClick : undefined}
            role="button"
            tabIndex={0}
            aria-label="Pay with Apple Pay"
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleApplePayClick(); } }}
            style={{
              WebkitAppearance: "-apple-pay-button",
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } as any}
            className={`h-12 w-full rounded-lg cursor-pointer ${applePayProcessing ? "opacity-50 pointer-events-none" : ""}`}
          />
          <div className="my-3 flex items-center gap-3">
            <div className="flex-1 border-t border-border" />
            <span className="text-xs text-muted">or pay with card</span>
            <div className="flex-1 border-t border-border" />
          </div>
        </div>
      )}

      <div
        id="square-card-container"
        ref={containerRef}
        className={loading || error ? "hidden" : ""}
      />
    </>
  );
});
