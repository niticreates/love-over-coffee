/**
 * Seed data — the ONLY place initial business data lives.
 *
 * Provenance rules (see docs/DATA-PROVENANCE.md):
 *  - Business name, address, phone: supplied by the client brief; address
 *    cross-checked with the Swiggy listing for the "Scheme 113" outlet.
 *  - Prices: NONE are public in a verifiable form. Every price is null until
 *    the owner enters it in Admin → Menu. Null-priced items cannot be ordered.
 *  - Veg indicators: null (unverified) for all items.
 *  - Descriptions: neutral, written by us, flagged owner_to_confirm.
 *  - Opening hours, seating capacity, delivery, tax rate: unknown → null/disabled.
 */
import type {
  Category,
  ExternalPlatform,
  Coupon,
  GalleryImage,
  Product,
  ProductCustomization,
  WebsiteSettings,
} from "@/lib/types";
import { MEDIA } from "../lib/media.ts";

export const categories: Category[] = [
  ["coffee", "Coffee"],
  ["hot-beverages", "Hot Beverages"],
  ["cold-coffee", "Cold Coffee"],
  ["frappes-shakes", "Frappes & Shakes"],
  ["mocktails-refreshers", "Mocktails & Refreshers"],
  ["starters", "Starters"],
  ["nachos-fries", "Nachos & Fries"],
  ["garlic-bread", "Garlic Bread"],
  ["sandwiches-wraps", "Sandwiches & Wraps"],
  ["pasta", "Pasta"],
  ["pizza", "Pizza"],
  ["main-course", "Main Course"],
  ["desserts", "Desserts"],
].map(([slug, name], i) => ({ id: `cat_${slug}`, slug, name, sort_order: i, is_active: true }));

type SeedRow = [slug: string, name: string, category: string, description: string, featured?: boolean, note?: string];

const rows: SeedRow[] = [
  ["lotus-biscoff-coffee", "Lotus Biscoff Coffee", "coffee", "Coffee with the caramelised warmth of Lotus Biscoff.", true, "Named as a must-try by Free Press Journal (Feb 2026)."],
  ["biscoff-cappuccino", "Biscoff Cappuccino", "coffee", "A cappuccino finished with Biscoff — creamy, spiced, comforting.", false, "Owner to confirm whether this is the same item as Lotus Biscoff Coffee."],
  ["cappuccino", "Cappuccino", "coffee", "Espresso with steamed milk and a soft layer of foam.", true],
  ["cold-coffee", "Cold Coffee", "cold-coffee", "Chilled, creamy and made for long afternoons.", false],
  ["cafe-frappe", "Cafe Frappe", "frappes-shakes", "Blended iced coffee, smooth and frothy.", true],
  ["dark-chocolate-frappe", "Dark Chocolate Frappe", "frappes-shakes", "Iced coffee blended with deep dark chocolate.", true],
  ["tiramisu-frappe", "Tiramisu Frappe", "frappes-shakes", "A frappe inspired by the classic Italian dessert.", false, "Named as a must-try by Free Press Journal (Feb 2026); not in the client's list — confirm."],
  ["kit-kat-shake", "Kit-Kat Shake", "frappes-shakes", "A thick shake blended with Kit-Kat.", false],
  ["mango-mojito", "Mango Mojito", "mocktails-refreshers", "Mango, mint and lime over ice.", false],
  ["lemon-mint-ice-tea", "Lemon Mint Ice Tea", "mocktails-refreshers", "Iced tea brightened with lemon and fresh mint.", false],
  ["pinky-lemonade", "Pinky Lemonade", "mocktails-refreshers", "A pink twist on chilled lemonade.", false],
  ["potato-cheese-shots", "Potato Cheese Shots", "starters", "Crisp potato bites with a molten cheese centre.", true],
  ["cheese-fondue", "Cheese Fondue", "starters", "Warm melted cheese for sharing, with dippers.", false],
  ["tex-mex-nachos", "Tex-Mex Nachos", "nachos-fries", "Tortilla chips loaded with Tex-Mex toppings.", true],
  ["nachos-fries", "Nachos Fries", "nachos-fries", "Fries dressed up nacho-style.", false],
  ["masala-pull-apart-garlic-bread", "Masala Pull-A-Part Garlic Bread", "garlic-bread", "Pull-apart garlic bread with an Indian masala twist.", true],
  ["otc-garlic-bread", "OTC Garlic Bread", "garlic-bread", "Garlic bread from the house selection.", false, "Owner to confirm what “OTC” stands for and the description."],
  ["penne-arrabiata-red", "Penne Arrabiata Red", "pasta", "Penne in a spicy red tomato sauce.", true, "Featured list calls it “Penne Arrabiata”."],
  ["penne-mix-sauce-pasta", "Penne Mix Sauce Pasta", "pasta", "Penne in a blend of red and white sauces.", false],
  ["cheese-maggi", "Cheese Maggi", "main-course", "The comfort classic, finished with cheese.", false, "Category guessed — confirm."],
  ["oreo-brownie-sundae", "Oreo Brownie Sundae", "desserts", "Brownie, ice cream and Oreo, layered into a sundae.", true],
  ["tiramisu", "Tiramisu", "desserts", "Coffee-soaked layers and mascarpone cream.", false],
];

