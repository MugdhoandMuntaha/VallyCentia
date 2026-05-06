'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface BrandCard {
    id: number;
    name: string;
    slug: string;
    tagline: string;
    image: string;
    background: string;
    textColor?: string;
    nameStyle?: React.CSSProperties;
}

interface BrandsThatLeadProps {
    brands?: BrandCard[];
    background?: string;
}

const defaultBrands: BrandCard[] = [
    
];

export default function BrandsThatLead({ brands: propBrands, background = '#ffffff' }: BrandsThatLeadProps) {
    const brands = propBrands && propBrands.length > 0 ? propBrands : defaultBrands;
    return (
        <section
            style={{
                background,
                padding: '32px 0 36px',
            }}
        >
            {/* Header */}
            <div
                className="section-header-row"
                style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 48px',
                    marginBottom: '28px',
                }}
            >
                <h2
                    style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: '28px',
                        fontWeight: 700,
                        color: '#1a1a1a',
                        marginBottom: '6px',
                        lineHeight: 1.2,
                    }}
                >
                    Brands That Lead
                </h2>
                <p
                    style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '15px',
                        color: '#888',
                        fontWeight: 400,
                    }}
                >
                    The powerhouses behind your favourites
                </p>
            </div>

            {/* Brand Cards Grid */}
            <div
                className="brands-grid"
                style={{
                    maxWidth: '1400px',
                    margin: '0 auto',
                    padding: '0 48px',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '16px',
                }}
            >
                {brands.map((brand) => (
                    <Link
                        key={brand.id}
                        href={`/shop?brand=${brand.slug}`}
                        className="brand-card"
                        style={{
                            position: 'relative',
                            display: 'block',
                            borderRadius: '14px',
                            overflow: 'hidden',
                            background: brand.background,
                            height: '180px',
                            textDecoration: 'none',
                            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = 'translateY(-3px)';
                            e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = 'translateY(0)';
                            e.currentTarget.style.boxShadow = 'none';
                        }}
                    >
                        {/* Model/Product Image - Left Side */}
                        <div
                            style={{
                                position: 'absolute',
                                left: 0,
                                top: 0,
                                width: '50%',
                                height: '100%',
                            }}
                        >
                            <Image
                                src={brand.image}
                                alt={brand.name}
                                fill
                                sizes="25vw"
                                style={{
                                    objectFit: 'cover',
                                    objectPosition: 'center top',
                                }}
                            />
                        </div>

                        {/* Brand Info - Right Side */}
                        <div
                            style={{
                                position: 'absolute',
                                right: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                width: '45%',
                                textAlign: 'center',
                            }}
                        >
                            <h3
                                className="brand-name"
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '16px',
                                    fontWeight: 700,
                                    color: brand.textColor || '#1a1512',
                                    marginBottom: '4px',
                                    lineHeight: 1.2,
                                    ...brand.nameStyle,
                                }}
                            >
                                {brand.name}
                            </h3>
                            <p
                                className="brand-tagline"
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '11px',
                                    color: brand.textColor || '#4a3f35',
                                    opacity: brand.textColor ? 0.75 : 1,
                                    fontWeight: 400,
                                    lineHeight: 1.3,
                                }}
                            >
                                {brand.tagline}
                            </p>
                        </div>

                        {/* Products Link */}
                        <div
                            className="brand-products-pill"
                            style={{
                                position: 'absolute',
                                bottom: '14px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                background: 'rgba(255,255,255,0.85)',
                                backdropFilter: 'blur(4px)',
                                padding: '6px 14px',
                                borderRadius: '20px',
                            }}
                        >
                            <span
                                style={{
                                    fontFamily: "'Inter', sans-serif",
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    color: '#1a1a1a',
                                }}
                            >
                                Products
                            </span>
                            <span style={{ fontSize: '12px', color: '#1a1a1a' }}>↗</span>
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}
