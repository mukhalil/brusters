export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  scoops?: number; // max flavors customer can pick (e.g., 2 for small cup)
  allowFlavors?: boolean; // true → navigates to customize page
  allowExtras?: boolean; // true → extras section on customize page
  flavorSet?: string[]; // restrict to specific flavor IDs (omit = all flavors)
}

export interface Flavor {
  id: string;
  name: string;
}

export interface Extra {
  id: string;
  name: string;
  price: number;
}