/**
 * The café's own photographs matched to a dish by appearance (Nov 2026 upload).
 * Owner to confirm each match; anything unmatched shows its category photo or a placeholder.
 */
const PRODUCT_PHOTOS: Record<string, { src: string; alt: string }> = {
  cappuccino: { src: MEDIA.latteArt.src, alt: MEDIA.latteArt.alt },
  "cold-coffee": { src: MEDIA.coldCoffees.src, alt: MEDIA.coldCoffees.alt },
  "tex-mex-nachos": { src: MEDIA.nachos.src, alt: MEDIA.nachos.alt },
  "masala-pull-apart-garlic-bread": { src: MEDIA.pullApart.src, alt: MEDIA.pullApart.alt },
};

export const products: Product[] = rows.map(([slug, name, cat, description, featured, note], i) => ({
  id: `prd_${slug}`,
  slug,
  category_id: `cat_${cat}`,
  name,
  description,
  price: null,
  is_veg: null,
  is_available: true,
  is_featured: Boolean(featured),
  image_url: PRODUCT_PHOTOS[slug]?.src ?? null,
  image_alt: PRODUCT_PHOTOS[slug]?.alt ?? null,
  sort_order: i,
  customizations: [],
  verification: "owner_to_confirm",
  source_note: note,
}));

/** Display order for the homepage "Signature favourites", per the brief. */
export const featuredOrder = [
  "cappuccino",
  "cafe-frappe",
  "lotus-biscoff-coffee",
  "dark-chocolate-frappe",
  "tex-mex-nachos",
  "potato-cheese-shots",
  "penne-arrabiata-red",
  "masala-pull-apart-garlic-bread",
  "oreo-brownie-sundae",
];

/**
 * PREVIEW-ONLY sample prices (paise). Used solely when DEMO_SAMPLE_DATA=true so the
 * ordering journey can be exercised before the owner enters real prices. Every
 * surface that shows them is labelled "Sample price". Never seeded into Supabase.
 */
export const demoSamplePrices: Record<string, number> = Object.fromEntries(
  rows.map(([slug], i) => [slug, (150 + ((i * 37) % 200)) * 100]),
);

export const demoCustomizations: ProductCustomization[] = [
  {
    id: "cz_sweetness",
    name: "Sweetness",
    required: false,
    max_select: 1,
    options: [
      { id: "opt_regular", label: "Regular", price_delta: 0 },
      { id: "opt_less", label: "Less sweet", price_delta: 0 },
    ],
  },
];

export const coupons: Coupon[] = [];

