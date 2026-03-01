import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { Product, ProductTag, Category, Order, OrderItem, ShippingAddress, OrderStatus, Customer, SavedAddress } from "./types";

// Minimal D1 type definitions
interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ success: boolean }>;
}
interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

// Minimal R2 type definitions
interface R2ObjectBody {
  body: ReadableStream;
  httpMetadata?: { contentType?: string };
}
export interface R2Bucket {
  put(key: string, value: ArrayBuffer | ReadableStream | string, options?: { httpMetadata?: { contentType?: string } }): Promise<void>;
  get(key: string): Promise<R2ObjectBody | null>;
  delete(key: string): Promise<void>;
}

async function getDB(): Promise<D1Database> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as Record<string, unknown>).DB as D1Database;
}

export async function getImagesBucket(): Promise<R2Bucket> {
  const { env } = await getCloudflareContext({ async: true });
  return (env as Record<string, unknown>).IMAGES as R2Bucket;
}

// ─── Row mappers ──────────────────────────────────────────────────────────────

function rowToProduct(r: Record<string, unknown>): Product {
  return {
    id: r.id as string,
    name: r.name as string,
    slug: r.slug as string,
    description: r.description as string,
    price: r.price as number,
    images: JSON.parse((r.images as string) || "[]"),
    stock: r.stock as number,
    category: r.category as string,
    active: Boolean(r.active),
    tags: JSON.parse((r.tags as string) || "[]") as ProductTag[],
    comingSoon: Boolean(r.coming_soon),
    availableAt: (r.available_at as string) || null,
    createdAt: r.created_at as string,
  };
}

function rowToOrder(
  r: Record<string, unknown>,
  itemRows: Record<string, unknown>[]
): Order {
  const items: OrderItem[] = itemRows.map((i) => ({
    productId: i.product_id as string,
    productName: i.product_name as string,
    productSlug: i.product_slug as string,
    quantity: i.quantity as number,
    unitPrice: i.unit_price as number,
  }));

  return {
    id: r.id as string,
    stripePaymentIntentId: r.stripe_payment_intent_id as string,
    stripeSessionId: r.stripe_session_id as string,
    customerId: (r.customer_id as string) || "",
    customerEmail: r.customer_email as string,
    status: r.status as OrderStatus,
    items,
    shippingAddress: {
      name: r.shipping_name as string,
      line1: r.shipping_line1 as string,
      line2: (r.shipping_line2 as string) || undefined,
      city: r.shipping_city as string,
      state: r.shipping_state as string,
      postalCode: r.shipping_postal_code as string,
      country: r.shipping_country as string,
    },
    subtotalCents: r.subtotal_cents as number,
    createdAt: r.created_at as string,
  };
}

// ─── Database API ─────────────────────────────────────────────────────────────

