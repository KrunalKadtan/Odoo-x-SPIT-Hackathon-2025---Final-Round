import React from 'react';

const BrandStory = () => {
  const features = [
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
        </svg>
      ),
      title: "100% Organic Cotton",
      description: "Sourced from certified organic farms, ensuring the highest quality and sustainability."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      title: "Artisan Craftsmanship",
      description: "Each piece is carefully crafted by skilled artisans with decades of experience."
    },
    {
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
      title: "Sustainable Fashion",
      description: "Committed to ethical practices and environmental responsibility in every step."
    }
  ];

  const testimonials = [
    {
      text: "The quality is exceptional. These pieces have become staples in my wardrobe.",
      author: "Priya S.",
      location: "Mumbai"
    },
    {
      text: "Finally found a brand that combines style with sustainability. Highly recommended!",
      author: "Arjun K.",
      location: "Bangalore"
    },
    {
      text: "The attention to detail and comfort is unmatched. Worth every penny.",
      author: "Meera R.",
      location: "Delhi"
    }
  ];

  return (
    <section className="py-20 bg-app-primary">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Story */}
        <div className="text-center mb-20">
          <h2 className="font-display text-4xl md:text-5xl font-light text-app-main tracking-tight mb-6">
            Crafted with Purpose
          </h2>
          <p className="font-sans text-lg md:text-xl text-app-muted max-w-4xl mx-auto leading-relaxed">
            At ApparelDesk, we believe in creating timeless pieces that honor both tradition and innovation. 
            Our commitment to quality begins with sourcing the finest organic materials and extends through 
            every stitch, ensuring each garment tells a story of craftsmanship and care.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-app-accent mb-6 flex justify-center">
                {feature.icon}
              </div>
              <h3 className="font-display text-xl font-medium text-app-main mb-4">
                {feature.title}
              </h3>
              <p className="font-sans text-app-muted leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Customer Testimonials */}
        <div className="bg-app-secondary rounded-pro p-12">
          <div className="text-center mb-12">
            <h3 className="font-display text-3xl font-light text-app-main tracking-tight mb-4">
              Community Favorites
            </h3>
            <p className="font-sans text-app-muted">
              What our customers are saying about their experience
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-app-surface rounded-pro p-6 shadow-sm">
                <div className="text-app-accent mb-4">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h4v10h-10z"/>
                  </svg>
                </div>
                <p className="font-sans text-app-main mb-4 italic">
                  "{testimonial.text}"
                </p>
                <div className="text-sm">
                  <p className="font-mono text-app-accent font-medium">
                    {testimonial.author}
                  </p>
                  <p className="font-sans text-app-muted">
                    {testimonial.location}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;