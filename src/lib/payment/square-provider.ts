import { SquareClient, SquareEnvironment, SquareError } from "square";
import { randomUUID } from "crypto";
import type { PaymentProvider, PaymentResult } from "./types";

export class SquarePaymentProvider implements PaymentProvider {
  private client: SquareClient;

  constructor() {
    const token = process.env.SQUARE_ACCESS_TOKEN;
    if (!token) {
      throw new Error("SQUARE_ACCESS_TOKEN is not set");
    }

    this.client = new SquareClient({
      token,
      environment:
        process.env.SQUARE_ENVIRONMENT === "production"
          ? SquareEnvironment.Production
          : SquareEnvironment.Sandbox,
    });
  }

  async processPayment(
    amount: number,
    nonce?: string
  ): Promise<PaymentResult> {
    if (!nonce) {
      return {
        success: false,
        paymentId: null,
        error: "Payment nonce is required for Square payments",
      };
    }

    const locationId = process.env.SQUARE_LOCATION_ID;
    if (!locationId) {
      return {
        success: false,
        paymentId: null,
        error: "Square location is not configured",
      };
    }

    // Convert dollars (float) to cents (integer) for Square API
    const amountCents = Math.round(amount * 100);

    try {
      const response = await this.client.payments.create({
        sourceId: nonce,
        idempotencyKey: randomUUID(),
        amountMoney: {
          amount: BigInt(amountCents),
          currency: "USD",
        },
        locationId,
      });

      const payment = response.payment;

      if (payment?.status === "COMPLETED") {
        return {
          success: true,
          paymentId: payment.id ?? null,
        };
      }

      return {
        success: false,
        paymentId: payment?.id ?? null,
        error: `Payment status: ${payment?.status ?? "unknown"}`,
      };
    } catch (err: unknown) {
      if (err instanceof SquareError) {
        const message =
          err.errors
            ?.map((e: { detail?: string }) => e.detail)
            .filter(Boolean)
            .join("; ") || "Square payment failed";
        console.error("Square API error:", err.errors);
        return {
          success: false,
          paymentId: null,
          error: message,
        };
      }

      console.error("Unexpected payment error:", err);
      return {
        success: false,
        paymentId: null,
        error: "An unexpected payment error occurred",
      };
    }
  }
}
