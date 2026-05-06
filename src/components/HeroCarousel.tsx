'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface HeroSlide {
    image: string;
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
    },
    {
        image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=1400&q=80',
        alt: 'Anti Acne Face Wash',
        background: 'linear-gradient(135deg, #d4e8d0 0%, #e2f0de 30%, #eaf5e6 60%, #d8ead4 100%)',
    },
    {
        image: 'https://images.unsplash.com/photo-1611930022073-b7a4ba5fcccd?w=1400&q=80',
        alt: 'Daily Sunscreen SPF 50+',
        background: 'linear-gradient(135deg, #fce4b8 0%, #fdedc8 30%, #fff3d8 60%, #fae5b6 100%)',
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
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
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
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Full-width Image — wrapped in Link if slide has a link */}
            {(() => {
                const slideContent = (
                    <div
                        className="hero-slide-content"
                        style={{
                            position: 'relative',
                            width: '100%',
                            minHeight: '560px',
                            transform: isDragging ? `translateX(${dragDelta}px)` : undefined,
                        }}
                    >
                        {imgError.has(current) ? (
                            <div
                                style={{
                                    position: 'absolute',
                                    inset: 0,
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
                            <Image
                                src={slide.image}
                                alt={slide.alt}
                                fill
                                priority
                                sizes="100vw"
                                style={{
                                    objectFit: 'cover',
                                    objectPosition: 'center',
                                }}
                                draggable={false}
                                onError={() => handleImgError(current)}
                            />
                        )}
                    </div>
                );

                return slide.link ? (
                    <Link
                        href={slide.link}
                        onMouseDown={handleClickDown}
                        onMouseMove={handleClickMove}
                        onClick={handleClick}
                        style={{ display: 'block', textDecoration: 'none', color: 'inherit' }}
                        draggable={false}
                    >
                        {slideContent}
                    </Link>
                ) : slideContent;
            })()}

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
                }}
            >
                {slides.map((_, idx) => (
                    <button
                        key={idx}
                        onClick={() => {
                            goTo(idx);
                            resetAutoPlay();
                        }}
                        onMouseEnter={(e) => {
                            const dot = e.currentTarget.querySelector('span') as HTMLElement;
                            if (dot) dot.style.transform = 'scale(1.5)';
                        }}
                        onMouseLeave={(e) => {
                            const dot = e.currentTarget.querySelector('span') as HTMLElement;
                            if (dot) dot.style.transform = idx === current ? 'scale(1.2)' : 'scale(1)';
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
                        }}
                        aria-label={`Slide ${idx + 1}`}
                    >
                        <span
                            style={{
                                width: idx === current ? '10px' : '8px',
                                height: idx === current ? '10px' : '8px',
                                borderRadius: '50%',
                                background: idx === current ? '#4a3f35' : '#c4b49e',
                                display: 'block',
                                transition: 'all 0.3s ease',
                                transform: idx === current ? 'scale(1.2)' : 'scale(1)',
                            }}
                        />
                    </button>
                ))}
            </div>
        </section>
    );
}
