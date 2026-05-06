'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    ArrowLeft, Heart, Leaf, Shield, Sparkles, Users, TrendingUp,
    Award, Globe, ChevronRight, Star, Zap, Target, Package, Loader2,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

/* ─── Icon map ─── */
const iconMap: Record<string, React.ElementType> = {
    Award, Sparkles, Heart, TrendingUp, Leaf, Shield, Users, Globe,
    Star, Zap, Target, Package,
};
function Icon({ name, ...props }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) {
    const Comp = iconMap[name];
    return Comp ? <Comp {...props} /> : null;
}

/* ─── Types ─── */
interface HeroData { badge: string; title: string; description: string }
interface StatItem { value: string; label: string; icon: string }
interface ValueItem { icon: string; title: string; text: string }
interface BrandItem { name: string; tagline: string; description: string; color: string }
interface TimelineItem { year: string; event: string }
interface CtaData { title: string; description: string; primary_btn_text: string; primary_btn_link: string; secondary_btn_text: string; secondary_btn_link: string }

/* ─── Defaults (fallback if DB is empty) ─── */
const defaultHero: HeroData = { badge: 'About Us', title: 'Beauty rooted in <accent>science</accent>,<br/>driven by <accent>purpose</accent>.', description: 'ValleyCentia is the home of three distinct brands united by one belief: everyone deserves personal care that\'s honest, effective, and kind to the planet.' };
const defaultStats: StatItem[] = [
    { value: '3+', label: 'Premium Brands', icon: 'Award' },
    { value: '50+', label: 'Curated Products', icon: 'Sparkles' },
    { value: '1M+', label: 'Happy Customers', icon: 'Heart' },
    { value: '4.7', label: 'Avg Rating', icon: 'TrendingUp' },
];
const defaultValues: ValueItem[] = [
    { icon: 'Leaf', title: 'Clean Beauty', text: 'Every formula is free from harmful chemicals. We believe what you put on your body matters as much as what you put in it.' },
    { icon: 'Shield', title: 'Science-Backed', text: 'Our R&D lab combines cutting-edge dermatological research with potent botanicals for results you can see and feel.' },
    { icon: 'Users', title: 'Community First', text: 'Built with real feedback from real people. Our community of 1M+ drives every product decision we make.' },
    { icon: 'Globe', title: 'Sustainable Impact', text: 'From recyclable packaging to cruelty-free testing, sustainability isn\'t a buzzword — it\'s our baseline.' },
];
const defaultBrands: BrandItem[] = [
    { name: 'Bare Anatomy', tagline: 'Personalized hair & skin science', description: 'India\'s first personalized beauty brand. Every product is tailored to your unique hair and skin profile using our proprietary diagnostic quiz.', color: '#c9a96e' },
    { name: 'Chemist at Play', tagline: 'Actives that actually work', description: 'Clinical-grade active ingredients at honest prices. AHAs, BHAs, Niacinamide, Retinol — formulated for real results without the premium markup.', color: '#6ec9b0' },
    { name: 'Sun Scoop', tagline: 'Everyday sun protection, reimagined', description: 'Lightweight, invisible sunscreens that you\'ll actually want to wear. No white cast, no greasiness — just broad-spectrum protection all day.', color: '#f5c518' },
];
const defaultTimeline: TimelineItem[] = [
    { year: '2018', event: 'Bare Anatomy launches as India\'s first personalized hair care brand' },
    { year: '2020', event: 'Chemist at Play disrupts actives-based skincare with honest pricing' },
    { year: '2021', event: 'Sun Scoop enters the market, redefining everyday sun protection' },
    { year: '2022', event: 'Crossed 500K+ customers across all brands' },
    { year: '2023', event: 'ValleyCentia parent brand unifies the portfolio under one roof' },
    { year: '2024', event: 'Expanded to 50+ products with an average rating of 4.7 stars' },
];
const defaultCta: CtaData = { title: 'Join the ValleyCentia family', description: 'Whether you\'re shopping our products or exploring a career with us, we\'d love to have you.', primary_btn_text: 'Shop Now', primary_btn_link: '/shop', secondary_btn_text: 'View Careers', secondary_btn_link: '/careers' };

