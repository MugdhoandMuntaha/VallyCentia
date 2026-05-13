import { createClient } from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface HeroSlide {
    id: string;
    title: string;
    subtitle: string | null;
    cta_text: string | null;
    cta_link: string | null;
    image_url: string;
    mobile_image_url: string | null;
    image_alt: string | null;
    background_color: string | null;
    text_color: string | null;
}

export interface ProductCard {
    id: string;
    slug: string;
    name: string;
    subtitle: string | null;
    short_description: string | null;
    base_price: number;
    compare_at_price: number | null;
    discount_percent: number;
    rating_avg: number;
    review_count: number;
    in_stock: boolean;
    is_featured: boolean;
    concerns: string[] | null;
    tags: string[] | null;
    brand_name: string | null;
    brand_slug: string | null;
    category_name: string | null;
    category_slug: string | null;
    primary_image_url: string | null;
    badges: { badge: string; label: string | null; color: string | null }[] | null;
}

export interface Brand {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    logo_url: string | null;
    accent_color: string | null;
    text_color: string | null;
}

export interface HomepageSection {
    id: string;
    section_type: string;
    title: string;
    subtitle: string | null;
    badge_text: string | null;
    cta_text: string | null;
    cta_link: string | null;
    background_color: string | null;
    sort_order: number;
    products: SectionProductCard[];
}

export interface SectionProductCard extends ProductCard {
    custom_badge_text: string | null;
    custom_badge_color: string | null;
    section_sort_order: number;
    // Computed fields for frontend compatibility
    coupon_price: number | null;
    coupon_code: string | null;
}

export interface ProductDetail {
    id: string;
    slug: string;
    name: string;
    subtitle: string | null;
    short_description: string | null;
    description: string | null;
    how_to_use: string | null;
    ingredients: string | null;
    base_price: number;
    compare_at_price: number | null;
    discount_percent: number;
    rating_avg: number;
    review_count: number;
    in_stock: boolean;
    stock_quantity: number;
    concerns: string[] | null;
    tags: string[] | null;
    brand_name: string | null;
    brand_slug: string | null;
    category_name: string | null;
    category_slug: string | null;
    images: { url: string; alt: string | null }[] | null;
    sizes: { id: string; label: string; ml: string | null; price: number; is_default: boolean }[] | null;
    key_benefits: { icon: string; title: string; desc: string }[] | null;
    highlights: string[] | null;
    badges: { badge: string; label: string | null; color: string | null }[] | null;
    coupon_price: number | null;
    coupon_code: string | null;
}

// ============================================================================
// CLIENT HELPERS
// ============================================================================

function getBrowserClient() {
    return createClient();
}

// ============================================================================
// NAV LINKS
// ============================================================================

export interface NavLinkItem {
    id: string;
    label: string;
    href: string;
    highlight: boolean;
    children: { label: string; href: string }[];
}

export async function getNavLinks(): Promise<NavLinkItem[]> {
    const supabase = getBrowserClient();

    // Fetch nav links (include linked_category_id)
    const { data, error } = await supabase
        .from('nav_links')
        .select('id, parent_id, label, href, highlight, sort_order, linked_category_id')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching nav links:', error);
        return [];
    }

    const all = data || [];
    const topLevel = all.filter(n => !n.parent_id);
    const manualChildren = all.filter(n => n.parent_id);

    // Collect all linked category IDs to fetch their children in one query
    const linkedCategoryIds = topLevel
        .map(n => n.linked_category_id)
        .filter(Boolean) as string[];

    // Fetch category children for all linked categories in one go
    let categoryChildrenMap: Record<string, { name: string; slug: string }[]> = {};
    if (linkedCategoryIds.length > 0) {
        const { data: catChildren } = await supabase
            .from('categories')
            .select('name, slug, parent_id')
            .in('parent_id', linkedCategoryIds)
            .eq('is_active', true)
            .order('name', { ascending: true });

        if (catChildren) {
            for (const child of catChildren) {
                if (!categoryChildrenMap[child.parent_id]) {
                    categoryChildrenMap[child.parent_id] = [];
                }
                categoryChildrenMap[child.parent_id].push({ name: child.name, slug: child.slug });
            }
        }
    }

    return topLevel.map(item => {
        // If linked to a category, use category children as dropdown items
        let children: { label: string; href: string }[] = [];

        if (item.linked_category_id && categoryChildrenMap[item.linked_category_id]) {
            children = categoryChildrenMap[item.linked_category_id].map(c => ({
                label: c.name,
                href: `/shop?type=${c.slug}`,
            }));
        }

        // Also include any manual nav_link children (merged after category ones)
        const manual = manualChildren
            .filter(c => c.parent_id === item.id)
            .sort((a, b) => a.sort_order - b.sort_order)
            .map(c => ({ label: c.label, href: c.href }));

        children = [...children, ...manual];

        return {
            id: item.id,
            label: item.label,
            href: item.href,
            highlight: item.highlight,
            children,
        };
    });
}

