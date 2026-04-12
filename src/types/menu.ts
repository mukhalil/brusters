export interface Category {
  id: string;
  name: string;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  description: string;
  price: number; // in dollars, e.g. 4.49
  image?: string; // path relative to /public, e.g. "/ice-cream-placeholder.jpg"
}
