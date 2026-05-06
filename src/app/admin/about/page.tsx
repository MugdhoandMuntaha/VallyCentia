'use client';

import React, { useEffect, useState } from 'react';
import {
    Save, Loader2, Plus, Trash2, ChevronDown, ChevronUp, Check, AlertCircle,
} from 'lucide-react';
import { getAboutContent, updateAboutSection } from '@/lib/supabase/adminQueries';

/* ===== Types ===== */
interface HeroData { badge: string; title: string; description: string }
interface StatItem { value: string; label: string; icon: string }
interface ValueItem { icon: string; title: string; text: string }
interface BrandItem { name: string; tagline: string; description: string; color: string }
interface TimelineItem { year: string; event: string }
interface CtaData { title: string; description: string; primary_btn_text: string; primary_btn_link: string; secondary_btn_text: string; secondary_btn_link: string }

const iconOptions = ['Award', 'Sparkles', 'Heart', 'TrendingUp', 'Leaf', 'Shield', 'Users', 'Globe', 'Star', 'Zap', 'Target', 'Package'];

/* ===== Defaults ===== */
const defaultHero: HeroData = { badge: 'About Us', title: 'Beauty rooted in <accent>science</accent>,<br/>driven by <accent>purpose</accent>.', description: '' };
const defaultCta: CtaData = { title: '', description: '', primary_btn_text: 'Shop Now', primary_btn_link: '/shop', secondary_btn_text: 'View Careers', secondary_btn_link: '/careers' };

