import { createClient } from './client';

// ============================================================================
// TYPES
// ============================================================================

export interface AdminProduct {
    id: string;
    name: string;
    slug: string;
    subtitle: string | null;
    short_description: string | null;
    description: string | null;
    how_to_use: string | null;
    ingredients: string | null;
    base_price: number;
    compare_at_price: number | null;
    discount_percent: number;
    cost_price: number | null;
    sku: string | null;
    barcode: string | null;
    weight_grams: number | null;
    is_active: boolean;
    is_featured: boolean;
    in_stock: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    rating_avg: number;
    review_count: number;
    meta_title: string | null;
    meta_description: string | null;
    tags: string[] | null;
    concerns: string[] | null;
    brand_id: string | null;
    category_id: string | null;
    created_at: string;
    updated_at: string;
    // Joined
    brand_name?: string | null;
    category_name?: string | null;
    primary_image_url?: string | null;
}

export interface AdminProductFull extends AdminProduct {
    images: { id?: string; url: string; alt_text: string | null; is_primary: boolean; sort_order: number }[];
    sizes: { id?: string; label: string; ml_value: string | null; price: number; sku_suffix: string | null; stock_quantity: number; is_default: boolean; is_active: boolean; sort_order: number }[];
    key_benefits: { id?: string; icon_name: string; title: string; description: string; sort_order: number }[];
    highlights: { id?: string; highlight: string; sort_order: number }[];
    badges: { id?: string; badge: string; custom_label: string | null; badge_color: string | null; is_primary: boolean }[];
    section_ids: string[];
}

export interface ProductFormData {
    name: string;
    slug: string;
    subtitle: string;
    short_description: string;
    description: string;
    how_to_use: string;
    ingredients: string;
    base_price: number;
    discount_percent: number;
    cost_price: number | null;
    sku: string;
    barcode: string;
    weight_grams: number | null;
    is_active: boolean;
    is_featured: boolean;
    in_stock: boolean;
    stock_quantity: number;
    low_stock_threshold: number;
    meta_title: string;
    meta_description: string;
    tags: string[];
    concerns: string[];
    brand_id: string | null;
    category_id: string | null;
    images: { url: string; alt_text: string; is_primary: boolean; sort_order: number }[];
    sizes: { label: string; ml_value: string; price: number; sku_suffix: string; stock_quantity: number; is_default: boolean; is_active: boolean; sort_order: number }[];
    key_benefits: { icon_name: string; title: string; description: string; sort_order: number }[];
    highlights: { highlight: string; sort_order: number }[];
    badges: { badge: string; custom_label: string; badge_color: string; is_primary: boolean }[];
    section_ids: string[];
}

export interface BrandOption {
    id: string;
    name: string;
    slug: string;
}

export interface CategoryOption {
    id: string;
    name: string;
    slug: string;
    parent_id: string | null;
}

export interface SectionOption {
    id: string;
    title: string;
    section_type: string;
}

// ============================================================================
// HELPERS
// ============================================================================

function getSupabase() {
    return createClient();
}

// ============================================================================
// READ — LIST ALL PRODUCTS
// ============================================================================

