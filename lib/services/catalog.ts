"use client";

import type {
  Category,
  Collection,
  InventoryMovement,
  Product,
  ProductStatus,
  ProductVariant,
} from "@/lib/types";
import { useDataStore } from "@/lib/store/data-store";
import { MockApiError, simulateLatency } from "./errors";
import { slugify } from "@/lib/utils";

export type ProductVariantInput = Omit<ProductVariant, "id" | "assetId"> & { id?: string };

export interface ProductInput {
  title: string;
  description: string;
  categoryId: string;
  collectionIds: string[];
  brand: string;
  sku: string;
  barcode: string;
  price: number;
  compareAtPrice?: number;
  costPrice: number;
  weight: number;
  weightUnit: Product["weightUnit"];
  images: string[];
  variants: ProductVariantInput[];
  seoTitle: string;
  seoDescription: string;
  visibility: Product["visibility"];
  status: ProductStatus;
  featured: boolean;
  tags: string[];
  shippingProfileId: string;
}

function assertUniqueSku(sku: string, products: Product[], ignoreId?: string) {
  const clash = products.find(
    (product) => product.sku.toLowerCase() === sku.toLowerCase() && product.id !== ignoreId,
  );
  if (clash) {
    throw new MockApiError(`SKU "${sku}" is already used by "${clash.title}".`, "duplicate_sku", 409);
  }
}

/**
 * Keeps `collection.productIds` and `product.collectionIds` in sync. Both
 * directions of the relation are read by the UI (the storefront filters
 * collections by `productIds`, the product page lists `collectionIds`), so
 * only one of them being updated would make the two disagree.
 */
function syncCollectionMembership(
  collections: Collection[],
  productId: string,
  collectionIds: string[],
): Collection[] {
  const wanted = new Set(collectionIds);
  return collections.map((collection) => {
    const shouldContain = wanted.has(collection.id);
    const doesContain = collection.productIds.includes(productId);
    if (shouldContain === doesContain) return collection;
    return {
      ...collection,
      productIds: shouldContain
        ? [...collection.productIds, productId]
        : collection.productIds.filter((id) => id !== productId),
    };
  });
}