// ============================================================================
// HERO SLIDES
// ============================================================================

export async function getHeroSlides(): Promise<HeroSlide[]> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('hero_slides')
        .select('id, title, subtitle, cta_text, cta_link, image_url, mobile_image_url, image_alt, background_color, text_color')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching hero slides:', error);
        return [];
    }
    return data || [];
}

// ============================================================================
// BRANDS
// ============================================================================

export async function getBrands(): Promise<Brand[]> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching brands:', error);
        return [];
    }
    return data || [];
}

// ============================================================================
// HOMEPAGE SECTIONS (with products)
// ============================================================================

export async function getHomepageSections(): Promise<HomepageSection[]> {
    const supabase = getBrowserClient();

    // 1. Get sections
    const { data: sections, error: secError } = await supabase
        .from('homepage_sections')
        .select('id, section_type, title, subtitle, badge_text, cta_text, cta_link, background_color, sort_order')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (secError || !sections) {
        console.error('Error fetching homepage sections:', secError);
        try {
            console.error('Error Stringified:', JSON.stringify(secError, Object.getOwnPropertyNames(secError || {}), 2));
        } catch (e) {
            console.error('Could not stringify error object');
        }
        return [];
    }

    // 2. For each product section, get linked products
    // Exclude non-product sections (hero carousel is images, brands section is brand logos)
    const NON_PRODUCT_SECTIONS = ['hero_carousel', 'brands_that_lead'];
    const productSections = sections.filter(s =>
        !NON_PRODUCT_SECTIONS.includes(s.section_type)
    );

    const result: HomepageSection[] = [];

    for (const section of sections) {
        if (!productSections.includes(section)) {
            result.push({ ...section, products: [] });
            continue;
        }

        // Get section-product links
        const { data: links } = await supabase
            .from('homepage_section_products')
            .select('product_id, sort_order, custom_badge_text, custom_badge_color')
            .eq('section_id', section.id)
            .order('sort_order', { ascending: true });

        if (!links || links.length === 0) {
            result.push({ ...section, products: [] });
            continue;
        }

        const productIds = links.map(l => l.product_id);

        // Get product cards via the view
        const { data: products } = await supabase
            .from('v_product_cards')
            .select('*')
            .in('id', productIds);

        // Get coupon info for these products
        const { data: coupons } = await supabase
            .from('product_coupons')
            .select('product_id, coupon_price, coupon_id')
            .in('product_id', productIds);

        // Get coupon codes
        let couponMap: Record<string, { price: number; code: string }> = {};
        if (coupons && coupons.length > 0) {
            const couponIds = [...new Set(coupons.map(c => c.coupon_id))];
            const { data: couponDetails } = await supabase
                .from('coupons')
                .select('id, code')
                .in('id', couponIds);

            const codeMap: Record<string, string> = {};
            couponDetails?.forEach(c => { codeMap[c.id] = c.code; });

            coupons.forEach(c => {
                if (!couponMap[c.product_id] || c.coupon_price < couponMap[c.product_id].price) {
                    couponMap[c.product_id] = { price: c.coupon_price, code: codeMap[c.coupon_id] || '' };
                }
            });
        }

        // Merge and sort
        const sectionProducts: SectionProductCard[] = (products || []).map(p => {
            const link = links.find(l => l.product_id === p.id);
            const coupon = couponMap[p.id];
            return {
                ...p,
                custom_badge_text: link?.custom_badge_text || null,
                custom_badge_color: link?.custom_badge_color || null,
                section_sort_order: link?.sort_order || 0,
                coupon_price: coupon?.price || null,
                coupon_code: coupon?.code || null,
            };
        }).sort((a, b) => a.section_sort_order - b.section_sort_order);

        result.push({ ...section, products: sectionProducts });
    }

    return result;
}

