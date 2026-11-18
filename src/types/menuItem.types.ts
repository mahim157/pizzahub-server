
export type MenuCategory =
  | "Classic Pizzas"
  | "Vegetarian Pizzas"
  | "Meat Lovers"
  | "Specialty / Gourmet Pizzas"
  | "Sides & Appetizers"
  | "Beverages & Desserts";

export type MenuItemStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "inactive";

export interface IMenuItem {
  _id?: string;
  vendorId: string;
  itemName: string;
  category: MenuCategory;
  description: string;
  price: number;
  location: {
    area: string;
    city: string;
  };
  images: string[];
  status: MenuItemStatus;
  createdAt: Date;
  updatedAt: Date;
}