export const productService = {
  async list(): Promise<Product[]> {
    await simulateLatency(120, 120);
    return useDataStore.getState().products;
  },

  async create(input: ProductInput): Promise<Product> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!input.title.trim()) throw new MockApiError("Product title is required.", "validation");
    assertUniqueSku(input.sku, state.products);

    const id = `prd-${Date.now().toString(36)}`;
    const now = new Date().toISOString();
    const variants: ProductVariant[] = input.variants.length
      ? input.variants.map((variant, index) => ({
          ...variant,
          id: variant.id ?? `${id}-v${index + 1}`,
        }))
      : [];

    const product: Product = {
      id,
      title: input.title.trim(),
      slug: slugify(input.title),
      description: input.description,
      images: input.images.length ? input.images : ["asset-01"],
      categoryId: input.categoryId,
      collectionIds: input.collectionIds,
      brand: input.brand,
      sku: input.sku,
      barcode: input.barcode,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      costPrice: input.costPrice,
      inventory: variants.reduce((sum, variant) => sum + variant.inventory, 0),
      variants,
      weight: input.weight,
      weightUnit: input.weightUnit,
      shippingProfileId: input.shippingProfileId,
      seoTitle: input.seoTitle,
      seoDescription: input.seoDescription,
      visibility: input.visibility,
      status: input.status,
      featured: input.featured,
      tags: input.tags,
      createdAt: now,
      updatedAt: now,
    };

    state.patch({
      products: [product, ...state.products],
      collections: syncCollectionMembership(state.collections, product.id, product.collectionIds),
    });
    return product;
  },

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    await simulateLatency();
    const state = useDataStore.getState();
    const product = state.products.find((item) => item.id === id);
    if (!product) throw new MockApiError("Product not found.", "not_found", 404);
    if (input.sku) assertUniqueSku(input.sku, state.products, id);

    const variants = input.variants
      ? input.variants.map((variant, index) => ({
          ...variant,
          id: variant.id ?? `${id}-v${index + 1}`,
        }))
      : product.variants;

    const updated: Product = {
      ...product,
      ...input,
      slug: input.title ? slugify(input.title) : product.slug,
      variants,
      inventory:
        input.variants !== undefined
          ? variants.reduce((sum, variant) => sum + variant.inventory, 0)
          : product.inventory,
      updatedAt: new Date().toISOString(),
    };

    state.patch({
      products: state.products.map((item) => (item.id === id ? updated : item)),
      collections: syncCollectionMembership(state.collections, id, updated.collectionIds),
    });
    return updated;
  },

  async setStatus(id: string, status: ProductStatus): Promise<Product> {
    return this.update(id, { status });
  },

  async duplicate(id: string): Promise<Product> {
    await simulateLatency();
    const state = useDataStore.getState();
    const source = state.products.find((item) => item.id === id);
    if (!source) throw new MockApiError("Product not found.", "not_found", 404);
    const stamp = Date.now().toString(36);
    const copy: Product = {
      ...source,
      id: `prd-${stamp}`,
      title: `${source.title} (copy)`,
      slug: `${source.slug}-copy-${stamp.slice(-4)}`,
      sku: `${source.sku}-C${stamp.slice(-4).toUpperCase()}`,
      status: "draft",
      visibility: "hidden",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      variants: source.variants.map((variant) => ({ ...variant, id: `${variant.id}-${stamp}` })),
    };
    state.patch({
      products: [copy, ...state.products],
      collections: syncCollectionMembership(state.collections, copy.id, copy.collectionIds),
    });
    return copy;
  },

  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!state.products.some((item) => item.id === id)) {
      throw new MockApiError("Product not found.", "not_found", 404);
    }
    state.patch({
      products: state.products.filter((item) => item.id !== id),
      collections: state.collections.map((collection) => ({
        ...collection,
        productIds: collection.productIds.filter((productId) => productId !== id),
      })),
    });
  },

  async adjustInventory(
    productId: string,
    variantId: string | null,
    delta: number,
    reason: string,
    note?: string,
  ): Promise<InventoryMovement[]> {
    await simulateLatency();
    const state = useDataStore.getState();
    const product = state.products.find((item) => item.id === productId);
    if (!product) throw new MockApiError("Product not found.", "not_found", 404);
    if (!Number.isFinite(delta) || delta === 0) {
      throw new MockApiError("Adjustment must be a non-zero number.", "validation");
    }

    const affected = variantId
      ? product.variants.filter((variant) => variant.id === variantId)
      : product.variants;
    if (!affected.length) {
      throw new MockApiError("That variant no longer exists.", "not_found", 404);
    }

    const variants = product.variants.map((variant) =>
      affected.some((candidate) => candidate.id === variant.id)
        ? { ...variant, inventory: Math.max(0, variant.inventory + delta) }
        : variant,
    );
    const updatedProduct: Product = {
      ...product,
      variants,
      inventory: variants.reduce((sum, variant) => sum + variant.inventory, 0),
      updatedAt: new Date().toISOString(),
    };

    // The log records one movement per affected variant, so a product-wide
    // adjustment is not mis-attributed to its first variant.
    const stamp = Date.now().toString(36);
    const movements: InventoryMovement[] = affected.map((variant, index) => {
      const updated = variants.find((candidate) => candidate.id === variant.id)!;
      return {
        id: `mov-${stamp}-${index + 1}`,
        productId,
        variantId: variant.id,
        productTitle: product.title,
        sku: variant.sku,
        type: delta > 0 ? "received" : "adjusted",
        quantity: delta,
        reason,
        note,
        resultingStock: updated.inventory,
        createdAt: new Date().toISOString(),
        actor: "You (demo)",
      };
    });

    state.patch({
      products: state.products.map((item) => (item.id === productId ? updatedProduct : item)),
      inventoryMovements: [...movements, ...state.inventoryMovements],
    });
    return movements;
  },
};