// ============================================================================
// PRODUCT CARDS (for shop page)
// ============================================================================

export interface ProductFilters {
    category?: string;
    brand?: string;
    concern?: string;
    type?: string;
    sort?: string;
    search?: string;
}

export async function getProductCards(filters?: ProductFilters): Promise<ProductCard[]> {
    const supabase = getBrowserClient();
    let query = supabase.from('v_product_cards').select('*');

    if (filters?.category) {
        query = query.eq('category_slug', filters.category);
    }
    if (filters?.brand) {
        query = query.eq('brand_slug', filters.brand);
    }
    if (filters?.concern) {
        query = query.contains('concerns', [filters.concern]);
    }
    if (filters?.type) {
        query = query.eq('category_slug', filters.type);
    }
    if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
    }

    // Sorting
    if (filters?.sort === 'price-low') {
        query = query.order('base_price', { ascending: true });
    } else if (filters?.sort === 'price-high') {
        query = query.order('base_price', { ascending: false });
    } else if (filters?.sort === 'top-rated') {
        query = query.order('rating_avg', { ascending: false });
    } else if (filters?.sort === 'newest') {
        query = query.order('created_at', { ascending: false });
    } else {
        query = query.order('is_featured', { ascending: false }).order('rating_avg', { ascending: false });
    }

    const { data, error } = await query;

    if (error) {
        console.error('Error fetching product cards:', error);
        try {
            console.error('Error Stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
            console.error('Could not stringify error object');
        }
        return [];
    }
    return data || [];
}

// ============================================================================
// PRODUCT DETAIL (for PDP)
// ============================================================================

export async function getProductBySlug(slug: string): Promise<ProductDetail | null> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('v_product_detail')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();

    if (error) {
        console.error('Error fetching product detail:', error);
        try {
            console.error('Error Stringified:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        } catch (e) {
            console.error('Could not stringify error object');
        }
        return null;
    }

    if (!data) {
        console.warn(`Product not found for slug: ${slug}`);
        return null;
    }

    // Fetch badges separately (not in the view)
    const { data: badgesData } = await supabase
        .from('product_badges')
        .select('badge, custom_label, badge_color')
        .eq('product_id', data.id);

    // Fetch assigned coupon for this product
    let coupon_price: number | null = null;
    let coupon_code: string | null = null;

    const { data: productCoupons } = await supabase
        .from('product_coupons')
        .select('coupon_price, coupon_id')
        .eq('product_id', data.id);

    if (productCoupons && productCoupons.length > 0) {
        // Pick the best (lowest price) coupon
        const best = productCoupons.reduce((a, b) =>
            (a.coupon_price || Infinity) < (b.coupon_price || Infinity) ? a : b
        );
        coupon_price = best.coupon_price;

        // Get the coupon code
        const { data: couponDetail } = await supabase
            .from('coupons')
            .select('code')
            .eq('id', best.coupon_id)
            .single();
        coupon_code = couponDetail?.code || null;
    }

    return {
        ...data,
        badges: badgesData ? badgesData.map(b => ({ badge: b.badge, label: b.custom_label, color: b.badge_color })) : null,
        coupon_price,
        coupon_code,
    };
}

