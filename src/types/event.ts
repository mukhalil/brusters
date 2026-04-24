export type EventStatus = "draft" | "active" | "paused" | "closed";
export type EventPaymentMode = "prepaid" | "individual";

export interface EventBranding {
  brandName: string | null;
  brandLogoUrl: string | null;
  brandPrimaryColor: string | null;
  brandAccentColor: string | null;
  welcomeMessage: string | null;
}

export interface Event extends EventBranding {
  id: string;
  slug: string;
  name: string;
  customerContactName: string | null;
  customerContactPhone: string | null;
  eventDate: string | null;
  startsAt: string | null;
  endsAt: string | null;
  paymentMode: EventPaymentMode;
  maxOrdersPerGuest: number | null;
  allowedCategoryIds: string[] | null;
  allowedItemIds: string[] | null;
  allowedFlavorIds: string[] | null;
  allowedExtraIds: string[] | null;
  status: EventStatus;
  pickupInstructions: string | null;
  contactPin: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary {
  event: Event;
  ordersPlaced: number;
  ordersReady: number;
  ordersCompleted: number;
  revenue: number;
}
