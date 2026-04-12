import type { PaymentProvider, PaymentResult } from "./types";

export class SquarePaymentProvider implements PaymentProvider {
  async processPayment(amount: number, nonce?: string): Promise<PaymentResult> {
    // TODO: Implement with Square Payments API
    // 1. Receive payment nonce from Square Web Payments SDK on client
    // 2. Call Square CreatePayment API with nonce + amount
    // 3. Return result
    throw new Error("Square payments not yet implemented");
  }
}
