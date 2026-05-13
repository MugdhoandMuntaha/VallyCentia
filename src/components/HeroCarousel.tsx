'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroSlide {
    image: string;
    mobileImage?: string;
    alt: string;
    background: string;
    link?: string;
}

interface HeroCarouselProps {
    slides?: HeroSlide[];
}

const defaultSlides: HeroSlide[] = [
    {
        image: 'https://ibb.co.com/tpYyHXK7',
        alt: 'Hair Strengthening Spray',
        background: 'linear-gradient(135deg, #e8d5b7 0%, #f0e4cf 30%, #f5eadb 60%, #eeddc4 100%)',
        link: '/shop',
    },
    {
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1400&q=80',
        alt: 'Anti Acne Face Wash',
        background: 'linear-gradient(135deg, #d4e8d0 0%, #e2f0de 30%, #eaf5e6 60%, #d8ead4 100%)',
        link: '/shop',
    },
    {
        image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=1400&q=80',
        alt: 'Daily Sunscreen SPF 50+',
        background: 'linear-gradient(135deg, #fce4b8 0%, #fdedc8 30%, #fff3d8 60%, #fae5b6 100%)',
        link: '/shop',
    },
];

export default function HeroCarousel({ slides: propSlides }: HeroCarouselProps) {
    const slides = propSlides && propSlides.length > 0 ? propSlides : defaultSlides;
    const [current, setCurrent] = useState(0);
    const [imgError, setImgError] = useState<Set<number>>(new Set());
    const [isDragging, setIsDragging] = useState(false);
    const [dragStartX, setDragStartX] = useState(0);
    const [dragDelta, setDragDelta] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

    const goTo = useCallback((index: number) => {
        setCurrent(index);
        setDragDelta(0);
    }, []);

    const handleImgError = (index: number) => {
        setImgError((prev) => new Set(prev).add(index));
    };

    const goNext = useCallback(() => {
        setCurrent((prev) => (prev + 1) % slides.length);
        setDragDelta(0);
    }, []);

    const goPrev = useCallback(() => {
        setCurrent((prev) => (prev - 1 + slides.length) % slides.length);
        setDragDelta(0);
    }, []);

    // Auto-advance
    const resetAutoPlay = useCallback(() => {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        autoPlayRef.current = setInterval(goNext, 5000);
    }, [goNext]);

    useEffect(() => {
        resetAutoPlay();
        return () => {
            if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        };
    }, [resetAutoPlay]);

    // Pointer handlers for drag/swipe
    const handlePointerDown = (e: React.PointerEvent) => {
        setIsDragging(true);
        setDragStartX(e.clientX);
        setDragDelta(0);
        // Removed setPointerCapture to allow clicks to bubble correctly to child Links
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging) return;
        setDragDelta(e.clientX - dragStartX);
    };

    const handlePointerUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        const threshold = 80;
        if (dragDelta < -threshold) {
            goNext();
        } else if (dragDelta > threshold) {
            goPrev();
        } else {
            setDragDelta(0);
        }
        resetAutoPlay();
    };

    // Only navigate if it was a click (not a drag)
    const wasClick = useRef(true);
    const handleClickDown = () => { wasClick.current = true; };
    const handleClickMove = () => { if (Math.abs(dragDelta) > 5) wasClick.current = false; };
    const handleClick = (e: React.MouseEvent) => {
        if (!wasClick.current) e.preventDefault();
    };

    const slide = slides[current];

    return (
        <section
            ref={containerRef}
            className="hero-section"
            style={{
                position: 'relative',
                width: '100%',
                overflow: 'hidden',
                background: slide.background,
                cursor: isDragging ? 'grabbing' : 'grab',
                userSelect: 'none',
                touchAction: 'pan-y',
                transition: 'none',
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Slide Content */}
            <div
                className="hero-slide-content"
                style={{
                    width: '100%',
                    lineHeight: 0,
                    transition: 'none',
                }}
            >
                {imgError.has(current) ? (
                    <div
                        style={{
                            width: '100%',
                            aspectRatio: '1920/600',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '40px',
                        }}
                    >
                        <span
                            style={{
                                fontFamily: "'Outfit', sans-serif",
                                fontSize: '32px',
                                fontWeight: 700,
                                color: '#4a3f35',
                                textAlign: 'center',
                                lineHeight: 1.3,
                            }}
                        >
                            {slide.alt}
                        </span>
                    </div>
                ) : (
                    <>
                        {/* Desktop Image */}
                        <div className="desktop-hero-image">
                            <Image
                                src={slide.image}
                                alt={slide.alt}
                                width={1920}
                                height={600}
                                priority
                                sizes="100vw"
                                style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                }}
                                draggable={false}
                                onError={() => handleImgError(current)}
                            />
                        </div>

                        {/* Mobile Image */}
                        <div className="mobile-hero-image">
                            <Image
                                src={slide.mobileImage || slide.image}
                                alt={slide.alt}
                                width={800}
                                height={800}
                                priority
                                sizes="100vw"
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                                draggable={false}
                                onError={() => handleImgError(current)}
                            />
                        </div>
                    </>
                )}
            </div>

            {/* Click Overlay Link — makes the entire slide clickable */}
            {slide.link && (
                <Link
                    href={slide.link}
                    onMouseDown={handleClickDown}
                    onMouseMove={handleClickMove}
                    onClick={handleClick}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        zIndex: 5,
                        cursor: 'pointer',
                    }}
                    draggable={false}
                    aria-label={slide.alt}
                />
            )}

            {/* Carousel Dots */}
            <div
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '0px',
                    position: 'absolute',
                    bottom: '16px',
                    left: 0,
                    right: 0,
                    zIndex: 10,
                    pointerEvents: 'none',
                }}
            >
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            goTo(idx);
                            resetAutoPlay();
                        }}
                        style={{
                            width: '20px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 0,
                            pointerEvents: 'auto',
                        }}
                        aria-label={`Slide ${idx + 1}`}
                    >
                        <span
                            style={{
                                width: '7px',
                                height: '7px',
                                borderRadius: '50%',
                                background: idx === current ? '#1a1a1a' : 'transparent',
                                border: `1.5px solid ${idx === current ? '#1a1a1a' : 'rgba(26, 26, 26, 0.4)'}`,
                                display: 'block',
                                transition: 'all 0.3s ease',
                                transform: idx === current ? 'scale(1.1)' : 'scale(1)',
                            }}
                        />
                    </button>
                ))}
            </div>
        </section>
    );
}
