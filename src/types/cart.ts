export interface CartItem {
  menuItemId: string;
  name: string;
  price: number; // base price
  quantity: number;
  flavors?: string[]; // selected flavor names
  extras?: string[]; // selected extra names
  extrasPrice?: number; // total extras cost (count × EXTRA_PRICE)
}
