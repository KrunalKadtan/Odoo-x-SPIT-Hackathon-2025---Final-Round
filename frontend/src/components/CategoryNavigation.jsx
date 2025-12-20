import React from 'react';
import { useNavigate } from 'react-router-dom';

const CategoryNavigation = () => {
  const navigate = useNavigate();

  const categories = [
    {
      id: 'men',
      title: 'Men',
      subtitle: 'Classic & Contemporary',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&q=80',
      path: '/shop/men'
    },
    {
      id: 'women',
      title: 'Women',
      subtitle: 'Elegant & Timeless',
      image: 'https://images.unsplash.com/photo-1494790108755-2616c9c0b8d3?w=600&q=80',
      path: '/shop/women'
    },
    {
      id: 'kurtas',
      title: 'Kurtas',
      subtitle: 'Traditional Meets Modern',
      image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=600&q=80',
      path: '/shop/kurtas'
    },
    {
      id: 'seasonal',
      title: 'Seasonal Edit',
      subtitle: 'Curated Collections',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&q=80',
      path: '/shop/seasonal'
    }
  ];

  return (
    <section className="py-20 bg-app-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-light text-app-main tracking-tight mb-4">
            Shop by Category
          </h2>
          <p className="font-sans text-lg text-app-muted max-w-2xl mx-auto">
            Discover our carefully curated collections designed for every occasion
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {categories.map((category) => (
            <div
              key={category.id}
              onClick={() => navigate(category.path)}
              className="group cursor-pointer bg-app-surface rounded-pro overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 transform hover:-translate-y-2"
            >
              <div className="relative h-80 overflow-hidden">
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                {/* Category Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                  <h3 className="font-display text-2xl font-medium mb-1">
                    {category.title}
                  </h3>
                  <p className="font-sans text-sm opacity-90">
                    {category.subtitle}
                  </p>
                </div>
              </div>

              {/* Static Info (visible on mobile) */}
              <div className="p-6 md:hidden">
                <h3 className="font-display text-xl font-medium text-app-main mb-1">
                  {category.title}
                </h3>
                <p className="font-sans text-sm text-app-muted">
                  {category.subtitle}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryNavigation;