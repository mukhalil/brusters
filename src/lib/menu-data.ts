import type { Category, MenuItem, Flavor, Extra } from "@/types/menu";

export const TAX_RATE = 0.105; // La Cañada Flintridge, CA combined sales tax (10.5%)
export const EXTRA_PRICE = 1.29;

export const categories: Category[] = [
  { id: "cups", name: "Cups / Dishes" },
  { id: "waffle-bowls", name: "Waffle Bowls" },
  { id: "shakes", name: "Shakes" },
  { id: "blasts", name: "Blasts" },
  { id: "sundaes", name: "Sundaes" },
  { id: "kids", name: "Kids" },
  { id: "freezes", name: "Freezes" },
  { id: "take-home", name: "Take Home" },
  { id: "cakes-pies", name: "Cakes & Pies" },
  { id: "sandwiches", name: "Oreo Sandwiches" },
  { id: "specials", name: "Specials" },
  { id: "seasonal", name: "Seasonal" },
];

export const menuItems: MenuItem[] = [
  // Cups / Dishes
  {
    id: "small-cup",
    categoryId: "cups",
    name: "Small Cup",
    description: "2 scoops of your favorite flavors in a cup",
    price: 6.29,
    scoops: 2,
    allowFlavors: true,
    allowExtras: true,
  },
  {
    id: "medium-cup",
    categoryId: "cups",
    name: "Medium Cup",
    description: "3 scoops of your favorite flavors in a cup",
    price: 7.29,
    scoops: 3,
    allowFlavors: true,
    allowExtras: true,
  },
  {
    id: "large-cup",
    categoryId: "cups",
    name: "Large Cup",
    description: "4 scoops of your favorite flavors in a cup",
    price: 8.29,
    scoops: 4,
    allowFlavors: true,
    allowExtras: true,
  },

  // Waffle Bowls
  {
    id: "small-waffle-bowl",
    categoryId: "waffle-bowls",
    name: "Small Waffle Bowl",
    description: "2 scoops in a fresh waffle bowl",
    price: 7.29,
    scoops: 2,
    allowFlavors: true,
    allowExtras: true,
  },
  {
    id: "medium-waffle-bowl",
    categoryId: "waffle-bowls",
    name: "Medium Waffle Bowl",
    description: "3 scoops in a fresh waffle bowl",
    price: 8.29,
    scoops: 3,
    allowFlavors: true,
    allowExtras: true,
  },
  {
    id: "large-waffle-bowl",
    categoryId: "waffle-bowls",
    name: "Large Waffle Bowl",
    description: "4 scoops in a fresh waffle bowl",
    price: 9.29,
    scoops: 4,
    allowFlavors: true,
    allowExtras: true,
  },

  // Shakes
  {
    id: "small-milkshake",
    categoryId: "shakes",
    name: "Small Milkshake",
    description: "Hand-spun milkshake with your choice of flavor",
    price: 7.99,
    scoops: 1,
    allowFlavors: true,
    allowExtras: true,
  },
  {
    id: "medium-milkshake",
    categoryId: "shakes",
    name: "Medium Milkshake",
    description: "Hand-spun milkshake with your choice of flavors",
    price: 8.99,
    scoops: 2,
    allowFlavors: true,
    allowExtras: true,
  },
  {
    id: "large-milkshake",
    categoryId: "shakes",
    name: "Large Milkshake",
    description: "Hand-spun milkshake with your choice of flavors",
    price: 9.79,
    scoops: 3,
    allowFlavors: true,
    allowExtras: true,
  },

  // Blasts
  {
    id: "small-blast",
    categoryId: "blasts",
    name: "Small Bruster's Blast",
    description: "Ice cream blended with your favorite mix-ins",
    price: 7.99,
  },
  {
    id: "medium-blast",
    categoryId: "blasts",
    name: "Medium Bruster's Blast",
    description: "Ice cream blended with your favorite mix-ins",
    price: 8.99,
  },

  // Sundaes
  {
    id: "hot-fudge-brownie",
    categoryId: "sundaes",
    name: "Hot Fudge Brownie",
    description: "Ice cream topped with hot fudge and brownie pieces",
    price: 9.99,
  },
  {
    id: "banana-split",
    categoryId: "sundaes",
    name: "Banana Split",
    description: "Three scoops with banana, fudge, strawberry, pineapple, and whipped cream",
    price: 9.99,
  },
  {
    id: "strawberry-shortcake",
    categoryId: "sundaes",
    name: "Strawberry Shortcake",
    description: "Ice cream with fresh strawberry topping and shortcake",
    price: 9.99,
  },
  {
    id: "turtle-sundae",
    categoryId: "sundaes",
    name: "Turtle Sundae",
    description: "Ice cream with caramel, hot fudge, and pecans",
    price: 8.99,
  },
  {
    id: "pb-cup-sundae",
    categoryId: "sundaes",
    name: "Peanut Butter Cup Sundae",
    description: "Ice cream with peanut butter cups and chocolate sauce",
    price: 8.99,
  },
  {
    id: "build-your-own-sundae",
    categoryId: "sundaes",
    name: "Build Your Own Sundae",
    description: "Create your perfect sundae with your choice of flavors and extras",
    price: 7.99,
    scoops: 2,
    allowFlavors: true,
    allowExtras: true,
  },

  // Kids
  {
    id: "kids-cup",
    categoryId: "kids",
    name: "Kids Cup",
    description: "A kid-sized cup of ice cream",
    price: 4.99,
    scoops: 1,
    allowFlavors: true,
    allowExtras: true,
  },
  {
    id: "dino-sundae",
    categoryId: "kids",
    name: "Dino Sundae",
    description: "A fun dinosaur-themed sundae for kids",
    price: 6.29,
    scoops: 1,
    allowFlavors: true,
    allowExtras: false,
  },
  {
    id: "dirt-sundae",
    categoryId: "kids",
    name: "Dirt Sundae",
    description: "Chocolate ice cream with cookie crumbles and gummy worms",
    price: 5.99,
    scoops: 1,
    allowFlavors: true,
    allowExtras: false,
  },
  {
    id: "kids-waffle-bowl",
    categoryId: "kids",
    name: "Kids Waffle Bowl",
    description: "A kid-sized waffle bowl with ice cream",
    price: 5.79,
    scoops: 1,
    allowFlavors: true,
    allowExtras: true,
  },

  // Freezes
  {
    id: "freeze",
    categoryId: "freezes",
    name: "Freeze",
    description: "A refreshing frozen drink blended with ice cream",
    price: 7.79,
    scoops: 1,
    allowFlavors: true,
    flavorSet: ["blue-pop-ice", "cherry-ice", "lime-ice", "orange-sherbet", "watermelon-ice"],
    allowExtras: false,
  },

  // Take Home
  {
    id: "pint",
    categoryId: "take-home",
    name: "Pint",
    description: "Take home a pint of your favorite flavor",
    price: 8.79,
    scoops: 1,
    allowFlavors: true,
    allowExtras: false,
  },
  {
    id: "quart",
    categoryId: "take-home",
    name: "Quart",
    description: "Take home a quart of your favorite flavor",
    price: 12.79,
    scoops: 1,
    allowFlavors: true,
    allowExtras: false,
  },

  // Cakes & Pies
  {
    id: "ice-cream-cake",
    categoryId: "cakes-pies",
    name: "Ready Made Ice Cream Cake",
    description: "A delicious ready-made ice cream cake",
    price: 45.99,
  },
  {
    id: "ice-cream-pie",
    categoryId: "cakes-pies",
    name: "Ready Made Ice Cream Pie",
    description: "A delicious ready-made ice cream pie",
    price: 32.99,
  },

  // Oreo Sandwiches
  {
    id: "oreo-sandwich-6pack",
    categoryId: "sandwiches",
    name: "6 Pack Ice Cream Sandwich",
    description: "Six ice cream sandwiches made with OREO cookies",
    price: 21.99,
  },

  // Specials
  {
    id: "2-pint-special",
    categoryId: "specials",
    name: "2 Pint Special",
    description: "Two pints of your favorite flavors at a special price",
    price: 14.99,
    scoops: 2,
    allowFlavors: true,
    allowExtras: false,
  },
  {
    id: "2-quart-special",
    categoryId: "specials",
    name: "2 Quart Special",
    description: "Two quarts of your favorite flavors at a special price",
    price: 21.99,
    scoops: 2,
    allowFlavors: true,
    allowExtras: false,
  },
  {
    id: "2-half-gallon-special",
    categoryId: "specials",
    name: "2 Half Gallon Special",
    description: "Two half gallons of your favorite flavors at a special price",
    price: 39.99,
    scoops: 2,
    allowFlavors: true,
    allowExtras: false,
  },

  // Seasonal
  {
    id: "apple-dumpling",
    categoryId: "seasonal",
    name: "Apple Dumpling",
    description: "Warm apple dumpling topped with ice cream",
    price: 10.99,
    scoops: 1,
    allowFlavors: true,
    allowExtras: false,
  },
];

export const flavors: Flavor[] = [
  { id: "vanilla", name: "Vanilla" },
  { id: "strawberry", name: "Strawberry" },
  { id: "banana-pb-ripple", name: "Banana Peanut Butter Ripple" },
  { id: "birthday-cake", name: "Birthday Cake" },
  { id: "blue-pop-ice", name: "Blue Pop Ice" },
  { id: "butter-brickle", name: "Butter Brickle" },
  { id: "cherry-ice", name: "Cherry Ice" },
  { id: "chocolate-chip", name: "Chocolate Chip" },
  { id: "chocolate-chip-cookie-dough", name: "Chocolate Chip Cookie Dough" },
  { id: "coffee", name: "Coffee" },
  { id: "cold-brew-brownie", name: "Cold Brew Brownie" },
  { id: "cookies-cream-oreo", name: "Cookies & Cream Made With OREO" },
  { id: "cotton-candy-explosion", name: "Cotton Candy Explosion" },
  { id: "death-by-chocolate", name: "Death by Chocolate" },
  { id: "fudge-ripple-nsa-ff", name: "Fudge Ripple NSA/FF" },
  { id: "graham-central-station", name: "Graham Central Station" },
  { id: "lime-ice", name: "Lime Ice" },
  { id: "mint-chocolate-chip", name: "Mint Chocolate Chip" },
  { id: "mocha-almond-fudge", name: "Mocha Almond Fudge" },
  { id: "non-dairy-mango", name: "Non-Dairy Mango" },
  { id: "non-dairy-triple-choc-oreo", name: "Non-Dairy Triple Chocolate Made With OREO" },
  { id: "orange-sherbet", name: "Orange Sherbet" },
  { id: "rocky-road", name: "Rocky Road" },
  { id: "sea-salt-caramel", name: "Sea Salt Caramel" },
  { id: "southern-banana-puddin", name: "Southern Banana Puddin" },
  { id: "strawberry-matcha", name: "Strawberry Matcha" },
  { id: "ube", name: "Ube" },
  { id: "watermelon-ice", name: "Watermelon Ice" },
];