// ============================================================================
// RELATED PRODUCTS
// ============================================================================

export async function getRelatedProducts(slug: string, limit: number = 4): Promise<ProductCard[]> {
    const supabase = getBrowserClient();

    // First get the current product's category
    const { data: current } = await supabase
        .from('products')
        .select('id, category_id')
        .eq('slug', slug)
        .single();

    if (!current) return [];

    const { data, error } = await supabase
        .from('v_product_cards')
        .select('*')
        .eq('category_slug', current.category_id ? undefined : '')
        .neq('id', current.id)
        .limit(limit);

    if (error) {
        // Fallback: just get any products except current
        const { data: fallback } = await supabase
            .from('v_product_cards')
            .select('*')
            .neq('slug', slug)
            .order('rating_avg', { ascending: false })
            .limit(limit);
        return fallback || [];
    }
    return data || [];
}

// Simpler related products that just excludes current product
export async function getRelatedProductsSimple(currentSlug: string, limit: number = 4): Promise<ProductCard[]> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('v_product_cards')
        .select('*')
        .neq('slug', currentSlug)
        .order('rating_avg', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching related products:', error);
        return [];
    }
    return data || [];
}

// ============================================================================
// SEARCH PRODUCTS (for header)
// ============================================================================

export async function searchProducts(query: string): Promise<ProductCard[]> {
    if (!query.trim()) return [];
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('v_product_cards')
        .select('*')
        .or(`name.ilike.%${query}%,short_description.ilike.%${query}%`)
        .order('rating_avg', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error searching products:', error);
        return [];
    }
    return data || [];
}

// ============================================================================
// WISHLIST
// ============================================================================

export async function getWishlist(userId: string): Promise<string[]> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching wishlist:', error);
        return [];
    }
    return (data || []).map(item => item.product_id);
}

export async function addToWishlist(userId: string, productId: string): Promise<{ error: string | null }> {
    const supabase = getBrowserClient();
    const { error } = await supabase
        .from('wishlist_items')
        .upsert({ user_id: userId, product_id: productId }, { onConflict: 'user_id,product_id' });

    if (error) {
        console.error('Error adding to wishlist:', error);
        return { error: error.message };
    }
    return { error: null };
}

export async function removeFromWishlist(userId: string, productId: string): Promise<{ error: string | null }> {
    const supabase = getBrowserClient();
    const { error } = await supabase
        .from('wishlist_items')
        .delete()
        .eq('user_id', userId)
        .eq('product_id', productId);

    if (error) {
        console.error('Error removing from wishlist:', error);
        return { error: error.message };
    }
    return { error: null };
}

export async function getWishlistProducts(userId: string): Promise<ProductCard[]> {
    const supabase = getBrowserClient();
    const { data: wishlistItems, error: wishlistError } = await supabase
        .from('wishlist_items')
        .select('product_id')
        .eq('user_id', userId);

    if (wishlistError || !wishlistItems || wishlistItems.length === 0) return [];

    const productIds = wishlistItems.map(w => w.product_id);
    const { data, error } = await supabase
        .from('v_product_cards')
        .select('*')
        .in('id', productIds);

    if (error) {
        console.error('Error fetching wishlist products:', error);
        return [];
    }
    return data || [];
}

// ============================================================================
// REVIEWS & RATINGS
// ============================================================================

export interface Review {
    id: string;
    product_id: string;
    user_id: string;
    rating: number;
    title: string | null;
    body: string | null;
    is_verified: boolean;
    helpful_count: number;
    created_at: string;
    user_name?: string;
}

export async function getProductReviews(productId: string): Promise<Review[]> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('is_approved', true)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching reviews:', error);
        return [];
    }

    const reviews = (data || []) as Review[];

    // Fetch user display names
    for (const review of reviews) {
        const { data: profile } = await supabase
            .from('user_profiles')
            .select('display_name, full_name')
            .eq('id', review.user_id)
            .single();
        review.user_name = profile?.display_name || profile?.full_name || 'Anonymous';
    }

    return reviews;
}

