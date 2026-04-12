export interface PaymentResult {
  success: boolean;
  paymentId: string | null;
  error?: string;
}

export interface PaymentProvider {
  processPayment(amount: number, nonce?: string): Promise<PaymentResult>;
}
