import type { Tone } from "@/components/ui/Photo";
export function toneForCategory(categoryId: string): Tone {
  if (/coffee|beverage|frappe|mocktail/.test(categoryId)) return "beverages";
  if (/dessert/.test(categoryId)) return "desserts";
  return "food";
}
