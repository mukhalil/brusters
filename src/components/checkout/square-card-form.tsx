"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import Script from "next/script";
import type { Card } from "@square/web-payments-sdk-types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export interface SquareCardFormHandle {
  tokenize: () => Promise<{ token: string }>;
}

interface SquareCardFormProps {
  onReady?: () => void;
  onError?: (message: string) => void;
}

const SQUARE_SDK_URL =
  process.env.NEXT_PUBLIC_SQUARE_ENVIRONMENT === "production"
    ? "https://web.squarecdn.com/v1/square.js"
    : "https://sandbox.web.squarecdn.com/v1/square.js";

export const SquareCardForm = forwardRef<
  SquareCardFormHandle,
  SquareCardFormProps
>(function SquareCardForm({ onReady, onError }, ref) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<Card | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const initRef = useRef(false);

  useImperativeHandle(ref, () => ({
    async tokenize() {
      if (!cardRef.current) {
        throw new Error("Card form is not ready");
      }

      const result = await cardRef.current.tokenize();

      if (result.status === "OK" && result.token) {
        return { token: result.token };
      }

      // Extract error details from the result
      const tokenErrors = "errors" in result ? result.errors : undefined;
      const errors = tokenErrors
        ?.map((e: { message?: string }) => e.message)
        .filter(Boolean)
        .join("; ");
      throw new Error(errors || "Card verification failed. Please check your card details.");
    },
  }));

  async function initCard() {
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
      const card = await payments.card();
      await card.attach("#square-card-container");

      cardRef.current = card;
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

  // Clean up card element on unmount
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
      <Script src={SQUARE_SDK_URL} strategy="afterInteractive" onReady={() => { initCard(); }} />

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

      <div
        id="square-card-container"
        ref={containerRef}
        className={loading || error ? "hidden" : ""}
      />
    </>
  );
});
