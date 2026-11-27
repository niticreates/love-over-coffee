// Registry of the café's own photographs (supplied by the client, Nov 2026).
// Paths live under /public/images. Width/height are the source pixel sizes so layouts
// can reserve space without layout shift. `position` is the CSS object-position that keeps
// the subject (food, signage, faces) inside the crop.
export interface Media {
  src: string;
  width: number;
  height: number;
  alt: string;
  position?: string;
}

const m = (src: string, width: number, height: number, alt: string, position = "50% 50%"): Media => ({ src: `/images/${src}`, width, height, alt, position });

export const MEDIA = {
  storefront: m("exterior/storefront-signage.webp", 765, 1020, "The Love Over Coffee storefront in Vijay Nagar, with the turquoise cup mascot on the signage", "50% 35%"),
  storefrontCup: m("exterior/storefront-cup-in-hand.webp", 384, 512, "A Love Over Coffee takeaway cup held up in front of the café's outdoor seating", "50% 55%"),
  diningRoom: m("interior/dining-room.webp", 384, 512, "The dining room: navy ceiling, green sofas and blush velvet chairs", "50% 60%"),
  counterParty: m("interior/counter-party-hall.webp", 574, 1020, "The coffee counter and the steps up to the party hall", "50% 50%"),
  counterBooks: m("interior/counter-bookshelf.webp", 768, 1020, "The counter under the navy ceiling, beside a wall of books", "50% 45%"),
  latteArt: m("coffee/latte-art.webp", 410, 512, "Latte art in a blue cup with a biscuit on the saucer", "50% 45%"),
  coldCoffees: m("coffee/cold-coffees.webp", 765, 1020, "Two cold coffees, one with a chocolate drizzle", "50% 40%"),
  layered: m("coffee/layered-coffee.webp", 900, 600, "A layered iced coffee on a cork coaster with coffee beans", "40% 55%"),
  garlicBread: m("food/garlic-bread-platter.webp", 1360, 1020, "Garlic bread and a grilled sandwich on green platters", "55% 45%"),
  shakesFries: m("food/shakes-and-fries.webp", 1360, 1020, "Shakes, a cappuccino and fries at a café table", "50% 55%"),
  spread: m("food/outdoor-spread.webp", 512, 512, "A spread of pizza, shakes, coffee and starters on an outdoor table", "50% 50%"),
  pizza: m("food/pizza.webp", 800, 600, "A vegetable pizza on a wooden board", "50% 50%"),
  pullApart: m("food/pull-apart-bread.webp", 765, 1020, "Pull-apart cheesy bread held up among the plants", "50% 50%"),
  nachos: m("food/nachos.webp", 801, 600, "Loaded nachos with salsa, cheese and dips", "50% 55%"),
  wrap: m("food/wrap.webp", 801, 600, "A wrap with salsa and dips", "50% 55%"),
} satisfies Record<string, Media>;

export type MediaKey = keyof typeof MEDIA;

/** Photograph for each menu category (a category-level image, not a claim about a specific dish). */
export const CATEGORY_MEDIA: Partial<Record<string, Media>> = {
  cat_coffee: MEDIA.latteArt,
  "cat_hot-beverages": MEDIA.latteArt,
  "cat_cold-coffee": MEDIA.coldCoffees,
  "cat_frappes-shakes": MEDIA.layered,
  cat_starters: MEDIA.spread,
  "cat_nachos-fries": MEDIA.nachos,
  "cat_garlic-bread": MEDIA.garlicBread,
  "cat_sandwiches-wraps": MEDIA.wrap,
  cat_pizza: MEDIA.pizza,
};
