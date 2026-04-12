import type { PaymentProvider, PaymentResult } from "./types";

export class MockPaymentProvider implements PaymentProvider {
  async processPayment(amount: number): Promise<PaymentResult> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return {
      success: true,
      paymentId: `mock_${Date.now()}`,
    };
  }
}
