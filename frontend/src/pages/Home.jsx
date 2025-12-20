import React from 'react';
import { 
  Navigation, 
  HeroSection, 
  CategoryNavigation, 
  FeaturedProducts, 
  PromotionalBanner, 
  BrandStory, 
  Footer 
} from '../components';

const Home = () => {
  return (
    <div className="min-h-screen bg-app-primary">
      <Navigation />
      
      {/* Hero Section - Above the Fold */}
      <HeroSection />
      
      {/* Promotional Banner with Coupon */}
      <PromotionalBanner />
      
      {/* Visual Category Navigation */}
      <CategoryNavigation />
      
      {/* Featured Product Grids */}
      <FeaturedProducts />
      
      {/* Brand Story & Trust Signals */}
      <BrandStory />
      
      {/* Minimalist Footer */}
      <Footer />
    </div>
  );
};

export default Home;