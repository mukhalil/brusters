import type { Category, MenuItem } from "@/types/menu";

export const TAX_RATE = 0.105; // La Cañada Flintridge, CA combined sales tax (10.5%)

export const categories: Category[] = [
  { id: "cones", name: "Cones" },
  { id: "cups", name: "Cups" },
  { id: "sundaes", name: "Sundaes" },
  { id: "shakes", name: "Shakes" },
  { id: "other", name: "Other Treats" },
];

export const menuItems: MenuItem[] = [
  // Cones
  {
    id: "vanilla-waffle-cone",
    categoryId: "cones",
    name: "Vanilla Waffle Cone",
    description: "Creamy vanilla ice cream in a fresh waffle cone",
    price: 4.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "chocolate-waffle-cone",
    categoryId: "cones",
    name: "Chocolate Waffle Cone",
    description: "Rich chocolate ice cream in a fresh waffle cone",
    price: 4.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "strawberry-waffle-cone",
    categoryId: "cones",
    name: "Strawberry Waffle Cone",
    description: "Sweet strawberry ice cream in a fresh waffle cone",
    price: 4.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "butter-pecan-cone",
    categoryId: "cones",
    name: "Butter Pecan Cone",
    description: "Buttery pecan ice cream with real pecan pieces",
    price: 4.99,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "mint-chip-cone",
    categoryId: "cones",
    name: "Mint Chocolate Chip Cone",
    description: "Cool mint ice cream with chocolate chips",
    price: 4.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "cookie-dough-cone",
    categoryId: "cones",
    name: "Cookie Dough Cone",
    description: "Vanilla ice cream loaded with cookie dough chunks",
    price: 4.99,
    image: "/ice-cream-placeholder.jpg",
  },

  // Cups
  {
    id: "vanilla-cup",
    categoryId: "cups",
    name: "Vanilla Cup",
    description: "Creamy vanilla in a cup with your choice of toppings",
    price: 3.99,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "chocolate-cup",
    categoryId: "cups",
    name: "Chocolate Cup",
    description: "Rich chocolate ice cream served in a cup",
    price: 3.99,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "twist-cup",
    categoryId: "cups",
    name: "Vanilla-Chocolate Twist Cup",
    description: "The best of both worlds in a cup",
    price: 3.99,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "sherbet-cup",
    categoryId: "cups",
    name: "Rainbow Sherbet Cup",
    description: "Colorful and refreshing rainbow sherbet",
    price: 3.99,
    image: "/ice-cream-placeholder.jpg",
  },

  // Sundaes
  {
    id: "hot-fudge-sundae",
    categoryId: "sundaes",
    name: "Hot Fudge Sundae",
    description: "Vanilla ice cream topped with hot fudge, whipped cream, and a cherry",
    price: 5.99,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "caramel-sundae",
    categoryId: "sundaes",
    name: "Caramel Sundae",
    description: "Vanilla ice cream with warm caramel sauce and whipped cream",
    price: 5.99,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "strawberry-sundae",
    categoryId: "sundaes",
    name: "Strawberry Sundae",
    description: "Vanilla ice cream with fresh strawberry topping",
    price: 5.99,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "banana-split",
    categoryId: "sundaes",
    name: "Banana Split",
    description: "Three scoops with banana, fudge, strawberry, pineapple, and whipped cream",
    price: 7.49,
    image: "/ice-cream-placeholder.jpg",
  },

  // Shakes
  {
    id: "vanilla-shake",
    categoryId: "shakes",
    name: "Vanilla Milkshake",
    description: "Thick and creamy classic vanilla milkshake",
    price: 5.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "chocolate-shake",
    categoryId: "shakes",
    name: "Chocolate Milkshake",
    description: "Rich and thick chocolate milkshake",
    price: 5.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "strawberry-shake",
    categoryId: "shakes",
    name: "Strawberry Milkshake",
    description: "Made with real strawberries",
    price: 5.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "oreo-shake",
    categoryId: "shakes",
    name: "Oreo Milkshake",
    description: "Vanilla shake blended with Oreo cookie pieces",
    price: 5.99,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "peanut-butter-shake",
    categoryId: "shakes",
    name: "Peanut Butter Milkshake",
    description: "Creamy peanut butter blended into a thick shake",
    price: 5.99,
    image: "/ice-cream-placeholder.jpg",
  },

  // Other Treats
  {
    id: "waffle-bowl",
    categoryId: "other",
    name: "Waffle Bowl Sundae",
    description: "Two scoops of your choice in a fresh waffle bowl",
    price: 6.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "ice-cream-sandwich",
    categoryId: "other",
    name: "Ice Cream Sandwich",
    description: "Vanilla ice cream between two fresh-baked cookies",
    price: 4.49,
    image: "/ice-cream-placeholder.jpg",
  },
  {
    id: "root-beer-float",
    categoryId: "other",
    name: "Root Beer Float",
    description: "Vanilla ice cream floating in ice-cold root beer",
    price: 4.99,
    image: "/ice-cream-placeholder.jpg",
  },
];

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find((item) => item.id === id);
}

export function getItemsByCategory(categoryId: string): MenuItem[] {
  return menuItems.filter((item) => item.categoryId === categoryId);
}
