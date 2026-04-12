export type OrderStatus =
  | "received"
  | "preparing"
  | "ready"
  | "delivering"
  | "completed"
  | "cancelled";

export const ORDER_STATUS_FLOW: OrderStatus[] = [
  "received",
  "preparing",
  "ready",
  "delivering",
  "completed",
];

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  received: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["delivering", "cancelled"],
  delivering: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

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

export const NEXT_STATUS_ACTION: Partial<Record<OrderStatus, string>> = {
  received: "Start Preparing",
  preparing: "Mark Ready",
  ready: "Out for Delivery",
  delivering: "Complete",
};

export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerName: string;
  locationType: "gps" | "car";
  latitude?: number | null;
  longitude?: number | null;
  carDescription?: string | null;
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