/* ─── Parse title with <accent> tags ─── */
function renderTitle(raw: string) {
    const parts = raw.split(/(<accent>.*?<\/accent>|<br\s*\/?>)/g);
    return parts.map((part, i) => {
        if (part.startsWith('<accent>')) return <span key={i} style={{ color: '#c9a96e' }}>{part.replace(/<\/?accent>/g, '')}</span>;
        if (part.match(/^<br\s*\/?>$/)) return <br key={i} />;
        return <span key={i}>{part}</span>;
    });
}

export default function AboutPage() {
    const [hero, setHero] = useState<HeroData>(defaultHero);
    const [stats, setStats] = useState<StatItem[]>(defaultStats);
    const [values, setValues] = useState<ValueItem[]>(defaultValues);
    const [brands, setBrands] = useState<BrandItem[]>(defaultBrands);
    const [timeline, setTimeline] = useState<TimelineItem[]>(defaultTimeline);
    const [cta, setCta] = useState<CtaData>(defaultCta);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const supabase = createClient();
                const { data } = await supabase.from('about_content').select('section_key, content');
                if (data) {
                    const map: Record<string, unknown> = {};
                    data.forEach((r: { section_key: string; content: unknown }) => { map[r.section_key] = r.content; });
                    if (map.hero) setHero(map.hero as HeroData);
                    if (map.stats) setStats(map.stats as StatItem[]);
                    if (map.values) setValues(map.values as ValueItem[]);
                    if (map.brands) setBrands(map.brands as BrandItem[]);
                    if (map.timeline) setTimeline(map.timeline as TimelineItem[]);
                    if (map.cta) setCta(map.cta as CtaData);
                }
            } catch { /* fallback to defaults */ }
            setLoaded(true);
        }
        load();
    }, []);

    if (!loaded) {
        return (
            <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                <Loader2 size={28} color="#c9a96e" style={{ animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ minHeight: '100vh', background: '#fafafa' }}>
            {/* ═══ Hero ═══ */}
            <section style={{
                background: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 50%, #1f1a12 100%)',
                padding: '56px 0 64px', position: 'relative', overflow: 'hidden',
            }}>
                <div style={{
                    position: 'absolute', top: '-40%', right: '-10%', width: 600, height: 600,
                    borderRadius: '50%', background: 'radial-gradient(circle, rgba(201,169,110,0.08) 0%, transparent 70%)',
                    pointerEvents: 'none',
                }} />
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px', position: 'relative' }}>
                    <Link href="/" style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6, color: '#777',
                        fontFamily: "'Inter', sans-serif", fontSize: 13, textDecoration: 'none',
                        marginBottom: 32, transition: 'color 0.2s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#777'; }}
                    >
                        <ArrowLeft size={16} /> Home
                    </Link>
                    <p style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
                        letterSpacing: 2.5, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 14,
                    }}>{hero.badge}</p>
                    <h1 style={{
                        fontFamily: "'Outfit', sans-serif", fontSize: 'clamp(32px, 5vw, 52px)',
                        fontWeight: 800, color: '#ffffff', lineHeight: 1.15, marginBottom: 20, maxWidth: 700,
                    }}>
                        {renderTitle(hero.title)}
                    </h1>
                    <p style={{
                        fontFamily: "'Inter', sans-serif", fontSize: 17, color: '#999',
                        lineHeight: 1.7, maxWidth: 600,
                    }}>{hero.description}</p>
                </div>
            </section>

            {/* ═══ Stats Strip ═══ */}
            <section style={{ background: '#ffffff', borderBottom: '1px solid #f0f0e8' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px', display: 'grid', gridTemplateColumns: `repeat(${stats.length}, 1fr)` }}>
                    {stats.map((s, i) => (
                        <div key={i} style={{
                            textAlign: 'center', padding: '36px 16px',
                            borderRight: i < stats.length - 1 ? '1px solid #f0f0e8' : 'none',
                        }}>
                            <Icon name={s.icon} size={22} color="#c9a96e" style={{ marginBottom: 10 }} />
                            <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 32, fontWeight: 800, color: '#1a1a1a', lineHeight: 1, marginBottom: 4 }}>{s.value}</p>
                            <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: '#888', fontWeight: 500 }}>{s.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ═══ Our Values ═══ */}
            <section style={{ padding: '72px 0' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 10 }}>
                        What We Stand For
                    </p>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, color: '#1a1a1a', marginBottom: 40 }}>
                        Our Core Values
                    </h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                        {values.map((v, i) => (
                            <div key={i} style={{
                                background: '#ffffff', border: '1px solid #f0f0e8', borderRadius: 14,
                                padding: 32, transition: 'box-shadow 0.25s ease, transform 0.25s ease', cursor: 'default',
                            }}
                                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(-3px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{ width: 44, height: 44, borderRadius: 10, background: '#faf6ee', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                                    <Icon name={v.icon} size={22} color="#c9a96e" />
                                </div>
                                <h3 style={{ fontFamily: "'Inter', sans-serif", fontSize: 17, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>{v.title}</h3>
                                <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#777', lineHeight: 1.65 }}>{v.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Our Brands ═══ */}
            <section style={{ background: 'linear-gradient(135deg, #0a0a0b 0%, #1a1a1a 100%)', padding: '72px 0' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 10 }}>Our Portfolio</p>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, color: '#ffffff', marginBottom: 40 }}>Three Brands, One Mission</h2>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {brands.map((b, i) => (
                            <Link key={i} href={`/shop?brand=${b.name.toLowerCase().replace(/ /g, '-')}`}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: 28,
                                    background: '#1d1d1d', border: '1px solid #2a2a2a', borderRadius: 14,
                                    padding: '32px 36px', textDecoration: 'none', color: 'inherit',
                                    transition: 'border-color 0.25s ease, transform 0.25s ease',
                                }}
                                onMouseEnter={e => { e.currentTarget.style.borderColor = b.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.transform = 'translateY(0)'; }}
                            >
                                <div style={{
                                    width: 64, height: 64, borderRadius: 14,
                                    background: `linear-gradient(135deg, ${b.color}22, ${b.color}44)`,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                }}>
                                    <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 800, color: b.color }}>{b.name.charAt(0)}</span>
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h3 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 20, fontWeight: 700, color: '#ffffff', marginBottom: 4 }}>{b.name}</h3>
                                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, color: b.color, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 8 }}>{b.tagline}</p>
                                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: '#888', lineHeight: 1.6 }}>{b.description}</p>
                                </div>
                                <ChevronRight size={20} color="#555" style={{ flexShrink: 0 }} />
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ Our Journey ═══ */}
            <section style={{ padding: '72px 0' }}>
                <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: 2, textTransform: 'uppercase', color: '#c9a96e', marginBottom: 10 }}>Our Story</p>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 30, fontWeight: 700, color: '#1a1a1a', marginBottom: 40 }}>The Journey So Far</h2>
                    <div style={{ position: 'relative', paddingLeft: 32 }}>
                        <div style={{ position: 'absolute', left: 7, top: 8, bottom: 8, width: 2, background: 'linear-gradient(180deg, #c9a96e, #e8d5b0)', borderRadius: 1 }} />
                        {timeline.map((item, i) => (
                            <div key={i} style={{ position: 'relative', marginBottom: i < timeline.length - 1 ? 28 : 0 }}>
                                <div style={{ position: 'absolute', left: -28, top: 6, width: 12, height: 12, borderRadius: '50%', background: '#c9a96e', border: '3px solid #faf6ee', boxShadow: '0 0 0 2px #c9a96e' }} />
                                <span style={{ fontFamily: "'Outfit', sans-serif", fontSize: 14, fontWeight: 800, color: '#c9a96e', marginRight: 12 }}>{item.year}</span>
                                <span style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#555', lineHeight: 1.6 }}>{item.event}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ CTA ═══ */}
            <section style={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2a2218 100%)', padding: '64px 0', textAlign: 'center' }}>
                <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 32px' }}>
                    <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, fontWeight: 700, color: '#ffffff', marginBottom: 12 }}>{cta.title}</h2>
                    <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 15, color: '#888', marginBottom: 28, lineHeight: 1.6 }}>{cta.description}</p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                        <Link href={cta.primary_btn_link} style={{
                            fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                            color: '#1a1a1a', background: '#f5c518', padding: '13px 32px',
                            borderRadius: 28, textDecoration: 'none', transition: 'background 0.2s ease, transform 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#e6b800'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = '#f5c518'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >{cta.primary_btn_text}</Link>
                        <Link href={cta.secondary_btn_link} style={{
                            fontFamily: "'Inter', sans-serif", fontSize: 14, fontWeight: 700,
                            color: '#ffffff', background: 'transparent', padding: '13px 32px',
                            borderRadius: 28, border: '1px solid #444', textDecoration: 'none',
                            transition: 'border-color 0.2s ease, transform 0.2s ease',
                        }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#c9a96e'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.transform = 'translateY(0)'; }}
                        >{cta.secondary_btn_text}</Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
