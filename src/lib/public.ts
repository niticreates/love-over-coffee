import type { PublicProduct } from "@/components/menu/AddToCart";
import type { Product } from "./types";

/** Strip internal fields before sending products to client components. */
export const toPublic = (p: Product): PublicProduct => ({
  id: p.id, slug: p.slug, name: p.name, description: p.description, price: p.price, is_available: p.is_available,
  customizations: p.customizations, image_url: p.image_url, is_veg: p.is_veg, category_id: p.category_id,
});
