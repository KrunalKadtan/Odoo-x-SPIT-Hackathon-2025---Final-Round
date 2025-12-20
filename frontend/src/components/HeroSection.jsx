import React from 'react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative h-[85vh] min-h-[600px] bg-app-secondary overflow-hidden">
      {/* Hero Image with Overlay */}
      <div className="absolute inset-0">
        <img
          src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1920&q=80"
          alt="Premium Cotton Kurta Collection"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
      </div>

      {/* Hero Content */}
      <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-center h-full max-w-2xl">
          <h1 className="font-display text-5xl md:text-7xl font-light text-white tracking-tight mb-6 leading-tight">
            Timeless Essentials for the Modern Wardrobe
          </h1>
          <p className="font-sans text-lg md:text-xl text-white/90 mb-8 max-w-xl">
            Discover premium quality apparel crafted from 100% organic cotton. Elegance meets comfort.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => navigate('/shop')}
              className="bg-app-accent text-white px-8 py-4 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              SHOP COLLECTION
            </button>
            <button
              onClick={() => navigate('/shop/new-arrivals')}
              className="bg-white/10 backdrop-blur-sm text-white border border-white/30 px-8 py-4 rounded-pro font-mono text-sm tracking-wider hover:bg-white/20 transition-all duration-300"
            >
              EXPLORE NEW ARRIVALS
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  );
};

export default HeroSection;
