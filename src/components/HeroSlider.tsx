import React, { useState, useEffect, useRef } from 'react';
import { Banner } from '../types';

interface HeroSliderProps {
  banners: Banner[];
  onNavigate: (view: string, category?: string) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({ banners, onNavigate }) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const totalSlides = banners.length || 3;
  const isHovered = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!isHovered.current) {
        setCurrentSlide(prev => (prev + 1) % totalSlides);
      }
    }, 5000);

    return () => clearInterval(timer);
  }, [totalSlides]);

  const nextSlide = () => {
    setCurrentSlide(prev => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide(prev => (prev - 1 + totalSlides) % totalSlides);
  };

  if (!banners.length) return null;

  return (
    <section
      className="relative w-full h-[50vh] md:h-[70vh] lg:h-[85vh] bg-black overflow-hidden group select-none"
      onMouseEnter={() => { isHovered.current = true; }}
      onMouseLeave={() => { isHovered.current = false; }}
    >
      {/* Slides Container */}
      <div className="w-full h-full relative">
        {banners.map((banner, index) => (
          <div
            key={banner.id || index}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            <img
              src={banner.imageUrl}
              alt={banner.title}
              className="w-full h-full object-cover object-center opacity-85"
            />
          </div>
        ))}
      </div>

      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-transparent to-transparent opacity-80 pointer-events-none z-10"></div>

      {/* Text Content */}
      <div className="absolute bottom-12 md:bottom-20 left-0 w-full text-center px-4 z-20 pointer-events-none">
        <span className="inline-block bg-brand-red text-white text-xs font-bold px-3 py-1 mb-4 tracking-widest uppercase pointer-events-auto">
          Sản phẩm mới
        </span>
        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tight mb-4 drop-shadow-2xl italic pointer-events-auto">
          PHUANH SNEAKER <br /> NEW ARRIVALS
        </h2>
        <button
          onClick={() => onNavigate('collection', 'ALL')}
          className="mt-4 inline-flex items-center bg-white text-black font-black py-3.5 px-8 text-sm uppercase tracking-wider hover:bg-brand-red hover:text-white transition-all duration-300 pointer-events-auto cursor-pointer shadow-lg"
        >
          Mua sắm ngay <i className="ph ph-arrow-right ml-2 text-lg"></i>
        </button>
      </div>

      {/* Carousel Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 cursor-pointer"
        aria-label="Slide trước"
      >
        <i className="ph ph-caret-left text-xl md:text-2xl"></i>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-10 h-10 md:w-12 md:h-12 bg-white/20 hover:bg-white/40 backdrop-blur-md border border-white/30 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 cursor-pointer"
        aria-label="Slide tiếp theo"
      >
        <i className="ph ph-caret-right text-xl md:text-2xl"></i>
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-0 w-full flex justify-center space-x-2 z-30">
        {banners.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-8 h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
              index === currentSlide ? 'bg-brand-red w-10' : 'bg-white/50 hover:bg-white/80'
            }`}
            aria-label={`Đi tới slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