export const extras: Extra[] = [
  { id: "cookie-dough", name: "Cookie Dough", price: EXTRA_PRICE },
  { id: "brownie-bites", name: "Brownie Bites", price: EXTRA_PRICE },
  { id: "sprinkles", name: "Sprinkles", price: EXTRA_PRICE },
  { id: "pecan-nuts", name: "Pecan Nuts", price: EXTRA_PRICE },
  { id: "chopped-nuts", name: "Chopped Nuts", price: EXTRA_PRICE },
  { id: "mms", name: "M&M's", price: EXTRA_PRICE },
  { id: "oreos", name: "Oreo's", price: EXTRA_PRICE },
  { id: "twix", name: "Twix", price: EXTRA_PRICE },
  { id: "reeses-pieces", name: "Reeses Pieces", price: EXTRA_PRICE },
  { id: "butterfinger", name: "Butterfinger", price: EXTRA_PRICE },
  { id: "snickers", name: "Snickers", price: EXTRA_PRICE },
  { id: "nestles-crunch", name: "Nestles Crunch", price: EXTRA_PRICE },
  { id: "heath-bar", name: "Heath Bar", price: EXTRA_PRICE },
  { id: "reeses-pb-cups", name: "Reeses PB Cups", price: EXTRA_PRICE },
  { id: "hot-fudge", name: "Hot Fudge", price: EXTRA_PRICE },
  { id: "peanut-butter-sauce", name: "Peanut Butter Sauce", price: EXTRA_PRICE },
  { id: "strawberry-sauce", name: "Strawberry", price: EXTRA_PRICE },
  { id: "chocolate-syrup", name: "Chocolate Syrup", price: EXTRA_PRICE },
  { id: "caramel", name: "Caramel", price: EXTRA_PRICE },
  { id: "marshmallow", name: "Marshmallow", price: EXTRA_PRICE },
  { id: "butterscotch", name: "Butterscotch", price: EXTRA_PRICE },
  { id: "pineapple", name: "Pineapple", price: EXTRA_PRICE },
  { id: "whipped-cream", name: "Whipped Cream", price: EXTRA_PRICE },
  { id: "xtra-cherry", name: "Xtra Cherry", price: EXTRA_PRICE },
];

export function getMenuItemById(id: string): MenuItem | undefined {
  return menuItems.find((item) => item.id === id);
}

export function getItemsByCategory(categoryId: string): MenuItem[] {
  return menuItems.filter((item) => item.categoryId === categoryId);
}

export function getFlavorById(id: string): Flavor | undefined {
  return flavors.find((f) => f.id === id);
}

export function getFlavorByName(name: string): Flavor | undefined {
  return flavors.find((f) => f.name === name);
}

export function getExtraByName(name: string): Extra | undefined {
  return extras.find((e) => e.name === name);
}
