import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PromotionalBanner = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Set countdown timer for 7 days from now
  useEffect(() => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  return (
    <>
      {/* Main Promotional Banner */}
      <section className="bg-gradient-to-r from-app-accent to-app-accent/80 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="font-display text-3xl md:text-4xl font-light mb-4">
              Welcome to Premium Quality
            </h2>
            <p className="font-sans text-lg md:text-xl mb-8 max-w-2xl mx-auto">
              Get 20% off your first order with exclusive access to our premium collection
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <div className="bg-white/20 backdrop-blur-sm px-6 py-3 rounded-pro border border-white/30">
                <span className="font-mono text-sm tracking-wider">CODE: </span>
                <span className="font-mono text-lg font-medium">FIRST20</span>
                <button
                  onClick={() => copyToClipboard('FIRST20')}
                  className="ml-2 text-white/80 hover:text-white transition-colors duration-200"
                  title="Copy code"
                >
                  <svg className="w-4 h-4 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={() => navigate('/shop')}
                className="bg-white text-app-accent px-8 py-3 rounded-pro font-mono text-sm tracking-wider hover:bg-white/90 transition-all duration-300 shadow-lg"
              >
                SHOP NOW
              </button>
            </div>

            {/* Countdown Timer */}
            <div className="flex justify-center items-center gap-6 text-center">
              <div className="text-xs font-mono tracking-wider opacity-90 mb-2">
                LIMITED TIME OFFER ENDS IN:
              </div>
            </div>
            <div className="flex justify-center items-center gap-4 md:gap-6">
              {Object.entries(timeLeft).map(([unit, value]) => (
                <div key={unit} className="text-center">
                  <div className="bg-white/20 backdrop-blur-sm rounded-pro px-3 py-2 md:px-4 md:py-3 border border-white/30">
                    <span className="font-mono text-xl md:text-2xl font-medium">
                      {value.toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className="text-xs font-mono tracking-wider mt-1 opacity-80 uppercase">
                    {unit}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Secondary Banner - Free Shipping */}
      <section className="bg-app-primary border-b border-app-border py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-center md:justify-between gap-4 text-center md:text-left">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span className="font-sans text-sm text-app-main">
                <strong>Free Shipping</strong> on orders above ₹2,999
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-sans text-sm text-app-main">
                <strong>Easy Returns</strong> within 30 days
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-sans text-sm text-app-main">
                <strong>Secure Payments</strong> guaranteed
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PromotionalBanner;