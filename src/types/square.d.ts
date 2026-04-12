import type { Payments } from "@square/web-payments-sdk-types";

declare global {
  interface Window {
    Square?: {
      payments: (
        applicationId: string,
        locationId: string
      ) => Promise<Payments>;
    };
  }
}

export {};