export async function submitReview(data: {
    product_id: string;
    user_id: string;
    rating: number;
    title: string;
    body: string;
}): Promise<{ error: string | null }> {
    const supabase = getBrowserClient();

    const { error } = await supabase
        .from('reviews')
        .insert({
            product_id: data.product_id,
            user_id: data.user_id,
            rating: data.rating,
            title: data.title || null,
            body: data.body || null,
            is_verified: false,
            is_approved: false,
        });

    if (error) {
        console.error('Error submitting review:', error);
        return { error: error.message };
    }
    return { error: null };
}


// ============================================================================
// USER ADDRESSES
// ============================================================================

export interface UserAddress {
    id: string;
    user_id: string;
    label: string;
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    landmark: string | null;
    is_default: boolean;
    created_at: string;
    updated_at: string;
}

export interface AddressFormData {
    label: string;
    full_name: string;
    phone: string;
    address_line_1: string;
    address_line_2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    landmark: string;
    is_default: boolean;
}

export async function getUserAddresses(userId: string): Promise<UserAddress[]> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', userId)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching addresses:', error);
        return [];
    }
    return (data || []) as UserAddress[];
}

export async function createAddress(userId: string, data: AddressFormData): Promise<{ id: string | null; error: string | null }> {
    const supabase = getBrowserClient();

    // If setting as default, unset others first
    if (data.is_default) {
        await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId);
    }

    const { data: addr, error } = await supabase
        .from('addresses')
        .insert({
            user_id: userId,
            label: data.label || 'Home',
            full_name: data.full_name,
            phone: data.phone,
            address_line_1: data.address_line_1,
            address_line_2: data.address_line_2 || null,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country || 'India',
            landmark: data.landmark || null,
            is_default: data.is_default,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating address:', error);
        return { id: null, error: error.message };
    }
    return { id: addr?.id || null, error: null };
}

export async function updateAddress(id: string, userId: string, data: AddressFormData): Promise<{ error: string | null }> {
    const supabase = getBrowserClient();

    if (data.is_default) {
        await supabase
            .from('addresses')
            .update({ is_default: false })
            .eq('user_id', userId);
    }

    const { error } = await supabase
        .from('addresses')
        .update({
            label: data.label || 'Home',
            full_name: data.full_name,
            phone: data.phone,
            address_line_1: data.address_line_1,
            address_line_2: data.address_line_2 || null,
            city: data.city,
            state: data.state,
            postal_code: data.postal_code,
            country: data.country || 'India',
            landmark: data.landmark || null,
            is_default: data.is_default,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating address:', error);
        return { error: error.message };
    }
    return { error: null };
}

export async function deleteAddress(id: string): Promise<{ error: string | null }> {
    const supabase = getBrowserClient();
    const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting address:', error);
        return { error: error.message };
    }
    return { error: null };
}

export async function setDefaultAddress(userId: string, addressId: string): Promise<{ error: string | null }> {
    const supabase = getBrowserClient();

    // Unset all
    await supabase
        .from('addresses')
        .update({ is_default: false })
        .eq('user_id', userId);

    // Set the one
    const { error } = await supabase
        .from('addresses')
        .update({ is_default: true })
        .eq('id', addressId);

    if (error) {
        console.error('Error setting default address:', error);
        return { error: error.message };
    }
    return { error: null };
}

// ============================================================================
// ORDERS
// ============================================================================

