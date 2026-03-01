// ─── Firestore Domain Types ────────────────────────────────────────────────────

export type ProductTag = "new" | "sale" | "clearance";

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;       // stored in cents (e.g. 1200 = $12.00)
  images: string[];    // Firebase Storage CDN URLs
  stock: number;
  category: string;    // category slug
  active: boolean;
  tags: ProductTag[];  // e.g. ["new"], ["sale"], ["clearance"]
  comingSoon: boolean;
  availableAt: string | null; // ISO datetime when product goes live; null = indefinitely coming soon
  createdAt: string;   // ISO 8601
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  productId: string;
  productName: string;
  productSlug: string;
  quantity: number;
  unitPrice: number;   // snapshot of price at purchase time (cents)
}

export interface ShippingAddress {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;     // ISO 3166-1 alpha-2, e.g. "US"
}

export interface Order {
  id: string;
  stripePaymentIntentId: string;
  stripeSessionId: string;
  items: OrderItem[];
  customerId: string;
  customerEmail: string;
  status: OrderStatus;
  shippingAddress: ShippingAddress;
  subtotalCents: number;
  createdAt: string;
}

// ─── Cart ──────────────────────────────────────────────────────────────────────

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;       // cents
  image: string;       // primary image URL
  quantity: number;
}

// ─── Admin Auth ────────────────────────────────────────────────────────────────

export interface AdminJWTPayload {
  role: "admin";
  iat: number;
  exp: number;
}

// ─── Saved Shipping Address ────────────────────────────────────────────────────

export interface SavedAddress {
  id: string;
  customerId: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  createdAt: string;
}

// ─── Customer ──────────────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface CustomerJWTPayload {
  role: "customer";
  sub: string;
  email: string;
  iat: number;
  exp: number;
}

// ─── API Helpers ───────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}

export type ApiResponse<T> = T | ApiError;