export const galleryImages: GalleryImage[] = (
  [
    ["interiors", MEDIA.diningRoom, "The dining room under the navy ceiling"],
    ["beverages", MEDIA.latteArt, "Latte art, served in blue"],
    ["food", MEDIA.nachos, "Loaded nachos"],
    ["interiors", MEDIA.counterBooks, "The counter and the book wall"],
    ["experiences", MEDIA.storefrontCup, "A cup to go, outside the café"],
    ["food", MEDIA.garlicBread, "Garlic bread and a grilled sandwich"],
    ["beverages", MEDIA.coldCoffees, "Cold coffees"],
    ["experiences", MEDIA.storefront, "The storefront, dressed in balloons"],
    ["food", MEDIA.pullApart, "Pull-apart bread among the plants"],
    ["beverages", MEDIA.layered, "A layered iced coffee"],
    ["experiences", MEDIA.spread, "A table for sharing, outdoors"],
    ["food", MEDIA.pizza, "Vegetable pizza"],
    ["interiors", MEDIA.counterParty, "Steps up to the party hall"],
    ["food", MEDIA.wrap, "A wrap with dips"],
    ["experiences", MEDIA.shakesFries, "Shakes, coffee and fries"],
  ] as const
).map(([category, media, caption], i) => ({
  id: `gal_${i + 1}`,
  category,
  url: media.src,
  alt: media.alt,
  caption,
  sort_order: i,
  width: media.width,
  height: media.height,
}));

export const defaultSettings: WebsiteSettings = {
  business: {
    name: "Love Over Coffee — Vijay Nagar",
    short_name: "Love Over Coffee",
    address_lines: ["Plot No. 11, Scheme No. 51, Scheme No. 113", "Vijay Nagar"],
    locality: "Vijay Nagar",
    city: "Indore",
    region: "Madhya Pradesh",
    postal_code: "452010",
    country: "IN",
    phone_display: "+91 93296 97769",
    phone_e164: "+919329697769",
    whatsapp_e164: "+919329697769", // supplied by the client for WhatsApp (27 Nov 2026)
    whatsapp_messages: {
      general: "Hello Love Over Coffee! I'd like to know more about your menu and services.",
      reservation: "Hello Love Over Coffee! I'd like to enquire about reserving a table.",
      ordering: "Hello Love Over Coffee! I'd like to enquire about placing an order.",
      group: "Hello Love Over Coffee! I'd like to enquire about visiting with a group.",
    },
    email: null,
    instagram_url: null, // no verified official handle found
    maps_query: "Love Over Coffee, Plot No. 11, Scheme No. 113, Vijay Nagar, Indore 452010",
    maps_place_url:
      "https://www.google.com/maps/search/?api=1&query=Love+Over+Coffee+Scheme+113+Vijay+Nagar+Indore",
    geo: null, // set the exact pin from the Google Business Profile
    price_range: "₹200–₹400 per person",
    hours: null,
    hours_verification: "owner_to_confirm",
    rating_note: "Rated 4.7 on Google by around 1,000 guests", // owner to confirm before showing
    fssai: null,
  },
  commerce: {
    ordering_enabled: false, // turns on once real prices + tax are set
    delivery_enabled: false, // pickup only until the café confirms website delivery
    tax_bps: null,
    tax_inclusive: false,
    delivery_fee: 0,
    free_delivery_above: null,
    min_order_value: 0,
    currency: "INR",
  },
  reservations: {
    enabled: true,
    slot_minutes: 30,
    seating_minutes: 90,
    max_guests_per_booking: 10,
    max_covers_per_slot: null,
    min_lead_minutes: 60,
    max_days_ahead: 30,
    last_booking_before_close_minutes: 60,
  },
  content: {
    hero_headline: "Good Coffee. Great Company. A Little More Love.",
    hero_image_url: null,
    hero_subhead:
      "Your favourite corner for coffee, conversations, comfort food and unforgettable little moments.",
    intro_headline: "More Than Just Coffee.",
    intro_body:
      "Love Over Coffee is where the day slows down. Come for a carefully made cup, stay for comforting plates, a board game, and the kind of conversation that runs longer than planned.",
    reservation_headline: "Your Table Is Waiting.",
    reservation_body:
      "Planning a coffee date, catching up with friends, or simply taking a break? Reserve your favourite spot.",
    announcement: null,
    story_sections: [
      { id: "experience", title: "The Love Over Coffee experience", body: "A warm room, an easy pace, and a cup that is worth sitting with. We built this corner of Vijay Nagar for the moments in between — the catch-ups, the first dates, the long afternoons with a laptop.", needs_owner_review: true },
      { id: "coffee", title: "Our approach to coffee", body: "From the everyday cappuccino to the indulgent Biscoff and dark-chocolate frappes, the menu is built around coffee that rewards slowing down.", needs_owner_review: true },
      { id: "food", title: "Food and flavours", body: "Comfort food with Italian and Mexican accents — loaded nachos, pull-apart garlic bread, penne in rich sauces, and desserts made for sharing.", needs_owner_review: true },
      { id: "ambience", title: "Our ambience", body: "A deep navy ceiling, blush velvet chairs, green sofas and a wall of books. A space designed to feel like a favourite room rather than a waiting room.", needs_owner_review: true },
      { id: "conversations", title: "A place for conversations", body: "Board games on the shelf, books within reach, and tables made for lingering. Bring your people.", needs_owner_review: true },
    ],
  },
  notifications: { admin_emails: [], admin_whatsapp: [], email_enabled: false, whatsapp_enabled: false },
};