export async function getAdminProducts(): Promise<AdminProduct[]> {
    const supabase = getSupabase();

    const { data: products, error } = await supabase
        .from('products')
        .select(`
            *,
            brands!left(name),
            categories!left(name)
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching admin products:', error);
        return [];
    }

    // Get primary images for all products
    const productIds = (products || []).map(p => p.id);
    const { data: images } = await supabase
        .from('product_images')
        .select('product_id, url')
        .in('product_id', productIds)
        .eq('is_primary', true);

    const imageMap: Record<string, string> = {};
    images?.forEach(img => { imageMap[img.product_id] = img.url; });

    return (products || []).map(p => ({
        ...p,
        brand_name: (p.brands as Record<string, string> | null)?.name || null,
        category_name: (p.categories as Record<string, string> | null)?.name || null,
        primary_image_url: imageMap[p.id] || null,
    }));
}

// ============================================================================
// READ — SINGLE PRODUCT WITH ALL RELATIONS
// ============================================================================

export async function getAdminProductById(id: string): Promise<AdminProductFull | null> {
    const supabase = getSupabase();

    // Get base product
    const { data: product, error } = await supabase
        .from('products')
        .select(`
            *,
            brands!left(name),
            categories!left(name)
        `)
        .eq('id', id)
        .single();

    if (error || !product) {
        console.error('Error fetching product:', error);
        return null;
    }

    // Parallel fetch all relations
    const [imagesRes, sizesRes, benefitsRes, highlightsRes, badgesRes, sectionProductsRes] = await Promise.all([
        supabase.from('product_images').select('*').eq('product_id', id).order('sort_order'),
        supabase.from('product_sizes').select('*').eq('product_id', id).order('sort_order'),
        supabase.from('product_key_benefits').select('*').eq('product_id', id).order('sort_order'),
        supabase.from('product_highlights').select('*').eq('product_id', id).order('sort_order'),
        supabase.from('product_badges').select('*').eq('product_id', id),
        supabase.from('homepage_section_products').select('section_id').eq('product_id', id),
    ]);

    return {
        ...product,
        brand_name: (product.brands as Record<string, string> | null)?.name || null,
        category_name: (product.categories as Record<string, string> | null)?.name || null,
        primary_image_url: imagesRes.data?.find(i => i.is_primary)?.url || imagesRes.data?.[0]?.url || null,
        images: imagesRes.data || [],
        sizes: sizesRes.data || [],
        key_benefits: benefitsRes.data || [],
        highlights: highlightsRes.data || [],
        badges: badgesRes.data || [],
        section_ids: (sectionProductsRes.data || []).map(sp => sp.section_id),
    };
}

// ============================================================================
// CREATE PRODUCT
// ============================================================================

export async function createProduct(data: ProductFormData): Promise<{ id: string | null; error: string | null }> {
    const supabase = getSupabase();

    // 1. Insert product
    const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
            name: data.name,
            slug: data.slug,
            subtitle: data.subtitle || null,
            short_description: data.short_description || null,
            description: data.description || null,
            how_to_use: data.how_to_use || null,
            ingredients: data.ingredients || null,
            base_price: data.base_price,
            compare_at_price: data.discount_percent > 0 ? Math.round(data.base_price / (1 - data.discount_percent / 100) * 100) / 100 : null,
            discount_percent: data.discount_percent || 0,
            cost_price: data.cost_price,
            sku: data.sku || null,
            barcode: data.barcode || null,
            weight_grams: data.weight_grams,
            is_active: data.is_active,
            is_featured: data.is_featured,
            in_stock: data.in_stock,
            stock_quantity: data.stock_quantity || 0,
            low_stock_threshold: data.low_stock_threshold || 5,
            meta_title: data.meta_title || null,
            meta_description: data.meta_description || null,
            tags: data.tags.length > 0 ? data.tags : null,
            concerns: data.concerns.length > 0 ? data.concerns : null,
            brand_id: data.brand_id,
            category_id: data.category_id,
        })
        .select('id')
        .single();

    if (productError || !product) {
        console.error('Product creation error:', productError);
        return { id: null, error: productError?.message || 'Failed to create product' };
    }

    const productId = product.id;

    // 2. Insert related data in parallel
    const promises: PromiseLike<unknown>[] = [];

    if (data.images.length > 0) {
        promises.push(
            supabase.from('product_images').insert(
                data.images.map(img => ({ ...img, product_id: productId }))
            ).then()
        );
    }

    if (data.sizes.length > 0) {
        promises.push(
            supabase.from('product_sizes').insert(
                data.sizes.map(s => ({ ...s, product_id: productId }))
            ).then()
        );
    }

    if (data.key_benefits.length > 0) {
        promises.push(
            supabase.from('product_key_benefits').insert(
                data.key_benefits.map(b => ({ ...b, product_id: productId }))
            ).then()
        );
    }

    if (data.highlights.length > 0) {
        promises.push(
            supabase.from('product_highlights').insert(
                data.highlights.map(h => ({ ...h, product_id: productId }))
            ).then()
        );
    }

    if (data.badges.length > 0) {
        promises.push(
            supabase.from('product_badges').insert(
                data.badges.map(b => ({ ...b, product_id: productId }))
            ).then()
        );
    }

    if (data.section_ids && data.section_ids.length > 0) {
        promises.push(
            supabase.from('homepage_section_products').insert(
                data.section_ids.map((sectionId, idx) => ({
                    section_id: sectionId,
                    product_id: productId,
                    sort_order: idx,
                }))
            ).then(({ error: secErr }) => {
                if (secErr) console.error('Error inserting section assignments:', secErr);
            })
        );
    }

    await Promise.all(promises);

    return { id: productId, error: null };
}

// ============================================================================
// UPDATE PRODUCT
// ============================================================================

export async function updateProduct(id: string, data: ProductFormData): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    // 1. Update base product
    const { error: productError } = await supabase
        .from('products')
        .update({
            name: data.name,
            slug: data.slug,
            subtitle: data.subtitle || null,
            short_description: data.short_description || null,
            description: data.description || null,
            how_to_use: data.how_to_use || null,
            ingredients: data.ingredients || null,
            base_price: data.base_price,
            compare_at_price: data.discount_percent > 0 ? Math.round(data.base_price / (1 - data.discount_percent / 100) * 100) / 100 : null,
            discount_percent: data.discount_percent || 0,
            cost_price: data.cost_price,
            sku: data.sku || null,
            barcode: data.barcode || null,
            weight_grams: data.weight_grams,
            is_active: data.is_active,
            is_featured: data.is_featured,
            in_stock: data.in_stock,
            stock_quantity: data.stock_quantity || 0,
            low_stock_threshold: data.low_stock_threshold || 5,
            meta_title: data.meta_title || null,
            meta_description: data.meta_description || null,
            tags: data.tags.length > 0 ? data.tags : null,
            concerns: data.concerns.length > 0 ? data.concerns : null,
            brand_id: data.brand_id,
            category_id: data.category_id,
        })
        .eq('id', id);

    if (productError) {
        return { error: productError.message };
    }

    // 2. Delete all related data and re-insert (simplest approach for nested arrays)
    await Promise.all([
        Promise.resolve(supabase.from('product_images').delete().eq('product_id', id)),
        Promise.resolve(supabase.from('product_sizes').delete().eq('product_id', id)),
        Promise.resolve(supabase.from('product_key_benefits').delete().eq('product_id', id)),
        Promise.resolve(supabase.from('product_highlights').delete().eq('product_id', id)),
        Promise.resolve(supabase.from('product_badges').delete().eq('product_id', id)),
        Promise.resolve(supabase.from('homepage_section_products').delete().eq('product_id', id)),
    ]);

    // 3. Re-insert related data
    const promises: PromiseLike<unknown>[] = [];

    if (data.images.length > 0) {
        promises.push(
            supabase.from('product_images').insert(
                data.images.map(img => ({ ...img, product_id: id }))
            ).then()
        );
    }

    if (data.sizes.length > 0) {
        promises.push(
            supabase.from('product_sizes').insert(
                data.sizes.map(s => ({ ...s, product_id: id }))
            ).then()
        );
    }

    if (data.key_benefits.length > 0) {
        promises.push(
            supabase.from('product_key_benefits').insert(
                data.key_benefits.map(b => ({ ...b, product_id: id }))
            ).then()
        );
    }

    if (data.highlights.length > 0) {
        promises.push(
            supabase.from('product_highlights').insert(
                data.highlights.map(h => ({ ...h, product_id: id }))
            ).then()
        );
    }

    if (data.badges.length > 0) {
        promises.push(
            supabase.from('product_badges').insert(
                data.badges.map(b => ({ ...b, product_id: id }))
            ).then()
        );
    }

    if (data.section_ids && data.section_ids.length > 0) {
        promises.push(
            supabase.from('homepage_section_products').insert(
                data.section_ids.map((sectionId, idx) => ({
                    section_id: sectionId,
                    product_id: id,
                    sort_order: idx,
                }))
            ).then(({ error: secErr }) => {
                if (secErr) console.error('Error inserting section assignments:', secErr);
            })
        );
    }

    await Promise.all(promises);

    return { error: null };
}

// ============================================================================
// DELETE PRODUCT
// ============================================================================

export async function deleteProduct(id: string): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

    if (error) {
        return { error: error.message };
    }
    return { error: null };
}

// ============================================================================
// BRANDS & CATEGORIES (for dropdowns)
// ============================================================================

export async function getBrandsAndCategories(): Promise<{ brands: BrandOption[]; categories: CategoryOption[]; sections: SectionOption[] }> {
    const supabase = getSupabase();

    const [brandsRes, categoriesRes, sectionsRes] = await Promise.all([
        supabase.from('brands').select('id, name, slug').eq('is_active', true).order('name'),
        supabase.from('categories').select('id, name, slug, parent_id').eq('is_active', true).order('name'),
        supabase.from('homepage_sections').select('id, title, section_type').eq('is_active', true).order('sort_order'),
    ]);

    return {
        brands: brandsRes.data || [],
        categories: categoriesRes.data || [],
        sections: (sectionsRes.data || []) as SectionOption[],
    };
}

// ============================================================================
// BRAND TYPES
// ============================================================================

export interface AdminBrand {
    id: string;
    name: string;
    slug: string;
    tagline: string | null;
    description: string | null;
    logo_url: string | null;
    accent_color: string | null;
    text_color: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
}

export interface BrandFormData {
    name: string;
    slug: string;
    tagline: string;
    description: string;
    logo_url: string;
    accent_color: string;
    text_color: string;
    is_active: boolean;
    sort_order: number;
}

// ============================================================================
// BRANDS CRUD
// ============================================================================

export async function getAdminBrands(): Promise<AdminBrand[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

    if (error) {
        console.error('Error fetching brands:', error);
        return [];
    }

    return (data || []) as AdminBrand[];
}

export async function createBrand(data: BrandFormData): Promise<{ id: string | null; error: string | null }> {
    const supabase = getSupabase();

    const { data: brand, error } = await supabase
        .from('brands')
        .insert({
            name: data.name,
            slug: data.slug,
            tagline: data.tagline || null,
            description: data.description || null,
            logo_url: data.logo_url || null,
            accent_color: data.accent_color || null,
            text_color: data.text_color || null,
            is_active: data.is_active,
            sort_order: data.sort_order,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating brand:', error);
        return { id: null, error: error.message };
    }

    return { id: brand?.id || null, error: null };
}

export async function updateBrand(id: string, data: BrandFormData): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('brands')
        .update({
            name: data.name,
            slug: data.slug,
            tagline: data.tagline || null,
            description: data.description || null,
            logo_url: data.logo_url || null,
            accent_color: data.accent_color || null,
            text_color: data.text_color || null,
            is_active: data.is_active,
            sort_order: data.sort_order,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating brand:', error);
        return { error: error.message };
    }

    return { error: null };
}

export async function deleteBrand(id: string): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('brands')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting brand:', error);
        return { error: error.message };
    }

    return { error: null };
}

// ============================================================================
// SECTION TYPES
// ============================================================================

export interface AdminSection {
    id: string;
    section_type: string;
    title: string;
    subtitle: string | null;
    badge_text: string | null;
    cta_text: string | null;
    cta_link: string | null;
    background_color: string | null;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    product_count?: number;
}

export interface SectionFormData {
    section_type: string;
    title: string;
    subtitle: string;
    badge_text: string;
    cta_text: string;
    cta_link: string;
    background_color: string;
    is_active: boolean;
    sort_order: number;
}

// ============================================================================
// SECTIONS CRUD
// ============================================================================

export async function getAdminSections(): Promise<AdminSection[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('homepage_sections')
        .select('*')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching sections:', error);
        return [];
    }

    const sections = (data || []) as AdminSection[];

    // Get product counts
    for (const section of sections) {
        const { count } = await supabase
            .from('homepage_section_products')
            .select('*', { count: 'exact', head: true })
            .eq('section_id', section.id);
        section.product_count = count || 0;
    }

    return sections;
}

export async function createSection(data: SectionFormData): Promise<{ id: string | null; error: string | null }> {
    const supabase = getSupabase();

    const { data: section, error } = await supabase
        .from('homepage_sections')
        .insert({
            section_type: data.section_type,
            title: data.title,
            subtitle: data.subtitle || null,
            badge_text: data.badge_text || null,
            cta_text: data.cta_text || null,
            cta_link: data.cta_link || null,
            background_color: data.background_color || null,
            is_active: data.is_active,
            sort_order: data.sort_order,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating section:', error);
        return { id: null, error: error.message };
    }

    return { id: section?.id || null, error: null };
}

export async function updateSection(id: string, data: SectionFormData): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('homepage_sections')
        .update({
            section_type: data.section_type,
            title: data.title,
            subtitle: data.subtitle || null,
            badge_text: data.badge_text || null,
            cta_text: data.cta_text || null,
            cta_link: data.cta_link || null,
            background_color: data.background_color || null,
            is_active: data.is_active,
            sort_order: data.sort_order,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating section:', error);
        return { error: error.message };
    }

    return { error: null };
}

export async function deleteSection(id: string): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('homepage_sections')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting section:', error);
        return { error: error.message };
    }

    return { error: null };
}

// ============================================================================
// HERO SLIDE TYPES
// ============================================================================

export interface AdminHeroSlide {
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
    is_active: boolean;
    sort_order: number;
    starts_at: string | null;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface HeroSlideFormData {
    title: string;
    subtitle: string;
    cta_text: string;
    cta_link: string;
    image_url: string;
    mobile_image_url: string;
    image_alt: string;
    background_color: string;
    text_color: string;
    is_active: boolean;
    sort_order: number;
}

// ============================================================================
// HERO SLIDES CRUD
// ============================================================================

export async function getAdminHeroSlides(): Promise<AdminHeroSlide[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('hero_slides')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching hero slides:', error);
        return [];
    }

    return (data || []) as AdminHeroSlide[];
}

export async function createHeroSlide(data: HeroSlideFormData): Promise<{ id: string | null; error: string | null }> {
    const supabase = getSupabase();

    const { data: slide, error } = await supabase
        .from('hero_slides')
        .insert({
            title: data.title,
            subtitle: data.subtitle || null,
            cta_text: data.cta_text || null,
            cta_link: data.cta_link || null,
            image_url: data.image_url,
            mobile_image_url: data.mobile_image_url || null,
            image_alt: data.image_alt || null,
            background_color: data.background_color || null,
            text_color: data.text_color || '#ffffff',
            is_active: data.is_active,
            sort_order: data.sort_order,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating hero slide:', error);
        return { id: null, error: error.message };
    }

    return { id: slide?.id || null, error: null };
}

export async function updateHeroSlide(id: string, data: HeroSlideFormData): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('hero_slides')
        .update({
            title: data.title,
            subtitle: data.subtitle || null,
            cta_text: data.cta_text || null,
            cta_link: data.cta_link || null,
            image_url: data.image_url,
            mobile_image_url: data.mobile_image_url || null,
            image_alt: data.image_alt || null,
            background_color: data.background_color || null,
            text_color: data.text_color || '#ffffff',
            is_active: data.is_active,
            sort_order: data.sort_order,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating hero slide:', error);
        return { error: error.message };
    }

    return { error: null };
}

export async function deleteHeroSlide(id: string): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('hero_slides')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting hero slide:', error);
        return { error: error.message };
    }

    return { error: null };
}

// ============================================================================
// ABOUT CONTENT
// ============================================================================

export interface AboutContentMap {
    [key: string]: unknown;
}

export async function getAboutContent(): Promise<AboutContentMap> {
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('about_content')
        .select('section_key, content');

    if (error) {
        console.error('Error fetching about content:', error);
        return {};
    }

    const map: AboutContentMap = {};
    (data || []).forEach((row: { section_key: string; content: unknown }) => {
        map[row.section_key] = row.content;
    });
    return map;
}

export async function updateAboutSection(
    sectionKey: string,
    content: unknown
): Promise<{ error: string | null }> {
    const supabase = getSupabase();
    const { error } = await supabase
        .from('about_content')
        .upsert(
            { section_key: sectionKey, content, updated_at: new Date().toISOString() },
            { onConflict: 'section_key' }
        );

    if (error) {
        console.error('Error updating about section:', error);
        return { error: error.message };
    }
    return { error: null };
}

// ============================================================================
// NAV LINK TYPES
// ============================================================================

export interface AdminNavLink {
    id: string;
    parent_id: string | null;
    label: string;
    href: string;
    highlight: boolean;
    is_active: boolean;
    sort_order: number;
    linked_category_id: string | null;
    linked_category_name?: string | null;
    created_at: string;
    updated_at: string;
    children?: AdminNavLink[];
}

export interface NavLinkFormData {
    parent_id: string | null;
    label: string;
    href: string;
    highlight: boolean;
    is_active: boolean;
    sort_order: number;
    linked_category_id: string | null;
}

// ============================================================================
// NAV LINKS CRUD
// ============================================================================

export async function getAdminNavLinks(): Promise<AdminNavLink[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('nav_links')
        .select('*, categories!nav_links_linked_category_id_fkey(name)')
        .order('sort_order', { ascending: true });

    if (error) {
        console.error('Error fetching nav links:', error);
        return [];
    }

    const all = (data || []).map((n: Record<string, unknown>) => ({
        ...n,
        linked_category_name: (n.categories as Record<string, string> | null)?.name || null,
    })) as AdminNavLink[];

    // Build tree: top-level items with children nested
    const topLevel = all.filter(n => !n.parent_id);
    const children = all.filter(n => n.parent_id);

    for (const parent of topLevel) {
        parent.children = children
            .filter(c => c.parent_id === parent.id)
            .sort((a, b) => a.sort_order - b.sort_order);
    }

    return topLevel;
}

export async function createNavLink(data: NavLinkFormData): Promise<{ id: string | null; error: string | null }> {
    const supabase = getSupabase();

    const { data: link, error } = await supabase
        .from('nav_links')
        .insert({
            parent_id: data.parent_id || null,
            label: data.label,
            href: data.href,
            highlight: data.highlight,
            is_active: data.is_active,
            sort_order: data.sort_order,
            linked_category_id: data.linked_category_id || null,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating nav link:', error);
        return { id: null, error: error.message };
    }

    return { id: link?.id || null, error: null };
}

export async function updateNavLink(id: string, data: NavLinkFormData): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('nav_links')
        .update({
            parent_id: data.parent_id || null,
            label: data.label,
            href: data.href,
            highlight: data.highlight,
            is_active: data.is_active,
            sort_order: data.sort_order,
            linked_category_id: data.linked_category_id || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating nav link:', error);
        return { error: error.message };
    }

    return { error: null };
}

export async function deleteNavLink(id: string): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('nav_links')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting nav link:', error);
        return { error: error.message };
    }

    return { error: null };
}

// ============================================================================
// SITE SETTINGS (ADMIN)
// ============================================================================

export interface SiteSettingRow {
    key: string;
    value: Record<string, unknown>;
    description: string | null;
    updated_at: string;
}

export async function getAdminSiteSettings(): Promise<SiteSettingRow[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .order('key', { ascending: true });

    if (error) {
        console.error('Error fetching site settings:', error);
        return [];
    }

    return (data || []) as SiteSettingRow[];
}

export async function updateSiteSetting(key: string, value: Record<string, unknown>): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('site_settings')
        .update({
            value,
            updated_at: new Date().toISOString(),
        })
        .eq('key', key);

    if (error) {
        console.error('Error updating site setting:', error);
        return { error: error.message };
    }

    return { error: null };
}

// ============================================================================
// COUPONS CRUD (ADMIN)
// ============================================================================

export interface AdminCoupon {
    id: string;
    code: string;
    description: string | null;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    minimum_order_value: number;
    max_discount_amount: number | null;
    usage_limit: number | null;
    usage_count: number;
    per_user_limit: number;
    is_active: boolean;
    starts_at: string;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface CouponFormData {
    code: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    minimum_order_value: number;
    max_discount_amount: number | null;
    usage_limit: number | null;
    per_user_limit: number;
    is_active: boolean;
    expires_at: string;
}

export async function getAdminCoupons(): Promise<AdminCoupon[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching coupons:', error);
        return [];
    }

    return (data || []) as AdminCoupon[];
}

export async function createCoupon(data: CouponFormData): Promise<{ id: string | null; error: string | null }> {
    const supabase = getSupabase();

    const { data: coupon, error } = await supabase
        .from('coupons')
        .insert({
            code: data.code.toUpperCase().trim(),
            description: data.description || null,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            minimum_order_value: data.minimum_order_value || 0,
            max_discount_amount: data.max_discount_amount || null,
            usage_limit: data.usage_limit || null,
            per_user_limit: data.per_user_limit || 1,
            is_active: data.is_active,
            expires_at: data.expires_at || null,
        })
        .select('id')
        .single();

    if (error) {
        console.error('Error creating coupon:', error);
        return { id: null, error: error.message };
    }

    return { id: coupon?.id || null, error: null };
}

export async function updateCoupon(id: string, data: CouponFormData): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('coupons')
        .update({
            code: data.code.toUpperCase().trim(),
            description: data.description || null,
            discount_type: data.discount_type,
            discount_value: data.discount_value,
            minimum_order_value: data.minimum_order_value || 0,
            max_discount_amount: data.max_discount_amount || null,
            usage_limit: data.usage_limit || null,
            per_user_limit: data.per_user_limit || 1,
            is_active: data.is_active,
            expires_at: data.expires_at || null,
            updated_at: new Date().toISOString(),
        })
        .eq('id', id);

    if (error) {
        console.error('Error updating coupon:', error);
        return { error: error.message };
    }

    return { error: null };
}

export async function deleteCoupon(id: string): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting coupon:', error);
        return { error: error.message };
    }

    return { error: null };
}

// ============================================================================
// VISIBLE CHANGE TYPES
// ============================================================================

export interface AdminVisibleChange {
    id: string;
    product_id: string | null;
    before_image: string;
    after_image: string;
    before_label: string;
    after_label: string;
    is_active: boolean;
    sort_order: number;
    created_at: string;
    updated_at: string;
    // Joined product fields
    product_name?: string | null;
    product_slug?: string | null;
    product_image?: string | null;
    product_price?: number | null;
    product_original_price?: number | null;
    product_discount_percent?: number | null;
    product_rating?: number | null;
    product_review_count?: number | null;
}

export interface VisibleChangeFormData {
    product_id: string | null;
    before_image: string;
    after_image: string;
    before_label: string;
    after_label: string;
    is_active: boolean;
    sort_order: number;
}

// ============================================================================
// VISIBLE CHANGES CRUD
// ============================================================================

export async function getAdminVisibleChanges(): Promise<AdminVisibleChange[]> {
    const supabase = getSupabase();

    const { data, error } = await supabase
        .from('visible_changes')
        .select(`
            *,
            products!left(name, slug, base_price, compare_at_price, discount_percent, rating_avg, review_count)
        `)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

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
        return {
            id: vc.id,
            product_id: vc.product_id,
            before_image: vc.before_image,
            after_image: vc.after_image,
            before_label: vc.before_label || 'Day 1',
            after_label: vc.after_label || 'Day 30',
            is_active: vc.is_active,
            sort_order: vc.sort_order,
            created_at: vc.created_at,
            updated_at: vc.updated_at,
            product_name: product?.name as string | null,
            product_slug: product?.slug as string | null,
            product_image: vc.product_id ? imageMap[vc.product_id] || null : null,
            product_price: product?.base_price as number | null,
            product_original_price: product?.compare_at_price as number | null,
            product_discount_percent: product?.discount_percent as number | null,
            product_rating: product?.rating_avg as number | null,
            product_review_count: product?.review_count as number | null,
        };
    });
}

export async function createVisibleChange(data: VisibleChangeFormData): Promise<{ id: string | null; error: string | null }> {
    try {
        const supabase = getSupabase();

        const { data: vc, error } = await supabase
            .from('visible_changes')
            .insert({
                product_id: data.product_id || null,
                before_image: data.before_image,
                after_image: data.after_image,
                before_label: data.before_label || 'Day 1',
                after_label: data.after_label || 'Day 30',
                is_active: data.is_active,
                sort_order: data.sort_order,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating visible change:', error);
            return { id: null, error: error.message || 'Unknown database error' };
        }

        return { id: vc?.id || null, error: null };
    } catch (err: any) {
        console.error('Exception in createVisibleChange:', err);
        return { id: null, error: err?.message || String(err) };
    }
}

export async function updateVisibleChange(id: string, data: VisibleChangeFormData): Promise<{ error: string | null }> {
    try {
        const supabase = getSupabase();

        const { error } = await supabase
            .from('visible_changes')
            .update({
                product_id: data.product_id || null,
                before_image: data.before_image,
                after_image: data.after_image,
                before_label: data.before_label || 'Day 1',
                after_label: data.after_label || 'Day 30',
                is_active: data.is_active,
                sort_order: data.sort_order,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id);

        if (error) {
            console.error('Error updating visible change:', error);
            return { error: error.message || 'Unknown database error' };
        }

        return { error: null };
    } catch (err: any) {
        console.error('Exception in updateVisibleChange:', err);
        return { error: err?.message || String(err) };
    }
}

export async function deleteVisibleChange(id: string): Promise<{ error: string | null }> {
    const supabase = getSupabase();

    const { error } = await supabase
        .from('visible_changes')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting visible change:', error);
        return { error: error.message };
    }

    return { error: null };
}