export interface OrderItem {
    id: string;
    product_id: string;
    product_name: string;
    product_image: string | null;
    product_slug: string | null;
    size: string | null;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface UserOrder {
    id: string;
    order_number: string;
    status: string;
    payment_status: string;
    subtotal: number;
    shipping_cost: number;
    tax: number;
    total: number;
    shipping_name: string;
    shipping_city: string;
    shipping_state: string;
    created_at: string;
    order_items: OrderItem[];
}

export async function getUserOrders(userId: string): Promise<UserOrder[]> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('orders')
        .select(`
            id, order_number, status, payment_status,
            subtotal, shipping_cost, tax, total,
            shipping_name, shipping_city, shipping_state,
            created_at,
            order_items (
                id, product_id, product_name, product_image, product_slug,
                size, quantity, unit_price, total_price
            )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
    return (data || []) as UserOrder[];
}

export async function getUserOrderCount(userId: string): Promise<number> {
    const supabase = getBrowserClient();
    const { count, error } = await supabase
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching order count:', error);
        return 0;
    }
    return count || 0;
}

// ============================================================================
// SITE SETTINGS
// ============================================================================

export async function getSiteSettings(): Promise<Record<string, unknown>> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('site_settings')
        .select('key, value');

    if (error) {
        console.error('Error fetching site settings:', error);
        return {};
    }

    const result: Record<string, unknown> = {};
    (data || []).forEach(row => {
        result[row.key] = row.value;
    });
    return result;
}

export async function getSiteSetting(key: string): Promise<unknown> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .single();

    if (error) {
        console.error(`Error fetching setting "${key}":`, error);
        return null;
    }
    return data?.value || null;
}

// ============================================================================
// COUPONS (PUBLIC)
// ============================================================================

export interface Coupon {
    id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    minimum_order_value: number;
    max_discount_amount: number | null;
    is_active: boolean;
}

export async function getActiveCoupons(): Promise<Coupon[]> {
    const supabase = getBrowserClient();
    const { data, error } = await supabase
        .from('coupons')
        .select('id, code, description, discount_type, discount_value, minimum_order_value, max_discount_amount, is_active')
        .eq('is_active', true)
        .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
        .order('code', { ascending: true });

    if (error) {
        console.error('Error fetching coupons:', error);
        return [];
    }
    return (data || []) as Coupon[];
}

// ============================================================================
// VISIBLE CHANGES (for homepage)
// ============================================================================

export interface VisibleChangeItem {
    id: string;
    slug: string;
    beforeImage: string;
    afterImage: string;
    beforeLabel: string;
    afterLabel: string;
    productThumb: string;
    productName: string;
    rating: number;
    reviewCount: string;
    price: number;
    originalPrice: number;
    discountPercent: number;
}

export async function getVisibleChanges(): Promise<VisibleChangeItem[]> {
    const supabase = getBrowserClient();

    const { data, error } = await supabase
        .from('visible_changes')
        .select(`
            *,
            products!left(name, slug, base_price, compare_at_price, discount_percent, rating_avg, review_count)
        `)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching visible changes:', error);
        return [];
    }

    // Get primary images for linked products
    const productIds = (data || []).map(vc => vc.product_id).filter(Boolean) as string[];
    let imageMap: Record<string, string> = {};

    if (productIds.length > 0) {
        const { data: images } = await supabase
            .from('product_images')
            .select('product_id, url')
            .in('product_id', productIds)
            .eq('is_primary', true);

        images?.forEach(img => { imageMap[img.product_id] = img.url; });
    }

    return (data || []).map(vc => {
        const product = vc.products as Record<string, unknown> | null;
        const reviewCount = Number(product?.review_count) || 0;
        return {
            id: vc.id,
            slug: (product?.slug as string) || '',
            beforeImage: vc.before_image,
            afterImage: vc.after_image,
            beforeLabel: vc.before_label || 'Day 1',
            afterLabel: vc.after_label || 'Day 30',
            productThumb: vc.product_id ? imageMap[vc.product_id] || '/no-image.svg' : '/no-image.svg',
            productName: (product?.name as string) || 'Product',
            rating: Number(product?.rating_avg) || 0,
            reviewCount: reviewCount >= 1000 ? `${(reviewCount / 1000).toFixed(1)}K` : String(reviewCount),
            price: Math.ceil(Number(product?.base_price) || 0),
            originalPrice: Math.ceil(Number(product?.compare_at_price) || 0),
            discountPercent: Number(product?.discount_percent) || 0,
        };
    }).filter(vc => vc.slug); // Only return items with linked products
}