export const categoryService = {
  async list(): Promise<Category[]> {
    await simulateLatency(100, 100);
    return useDataStore.getState().categories;
  },
  async create(input: Omit<Category, "id" | "productCount" | "createdAt">): Promise<Category> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!input.name.trim()) throw new MockApiError("Category name is required.", "validation");
    const category: Category = {
      ...input,
      id: `cat-${Date.now().toString(36)}`,
      slug: slugify(input.name),
      productCount: 0,
      createdAt: new Date().toISOString(),
    };
    state.patch({ categories: [...state.categories, category] });
    return category;
  },
  async update(id: string, input: Partial<Category>): Promise<Category> {
    await simulateLatency();
    const state = useDataStore.getState();
    const existing = state.categories.find((item) => item.id === id);
    if (!existing) throw new MockApiError("Category not found.", "not_found", 404);
    const updated: Category = {
      ...existing,
      ...input,
      slug: input.name ? slugify(input.name) : existing.slug,
    };
    state.patch({ categories: state.categories.map((item) => (item.id === id ? updated : item)) });
    return updated;
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (state.categories.some((item) => item.parentId === id)) {
      throw new MockApiError("Move or remove child categories first.", "conflict", 409);
    }
    state.patch({
      categories: state.categories.filter((item) => item.id !== id),
      products: state.products.map((product) =>
        product.categoryId === id ? { ...product, categoryId: "" } : product,
      ),
    });
  },
};

export const collectionService = {
  async list(): Promise<Collection[]> {
    await simulateLatency(100, 100);
    return useDataStore.getState().collections;
  },
  async create(input: Omit<Collection, "id" | "createdAt" | "updatedAt">): Promise<Collection> {
    await simulateLatency();
    const state = useDataStore.getState();
    if (!input.title.trim()) throw new MockApiError("Collection title is required.", "validation");
    const now = new Date().toISOString();
    const collection: Collection = {
      ...input,
      id: `col-${Date.now().toString(36)}`,
      slug: slugify(input.title),
      createdAt: now,
      updatedAt: now,
    };
    state.patch({ collections: [...state.collections, collection] });
    return collection;
  },
  async update(id: string, input: Partial<Collection>): Promise<Collection> {
    await simulateLatency();
    const state = useDataStore.getState();
    const existing = state.collections.find((item) => item.id === id);
    if (!existing) throw new MockApiError("Collection not found.", "not_found", 404);
    const updated: Collection = {
      ...existing,
      ...input,
      slug: input.title ? slugify(input.title) : existing.slug,
      updatedAt: new Date().toISOString(),
    };
    state.patch({
      collections: state.collections.map((item) => (item.id === id ? updated : item)),
      // The relation is two-way: the storefront reads `collection.productIds`
      // but the product page and the theme sections read
      // `product.collectionIds`. Both have to move together.
      products:
        input.productIds === undefined
          ? state.products
          : state.products.map((product) => {
              const shouldContain = input.productIds!.includes(product.id);
              const doesContain = product.collectionIds.includes(id);
              if (shouldContain === doesContain) return product;
              return {
                ...product,
                collectionIds: shouldContain
                  ? [...product.collectionIds, id]
                  : product.collectionIds.filter((collectionId) => collectionId !== id),
              };
            }),
    });
    return updated;
  },
  async remove(id: string): Promise<void> {
    await simulateLatency();
    const state = useDataStore.getState();
    state.patch({
      collections: state.collections.filter((item) => item.id !== id),
      products: state.products.map((product) => ({
        ...product,
        collectionIds: product.collectionIds.filter((collectionId) => collectionId !== id),
      })),
    });
  },
};