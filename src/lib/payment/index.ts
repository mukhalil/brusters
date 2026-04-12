import type { PaymentProvider } from "./types";
import { MockPaymentProvider } from "./mock-provider";
import { SquarePaymentProvider } from "./square-provider";

export function getPaymentProvider(): PaymentProvider {
  if (process.env.PAYMENT_PROVIDER === "square") {
    return new SquarePaymentProvider();
  }
  return new MockPaymentProvider();
}

export type { PaymentResult, PaymentProvider } from "./types";