export default function AdminAboutPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<string | null>(null);
    const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

    // Section states
    const [hero, setHero] = useState<HeroData>(defaultHero);
    const [stats, setStats] = useState<StatItem[]>([]);
    const [values, setValues] = useState<ValueItem[]>([]);
    const [brands, setBrands] = useState<BrandItem[]>([]);
    const [timeline, setTimeline] = useState<TimelineItem[]>([]);
    const [cta, setCta] = useState<CtaData>(defaultCta);

    // Expanded panels
    const [expanded, setExpanded] = useState<string>('hero');

    useEffect(() => { loadContent(); }, []);

    async function loadContent() {
        setLoading(true);
        const data = await getAboutContent();
        if (data.hero) setHero(data.hero as HeroData);
        if (data.stats) setStats(data.stats as StatItem[]);
        if (data.values) setValues(data.values as ValueItem[]);
        if (data.brands) setBrands(data.brands as BrandItem[]);
        if (data.timeline) setTimeline(data.timeline as TimelineItem[]);
        if (data.cta) setCta(data.cta as CtaData);
        setLoading(false);
    }

    async function saveSection(key: string, content: unknown) {
        setSaving(key);
        const res = await updateAboutSection(key, content);
        setSaving(null);
        if (res.error) { flash('err', res.error); }
        else { flash('ok', `${key.charAt(0).toUpperCase() + key.slice(1)} saved!`); }
    }

    function flash(type: 'ok' | 'err', text: string) {
        setMsg({ type, text });
        setTimeout(() => setMsg(null), 3000);
    }

    function toggle(key: string) { setExpanded(prev => prev === key ? '' : key); }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 80 }}>
                <Loader2 size={28} style={{ color: 'var(--color-accent)', animation: 'spin 1s linear infinite' }} />
            </div>
        );
    }

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
                <div>
                    <h1 style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Outfit', sans-serif", marginBottom: 4 }}>About Page</h1>
                    <p style={{ color: 'var(--color-text-muted)', fontSize: 14 }}>Customize all sections of the About page</p>
                </div>
            </div>

            {msg && (
                <div style={{
                    padding: '10px 16px', borderRadius: 8, marginBottom: 16, fontSize: 13, fontWeight: 500,
                    display: 'flex', alignItems: 'center', gap: 8,
                    background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                    color: msg.type === 'ok' ? '#22c55e' : '#ef4444',
                    border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
                }}>
                    {msg.type === 'ok' ? <Check size={14} /> : <AlertCircle size={14} />} {msg.text}
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* ═══ HERO ═══ */}
                <Panel title="Hero Section" sectionKey="hero" expanded={expanded} onToggle={toggle} saving={saving}
                    onSave={() => saveSection('hero', hero)}>
                    <Field label="Badge Text" value={hero.badge} onChange={v => setHero(p => ({ ...p, badge: v }))} />
                    <Field label="Title (use <accent> for gold text, <br/> for line break)" value={hero.title}
                        onChange={v => setHero(p => ({ ...p, title: v }))} multiline />
                    <Field label="Description" value={hero.description}
                        onChange={v => setHero(p => ({ ...p, description: v }))} multiline />
                </Panel>

                {/* ═══ STATS ═══ */}
                <Panel title="Stats Strip" sectionKey="stats" expanded={expanded} onToggle={toggle} saving={saving}
                    onSave={() => saveSection('stats', stats)}>
                    {stats.map((s, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 1fr auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
                            <Field label={i === 0 ? 'Value' : ''} value={s.value} onChange={v => { const n = [...stats]; n[i] = { ...s, value: v }; setStats(n); }} />
                            <Field label={i === 0 ? 'Label' : ''} value={s.label} onChange={v => { const n = [...stats]; n[i] = { ...s, label: v }; setStats(n); }} />
                            <IconSelect label={i === 0 ? 'Icon' : ''} value={s.icon} onChange={v => { const n = [...stats]; n[i] = { ...s, icon: v }; setStats(n); }} />
                            <RemoveBtn onClick={() => setStats(stats.filter((_, j) => j !== i))} />
                        </div>
                    ))}
                    <AddBtn label="Add Stat" onClick={() => setStats([...stats, { value: '', label: '', icon: 'Award' }])} />
                </Panel>

                {/* ═══ VALUES ═══ */}
                <Panel title="Our Values" sectionKey="values" expanded={expanded} onToggle={toggle} saving={saving}
                    onSave={() => saveSection('values', values)}>
                    {values.map((v, i) => (
                        <div key={i} style={{ background: 'var(--color-bg-tertiary, #1a1a1d)', borderRadius: 8, padding: 14, marginBottom: 10 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 8 }}>
                                <Field label="Title" value={v.title} onChange={val => { const n = [...values]; n[i] = { ...v, title: val }; setValues(n); }} />
                                <IconSelect label="Icon" value={v.icon} onChange={val => { const n = [...values]; n[i] = { ...v, icon: val }; setValues(n); }} />
                                <RemoveBtn onClick={() => setValues(values.filter((_, j) => j !== i))} />
                            </div>
                            <Field label="Text" value={v.text} onChange={val => { const n = [...values]; n[i] = { ...v, text: val }; setValues(n); }} multiline />
                        </div>
                    ))}
                    <AddBtn label="Add Value" onClick={() => setValues([...values, { icon: 'Leaf', title: '', text: '' }])} />
                </Panel>

                {/* ═══ BRANDS ═══ */}
                <Panel title="Our Brands" sectionKey="brands" expanded={expanded} onToggle={toggle} saving={saving}
                    onSave={() => saveSection('brands', brands)}>
                    {brands.map((b, i) => (
                        <div key={i} style={{ background: 'var(--color-bg-tertiary, #1a1a1d)', borderRadius: 8, padding: 14, marginBottom: 10, borderLeft: `3px solid ${b.color || '#666'}` }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px auto', gap: 10, marginBottom: 8, alignItems: 'end' }}>
                                <Field label="Name" value={b.name} onChange={v => { const n = [...brands]; n[i] = { ...b, name: v }; setBrands(n); }} />
                                <Field label="Tagline" value={b.tagline} onChange={v => { const n = [...brands]; n[i] = { ...b, tagline: v }; setBrands(n); }} />
                                <div>
                                    <label style={labelStyle}>{i === 0 || true ? 'Color' : ''}</label>
                                    <input type="color" value={b.color || '#c9a96e'} onChange={e => { const n = [...brands]; n[i] = { ...b, color: e.target.value }; setBrands(n); }}
                                        style={{ width: '100%', height: 36, border: 'none', cursor: 'pointer', borderRadius: 6 }} />
                                </div>
                                <RemoveBtn onClick={() => setBrands(brands.filter((_, j) => j !== i))} />
                            </div>
                            <Field label="Description" value={b.description} onChange={v => { const n = [...brands]; n[i] = { ...b, description: v }; setBrands(n); }} multiline />
                        </div>
                    ))}
                    <AddBtn label="Add Brand" onClick={() => setBrands([...brands, { name: '', tagline: '', description: '', color: '#c9a96e' }])} />
                </Panel>

                {/* ═══ TIMELINE ═══ */}
                <Panel title="Timeline / Journey" sectionKey="timeline" expanded={expanded} onToggle={toggle} saving={saving}
                    onSave={() => saveSection('timeline', timeline)}>
                    {timeline.map((t, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto', gap: 10, alignItems: 'end', marginBottom: 10 }}>
                            <Field label={i === 0 ? 'Year' : ''} value={t.year} onChange={v => { const n = [...timeline]; n[i] = { ...t, year: v }; setTimeline(n); }} />
                            <Field label={i === 0 ? 'Event' : ''} value={t.event} onChange={v => { const n = [...timeline]; n[i] = { ...t, event: v }; setTimeline(n); }} />
                            <RemoveBtn onClick={() => setTimeline(timeline.filter((_, j) => j !== i))} />
                        </div>
                    ))}
                    <AddBtn label="Add Milestone" onClick={() => setTimeline([...timeline, { year: '', event: '' }])} />
                </Panel>

                {/* ═══ CTA ═══ */}
                <Panel title="Call to Action" sectionKey="cta" expanded={expanded} onToggle={toggle} saving={saving}
                    onSave={() => saveSection('cta', cta)}>
                    <Field label="Title" value={cta.title} onChange={v => setCta(p => ({ ...p, title: v }))} />
                    <Field label="Description" value={cta.description} onChange={v => setCta(p => ({ ...p, description: v }))} multiline />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 8 }}>
                        <Field label="Primary Button Text" value={cta.primary_btn_text} onChange={v => setCta(p => ({ ...p, primary_btn_text: v }))} />
                        <Field label="Primary Button Link" value={cta.primary_btn_link} onChange={v => setCta(p => ({ ...p, primary_btn_link: v }))} />
                        <Field label="Secondary Button Text" value={cta.secondary_btn_text} onChange={v => setCta(p => ({ ...p, secondary_btn_text: v }))} />
                        <Field label="Secondary Button Link" value={cta.secondary_btn_link} onChange={v => setCta(p => ({ ...p, secondary_btn_link: v }))} />
                    </div>
                </Panel>
            </div>
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

