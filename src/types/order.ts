export type OrderStatus =
  | "received"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export type LocationType = "gps" | "car" | "counter";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "delivering",
  "completed",
];

export const COUNTER_STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "completed",
];

export function getStatusFlow(locationType: string): OrderStatus[] {
  return locationType === "counter" ? COUNTER_STATUS_FLOW : ORDER_STATUS_FLOW;
}

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivering", "cancelled"],
  delivering: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const COUNTER_VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  delivering: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

export function getValidTransitions(locationType: string): Record<OrderStatus, OrderStatus[]> {
  return locationType === "counter" ? COUNTER_VALID_TRANSITIONS : VALID_TRANSITIONS;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  received: "Received",
  preparing: "Preparing",
  ready: "Ready",
  delivering: "On the Way",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_MESSAGES: Record<OrderStatus, string> = {
  received: "We've received your order!",
  preparing: "Your order is being prepared",
  ready: "Your order is ready! A server is on the way",
  delivering: "Your server is bringing your order now",
  completed: "Enjoy your ice cream!",
  cancelled: "This order has been cancelled",
};

const COUNTER_STATUS_MESSAGES: Record<OrderStatus, string> = {
  received: "We've received your order!",
  preparing: "Your order is being prepared",
  ready: "Your order is ready! Head to the counter to pick it up",
  delivering: "Your order is ready for pickup",
  completed: "Enjoy your ice cream!",
  cancelled: "This order has been cancelled",
};

export function getStatusMessages(locationType: string): Record<OrderStatus, string> {
  return locationType === "counter" ? COUNTER_STATUS_MESSAGES : STATUS_MESSAGES;
}

export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  received: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Out for Delivery",
  delivering: "Complete",
};

const COUNTER_NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  received: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Complete",
};

export function getNextStatusAction(locationType: string): Partial<Record<OrderStatus, string>> {
  return locationType === "counter" ? COUNTER_NEXT_STATUS_ACTION : NEXT_STATUS_ACTION;
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  flavors?: string[];
  extras?: string[];
  extrasPrice?: number;
}

export interface Order {
  id: string;
  customerName: string;
  locationType: LocationType;
  latitude?: number | null;
  longitude?: number | null;
  carDescription?: string | null;
  phoneNumber?: string | null;
  additionalNotes?: string | null;
  items: OrderItem[];
  subtotal: string;
  tax: string;
  total: string;
  status: OrderStatus;
  paymentMethod: string;
  paymentId?: string | null;
  createdAt: string;
  updatedAt: string;
}
