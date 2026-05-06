# Graph Report - valleycentia-1-main  (2026-05-04)

## Corpus Check
- 81 files · ~102,342 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 284 nodes · 427 edges · 15 communities detected
- Extraction: 89% EXTRACTED · 11% INFERRED · 0% AMBIGUOUS · INFERRED: 46 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 15|Community 15]]

## God Nodes (most connected - your core abstractions)
1. `getSupabase()` - 35 edges
2. `getBrowserClient()` - 27 edges
3. `useAuth()` - 9 edges
4. `createClient()` - 8 edges
5. `getAdminProducts()` - 6 edges
6. `getBrandsAndCategories()` - 6 edges
7. `createAddress()` - 6 edges
8. `updateAddress()` - 6 edges
9. `deleteAddress()` - 6 edges
10. `useWishlist()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `load()` --calls--> `getAdminProducts()`  [INFERRED]
  src/app/admin/page.tsx → src/lib/supabase/adminQueries.ts
- `loadProducts()` --calls--> `getAdminProducts()`  [INFERRED]
  src/app/admin/products/page.tsx → src/lib/supabase/adminQueries.ts
- `handleAddrDelete()` --calls--> `deleteAddress()`  [INFERRED]
  src/app/checkout/page.tsx → src/lib/supabase/queries.ts
- `handleAddrDelete()` --calls--> `deleteAddress()`  [INFERRED]
  src/app/profile/page.tsx → src/lib/supabase/queries.ts
- `ProductCard()` --calls--> `useWishlist()`  [INFERRED]
  src/components/ProductCard.tsx → src/lib/WishlistContext.tsx

## Communities (52 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (32): formatReviewCount(), toSectionProduct(), handleAddrDelete(), handleAddrSave(), handleAddrDelete(), handleAddrSave(), addToWishlist(), createAddress() (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (25): handleSave(), init(), handleDelete(), handleSave(), loadCoupons(), handleDelete(), handleSave(), loadSections() (+17 more)

### Community 2 - "Community 2"
Cohesion: 0.1
Nodes (9): handlePointerUp(), ProductCard(), useWishlist(), closeLightbox(), goNext(), goPrev(), handler(), handleSubmitReview() (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.1
Nodes (4): LayoutShell(), AuthProvider(), useAuth(), WishlistProvider()

### Community 4 - "Community 4"
Cohesion: 0.15
Nodes (8): createVisibleChange(), deleteVisibleChange(), getAdminVisibleChanges(), updateVisibleChange(), createClient(), handleDelete(), handleSave(), loadData()

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (7): handleDelete(), handleSave(), loadLinks(), createNavLink(), deleteNavLink(), getAdminNavLinks(), updateNavLink()

### Community 6 - "Community 6"
Cohesion: 0.24
Nodes (7): handleDelete(), handleSave(), loadBrands(), createBrand(), deleteBrand(), getAdminBrands(), updateBrand()

### Community 7 - "Community 7"
Cohesion: 0.29
Nodes (7): handleDelete(), handleSave(), loadSlides(), createHeroSlide(), deleteHeroSlide(), getAdminHeroSlides(), updateHeroSlide()

### Community 8 - "Community 8"
Cohesion: 0.43
Nodes (5): load(), handleDelete(), loadProducts(), deleteProduct(), getAdminProducts()

### Community 9 - "Community 9"
Cohesion: 0.43
Nodes (5): flash(), loadContent(), saveSection(), getAboutContent(), updateAboutSection()

### Community 10 - "Community 10"
Cohesion: 0.83
Nodes (3): generateOrderNumber(), getSupabase(), POST()

### Community 11 - "Community 11"
Cohesion: 0.83
Nodes (3): generateOrderNumber(), getSupabase(), POST()

## Knowledge Gaps
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `Community 4` to `Community 0`, `Community 1`, `Community 3`?**
  _High betweenness centrality (0.287) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Community 3` to `Community 0`, `Community 2`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `getSupabase()` connect `Community 1` to `Community 4`, `Community 5`, `Community 6`, `Community 7`, `Community 8`, `Community 9`?**
  _High betweenness centrality (0.058) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `getAdminProducts()` (e.g. with `load()` and `loadProducts()`) actually correct?**
  _`getAdminProducts()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._