/* ═══════════════ SUB-COMPONENTS ═══════════════ */

function Panel({ title, sectionKey, expanded, onToggle, saving, onSave, children }: {
    title: string; sectionKey: string; expanded: string; onToggle: (k: string) => void;
    saving: string | null; onSave: () => void; children: React.ReactNode;
}) {
    const isOpen = expanded === sectionKey;
    return (
        <div style={{
            background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-lg)', overflow: 'hidden',
        }}>
            <button onClick={() => onToggle(sectionKey)} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-primary)', fontSize: 15, fontWeight: 700,
                fontFamily: "'Outfit', sans-serif",
            }}>
                {title}
                {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
            {isOpen && (
                <div style={{ padding: '0 20px 20px' }}>
                    {children}
                    <button onClick={onSave} disabled={saving === sectionKey} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        marginTop: 16, padding: '10px 24px', background: 'var(--gradient-accent)',
                        color: '#0a0a0b', border: 'none', borderRadius: 'var(--radius-md)',
                        fontSize: 13, fontWeight: 700, cursor: saving === sectionKey ? 'wait' : 'pointer',
                        opacity: saving === sectionKey ? 0.6 : 1, fontFamily: "'Inter', sans-serif",
                    }}>
                        {saving === sectionKey ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={14} />}
                        Save {title}
                    </button>
                </div>
            )}
        </div>
    );
}

function Field({ label, value, onChange, multiline }: {
    label?: string; value: string; onChange: (v: string) => void; multiline?: boolean;
}) {
    const Tag = multiline ? 'textarea' : 'input';
    return (
        <div>
            {label && <label style={labelStyle}>{label}</label>}
            <Tag value={value} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value)}
                rows={multiline ? 3 : undefined}
                style={{
                    ...inputStyle,
                    ...(multiline ? { resize: 'vertical' as const, minHeight: 60 } : {}),
                }} />
        </div>
    );
}

function IconSelect({ label, value, onChange }: { label?: string; value: string; onChange: (v: string) => void }) {
    return (
        <div>
            {label && <label style={labelStyle}>{label}</label>}
            <select value={value} onChange={e => onChange(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                {iconOptions.map(ic => <option key={ic} value={ic}>{ic}</option>)}
            </select>
        </div>
    );
}

function AddBtn({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
            background: 'var(--color-accent-glow)', color: 'var(--color-accent)',
            border: '1px dashed var(--color-accent)', borderRadius: 'var(--radius-md)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: "'Inter', sans-serif",
        }}>
            <Plus size={13} /> {label}
        </button>
    );
}

function RemoveBtn({ onClick }: { onClick: () => void }) {
    return (
        <button onClick={onClick} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 8, background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            border: 'none', borderRadius: 'var(--radius-md)', cursor: 'pointer',
            marginBottom: 1,
        }}>
            <Trash2 size={14} />
        </button>
    );
}

/* ═══════════════ STYLES ═══════════════ */

const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 600,
    color: 'var(--color-text-secondary)', marginBottom: 4,
    fontFamily: "'Inter', sans-serif", textTransform: 'uppercase',
    letterSpacing: 0.5,
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 12px',
    background: 'var(--color-bg-tertiary, #1a1a1d)',
    border: '1px solid var(--color-border)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text-primary)',
    fontSize: 13, fontFamily: "'Inter', sans-serif", outline: 'none',
};