/**
 * Third-party listings for THIS outlet (Plot 11, Sector/Scheme 113, Vijay Nagar).
 * Each was opened on 27 Nov 2026 and matched on address and/or phone (+91 93296 97769).
 * Love Over Coffee has other outlets (Jaipur, Gurugram, Bikaner…) — never link those.
 */
const verifiedAt = "2026-11-27T00:00:00.000Z";
export const externalPlatforms: ExternalPlatform[] = [
  {
    id: "plt_district", platform_name: "District by Zomato", platform_type: "reservation", brand: "district",
    platform_url: "https://www.district.in/dining/indore/love-over-coffee-vijay-nagar", platform_logo: null,
    description: "Pick a date and party size and book instantly — with dining offers when available.",
    is_active: true, is_verified: true, display_order: 0,
    verification_note: "Page shows Plot 11, Sector 113, Vijay Nagar and phone +919329697769.",
    created_at: verifiedAt, updated_at: verifiedAt,
  },
  {
    id: "plt_zomato", platform_name: "Zomato", platform_type: "ordering", brand: "zomato",
    platform_url: "https://www.zomato.com/indore/love-over-coffee-vijay-nagar/order", platform_logo: null,
    description: "Order for delivery or browse the full menu, photos and reviews.",
    is_active: true, is_verified: true, display_order: 1,
    verification_note: "Listing shows Plot 11, Sector 113, Vijay Nagar and phone +919329697769.",
    created_at: verifiedAt, updated_at: verifiedAt,
  },
  {
    id: "plt_swiggy", platform_name: "Swiggy", platform_type: "ordering", brand: "swiggy",
    platform_url: "https://www.swiggy.com/city/indore/love-over-coffee-vijay-nagar-scheme-113-rest764666", platform_logo: null,
    description: "Get your favourites delivered across Indore.",
    is_active: true, is_verified: true, display_order: 2,
    verification_note: "Listing 'Scheme 113' shows Plot No 11, Sector 113, Vijay Nagar, 452010.",
    created_at: verifiedAt, updated_at: verifiedAt,
  },
  {
    id: "plt_google_maps", platform_name: "Google Maps", platform_type: "location", brand: "google_maps",
    platform_url: "https://www.google.com/maps/search/?api=1&query=Love+Over+Coffee+Scheme+113+Vijay+Nagar+Indore", platform_logo: null,
    description: "Directions, opening hours and reviews.",
    is_active: true, is_verified: true, display_order: 3,
    verification_note: "Search link. Replace with the Business Profile share link (maps.app.goo.gl/…) to pin this exact outlet.",
    created_at: verifiedAt, updated_at: verifiedAt,
  },
];
