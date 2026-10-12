export const LOW_STOCK_THRESHOLD = 5;

export function stockStatus(row: { is_preorder: number; stock: number }) {
  if (row.is_preorder) return 'pre-order';
  if (row.stock <= 0) return 'out-of-stock';
  if (row.stock <= LOW_STOCK_THRESHOLD) return 'low-stock';
  return 'in-stock';
}

/** DB row -> storefront Product shape (see /types.ts). */
export function toProduct(r: any) {
  return {
    id: r.id,
    name: r.name,
    price: r.price,
    originalPrice: r.original_price ?? undefined,
    image: r.image,
    gallery: JSON.parse(r.gallery || '[]'),
    category: r.category,
    team: r.team,
    league: r.league,
    type: r.type,
    isPlayerEdition: Boolean(r.is_player_edition),
    status: stockStatus(r),
    stock: r.stock,
    isPreorder: Boolean(r.is_preorder),
    isActive: Boolean(r.is_active),
    rating: r.rating,
    reviews: r.reviews,
    description: r.description,
    season: r.season ?? undefined,
    color: r.color ?? undefined,
  };
}