export const db = {
  // ── Products ──────────────────────────────────────────────────────────────

  async getProduct(id: string): Promise<Product | null> {
    const d1 = await getDB();
    const row = await d1.prepare("SELECT * FROM products WHERE id = ?").bind(id).first();
    return row ? rowToProduct(row) : null;
  },

  async listProducts(): Promise<Product[]> {
    const d1 = await getDB();
    const { results } = await d1
      .prepare("SELECT * FROM products ORDER BY created_at DESC")
      .all();
    return results.map(rowToProduct);
  },

  async queryProducts(opts: {
    activeOnly?: boolean;
    category?: string;
    search?: string;
    limit?: number;
  }): Promise<Product[]> {
    const d1 = await getDB();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (opts.activeOnly) conditions.push("active = 1");
    if (opts.category) {
      conditions.push("category = ?");
      params.push(opts.category);
    }
    if (opts.search) {
      conditions.push("(name LIKE ? OR description LIKE ?)");
      params.push(`%${opts.search}%`, `%${opts.search}%`);
    }

    let sql = "SELECT * FROM products";
    if (conditions.length) sql += " WHERE " + conditions.join(" AND ");
    sql += " ORDER BY created_at DESC";
    if (opts.limit) {
      sql += " LIMIT ?";
      params.push(opts.limit);
    }

    const stmt = d1.prepare(sql);
    const { results } = await (params.length ? stmt.bind(...params) : stmt).all();
    return results.map(rowToProduct);
  },

  async createProduct(data: Omit<Product, "id">): Promise<Product> {
    const d1 = await getDB();
    const id = crypto.randomUUID();
    await d1
      .prepare(
        "INSERT INTO products (id, name, slug, description, price, images, stock, category, active, tags, coming_soon, available_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
      )
      .bind(
        id,
        data.name,
        data.slug,
        data.description,
        data.price,
        JSON.stringify(data.images),
        data.stock,
        data.category,
        data.active ? 1 : 0,
        JSON.stringify(data.tags ?? []),
        data.comingSoon ? 1 : 0,
        data.availableAt ?? null,
        data.createdAt
      )
      .run();
    return { id, ...data };
  },

  async updateProduct(id: string, updates: Partial<Omit<Product, "id">>): Promise<void> {
    const d1 = await getDB();
    const sets: string[] = [];
    const params: unknown[] = [];

    if (updates.name !== undefined) { sets.push("name = ?"); params.push(updates.name); }
    if (updates.slug !== undefined) { sets.push("slug = ?"); params.push(updates.slug); }
    if (updates.description !== undefined) { sets.push("description = ?"); params.push(updates.description); }
    if (updates.price !== undefined) { sets.push("price = ?"); params.push(updates.price); }
    if (updates.images !== undefined) { sets.push("images = ?"); params.push(JSON.stringify(updates.images)); }
    if (updates.stock !== undefined) { sets.push("stock = ?"); params.push(updates.stock); }
    if (updates.category !== undefined) { sets.push("category = ?"); params.push(updates.category); }
    if (updates.active !== undefined) { sets.push("active = ?"); params.push(updates.active ? 1 : 0); }
    if (updates.tags !== undefined) { sets.push("tags = ?"); params.push(JSON.stringify(updates.tags)); }
    if (updates.comingSoon !== undefined) { sets.push("coming_soon = ?"); params.push(updates.comingSoon ? 1 : 0); }
    if (updates.availableAt !== undefined) { sets.push("available_at = ?"); params.push(updates.availableAt ?? null); }

    if (!sets.length) return;
    params.push(id);
    await d1.prepare(`UPDATE products SET ${sets.join(", ")} WHERE id = ?`).bind(...params).run();
  },

  async deleteProduct(id: string): Promise<void> {
    const d1 = await getDB();
    await d1.prepare("DELETE FROM products WHERE id = ?").bind(id).run();
  },

  async decrementStock(productId: string, quantity: number): Promise<void> {
    const d1 = await getDB();
    await d1
      .prepare("UPDATE products SET stock = MAX(0, stock - ?) WHERE id = ?")
      .bind(quantity, productId)
      .run();
  },

  async incrementStock(productId: string, quantity: number): Promise<void> {
    const d1 = await getDB();
    await d1
      .prepare("UPDATE products SET stock = stock + ? WHERE id = ?")
      .bind(quantity, productId)
      .run();
  },

  // ── Categories ────────────────────────────────────────────────────────────

  async listCategories(): Promise<Category[]> {
    const d1 = await getDB();
    const { results } = await d1
      .prepare("SELECT * FROM categories ORDER BY name ASC")
      .all();
    return results.map((r) => ({
      id: r.id as string,
      name: r.name as string,
      slug: r.slug as string,
    }));
  },

  async createCategory(data: Omit<Category, "id">): Promise<Category> {
    const d1 = await getDB();
    const id = crypto.randomUUID();
    await d1
      .prepare("INSERT INTO categories (id, name, slug) VALUES (?, ?, ?)")
      .bind(id, data.name, data.slug)
      .run();
    return { id, ...data };
  },

  async deleteCategory(id: string): Promise<void> {
    const d1 = await getDB();
    await d1.prepare("DELETE FROM categories WHERE id = ?").bind(id).run();
  },

  // ── Orders ────────────────────────────────────────────────────────────────

  async getOrder(id: string): Promise<Order | null> {
    const d1 = await getDB();
    const row = await d1.prepare("SELECT * FROM orders WHERE id = ?").bind(id).first();
    if (!row) return null;
    const { results: itemRows } = await d1
      .prepare("SELECT * FROM order_items WHERE order_id = ?")
      .bind(id)
      .all();
    return rowToOrder(row, itemRows);
  },

  async listOrders(): Promise<Order[]> {
    const d1 = await getDB();
    const { results: orderRows } = await d1
      .prepare("SELECT * FROM orders ORDER BY created_at DESC")
      .all();
    if (!orderRows.length) return [];

    const ids = orderRows.map((r) => r.id as string);
    const placeholders = ids.map(() => "?").join(",");
    const { results: itemRows } = await d1
      .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
      .bind(...ids)
      .all();

    return orderRows.map((orderRow) => {
      const items = itemRows.filter((i) => i.order_id === orderRow.id);
      return rowToOrder(orderRow, items);
    });
  },

  async createOrder(data: {
    stripeSessionId: string;
    items: OrderItem[];
    subtotalCents: number;
    customerId?: string;
  }): Promise<string> {
    const d1 = await getDB();
    const id = crypto.randomUUID();

    await d1
      .prepare(
        "INSERT INTO orders (id, stripe_payment_intent_id, stripe_session_id, customer_email, customer_id, status, shipping_name, shipping_line1, shipping_line2, shipping_city, shipping_state, shipping_postal_code, shipping_country, subtotal_cents, created_at) VALUES (?, '', ?, '', ?, 'pending', '', '', '', '', '', '', '', ?, ?)"
      )
      .bind(id, data.stripeSessionId, data.customerId ?? "", data.subtotalCents, new Date().toISOString())
      .run();

    for (const item of data.items) {
      await d1
        .prepare(
          "INSERT INTO order_items (id, order_id, product_id, product_name, product_slug, quantity, unit_price) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .bind(
          crypto.randomUUID(),
          id,
          item.productId,
          item.productName,
          item.productSlug,
          item.quantity,
          item.unitPrice
        )
        .run();
    }

    return id;
  },

  // ── Customers ─────────────────────────────────────────────────────────────

  async getCustomerByEmail(email: string): Promise<(Customer & { passwordHash: string }) | null> {
    const d1 = await getDB();
    const row = await d1
      .prepare("SELECT * FROM customers WHERE email = ?")
      .bind(email)
      .first();
    if (!row) return null;
    return {
      id: row.id as string,
      email: row.email as string,
      name: row.name as string,
      createdAt: row.created_at as string,
      passwordHash: row.password_hash as string,
    };
  },

  async getCustomerById(id: string): Promise<Customer | null> {
    const d1 = await getDB();
    const row = await d1
      .prepare("SELECT * FROM customers WHERE id = ?")
      .bind(id)
      .first();
    if (!row) return null;
    return {
      id: row.id as string,
      email: row.email as string,
      name: row.name as string,
      createdAt: row.created_at as string,
    };
  },

  async createCustomer(data: {
    email: string;
    passwordHash: string;
    name: string;
  }): Promise<Customer> {
    const d1 = await getDB();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    await d1
      .prepare(
        "INSERT INTO customers (id, email, password_hash, name, created_at) VALUES (?, ?, ?, ?, ?)"
      )
      .bind(id, data.email, data.passwordHash, data.name, createdAt)
      .run();
    return { id, email: data.email, name: data.name, createdAt };
  },

  async updateCustomer(
    id: string,
    updates: { name?: string; email?: string; passwordHash?: string }
  ): Promise<void> {
    const d1 = await getDB();
    const sets: string[] = [];
    const params: unknown[] = [];

    if (updates.name !== undefined) { sets.push("name = ?"); params.push(updates.name); }
    if (updates.email !== undefined) { sets.push("email = ?"); params.push(updates.email); }
    if (updates.passwordHash !== undefined) { sets.push("password_hash = ?"); params.push(updates.passwordHash); }

    if (!sets.length) return;
    params.push(id);
    await d1.prepare(`UPDATE customers SET ${sets.join(", ")} WHERE id = ?`).bind(...params).run();
  },

  // ── Saved Addresses ───────────────────────────────────────────────────────

  async listAddresses(customerId: string): Promise<SavedAddress[]> {
    const d1 = await getDB();
    const { results } = await d1
      .prepare("SELECT * FROM shipping_addresses WHERE customer_id = ? ORDER BY is_default DESC, created_at DESC")
      .bind(customerId)
      .all();
    return results.map((r) => ({
      id: r.id as string,
      customerId: r.customer_id as string,
      name: r.name as string,
      line1: r.line1 as string,
      line2: r.line2 as string,
      city: r.city as string,
      state: r.state as string,
      postalCode: r.postal_code as string,
      country: r.country as string,
      isDefault: Boolean(r.is_default),
      createdAt: r.created_at as string,
    }));
  },

  async createAddress(customerId: string, data: Omit<SavedAddress, "id" | "customerId" | "createdAt">): Promise<SavedAddress> {
    const d1 = await getDB();
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    if (data.isDefault) {
      await d1.prepare("UPDATE shipping_addresses SET is_default = 0 WHERE customer_id = ?").bind(customerId).run();
    }
    await d1
      .prepare("INSERT INTO shipping_addresses (id, customer_id, name, line1, line2, city, state, postal_code, country, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .bind(id, customerId, data.name, data.line1, data.line2 ?? "", data.city, data.state, data.postalCode, data.country, data.isDefault ? 1 : 0, createdAt)
      .run();
    return { id, customerId, ...data, createdAt };
  },

  async deleteAddress(id: string, customerId: string): Promise<void> {
    const d1 = await getDB();
    await d1.prepare("DELETE FROM shipping_addresses WHERE id = ? AND customer_id = ?").bind(id, customerId).run();
  },

  async setDefaultAddress(id: string, customerId: string): Promise<void> {
    const d1 = await getDB();
    await d1.prepare("UPDATE shipping_addresses SET is_default = 0 WHERE customer_id = ?").bind(customerId).run();
    await d1.prepare("UPDATE shipping_addresses SET is_default = 1 WHERE id = ? AND customer_id = ?").bind(id, customerId).run();
  },

  async getOrdersByEmail(email: string): Promise<Order[]> {
    return this.getOrdersByCustomer({ email });
  },

  async getOrdersByCustomer(opts: { customerId?: string; email?: string }): Promise<Order[]> {
    const d1 = await getDB();
    const conditions: string[] = [];
    const params: unknown[] = [];

    if (opts.customerId) { conditions.push("customer_id = ?"); params.push(opts.customerId); }
    if (opts.email) { conditions.push("customer_email = ?"); params.push(opts.email); }
    if (!conditions.length) return [];

    const where = conditions.length > 1 ? `(${conditions.join(" OR ")})` : conditions[0];
    const { results: orderRows } = await d1
      .prepare(`SELECT * FROM orders WHERE ${where} ORDER BY created_at DESC`)
      .bind(...params)
      .all();
    if (!orderRows.length) return [];

    const ids = orderRows.map((r) => r.id as string);
    const placeholders = ids.map(() => "?").join(",");
    const { results: itemRows } = await d1
      .prepare(`SELECT * FROM order_items WHERE order_id IN (${placeholders})`)
      .bind(...ids)
      .all();

    return orderRows.map((orderRow) => {
      const items = itemRows.filter((i) => i.order_id === orderRow.id);
      return rowToOrder(orderRow, items);
    });
  },

  async updateOrder(
    id: string,
    updates: {
      status?: OrderStatus;
      stripeSessionId?: string;
      stripePaymentIntentId?: string;
      customerEmail?: string;
      shippingAddress?: ShippingAddress;
    }
  ): Promise<void> {
    const d1 = await getDB();
    const sets: string[] = [];
    const params: unknown[] = [];

    if (updates.status !== undefined) { sets.push("status = ?"); params.push(updates.status); }
    if (updates.stripeSessionId !== undefined) { sets.push("stripe_session_id = ?"); params.push(updates.stripeSessionId); }
    if (updates.stripePaymentIntentId !== undefined) { sets.push("stripe_payment_intent_id = ?"); params.push(updates.stripePaymentIntentId); }
    if (updates.customerEmail !== undefined) { sets.push("customer_email = ?"); params.push(updates.customerEmail); }
    if (updates.shippingAddress) {
      const a = updates.shippingAddress;
      sets.push("shipping_name = ?", "shipping_line1 = ?", "shipping_line2 = ?", "shipping_city = ?", "shipping_state = ?", "shipping_postal_code = ?", "shipping_country = ?");
      params.push(a.name, a.line1, a.line2 ?? "", a.city, a.state, a.postalCode, a.country);
    }

    if (!sets.length) return;
    params.push(id);
    await d1.prepare(`UPDATE orders SET ${sets.join(", ")} WHERE id = ?`).bind(...params).run();
  },
};
