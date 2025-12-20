import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    if (email) {
      // Here you would typically send the email to your backend
      console.log('Newsletter subscription:', email);
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  const footerLinks = {
    shop: [
      { name: 'New Arrivals', path: '/shop/new-arrivals' },
      { name: 'Best Sellers', path: '/shop/best-sellers' },
      { name: 'Men', path: '/shop/men' },
      { name: 'Women', path: '/shop/women' },
      { name: 'Kurtas', path: '/shop/kurtas' },
      { name: 'Seasonal Edit', path: '/shop/seasonal' }
    ],
    support: [
      { name: 'Customer Support', path: '/support' },
      { name: 'FAQ', path: '/faq' },
      { name: 'Size Guide', path: '/size-guide' },
      { name: 'Returns Policy', path: '/returns' },
      { name: 'Order Tracking', path: '/track-order' },
      { name: 'Contact Us', path: '/contact' }
    ],
    company: [
      { name: 'About Us', path: '/about' },
      { name: 'Our Story', path: '/story' },
      { name: 'Sustainability', path: '/sustainability' },
      { name: 'Careers', path: '/careers' },
      { name: 'Press', path: '/press' },
      { name: 'Blog', path: '/blog' }
    ]
  };

  const socialLinks = [
    {
      name: 'Instagram',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.004 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.323-1.297C4.198 14.895 3.708 13.744 3.708 12.447s.49-2.448 1.418-3.323c.875-.807 2.026-1.297 3.323-1.297s2.448.49 3.323 1.297c.928.875 1.418 2.026 1.418 3.323s-.49 2.448-1.418 3.244c-.875.807-2.026 1.297-3.323 1.297zm7.83-9.781c-.315 0-.612-.123-.833-.344-.221-.221-.344-.518-.344-.833 0-.315.123-.612.344-.833.221-.221.518-.344.833-.344s.612.123.833.344c.221.221.344.518.344.833 0 .315-.123.612-.344.833-.221.221-.518.344-.833.344zm-3.332 9.781c-2.493 0-4.514-2.021-4.514-4.514s2.021-4.514 4.514-4.514 4.514 2.021 4.514 4.514-2.021 4.514-4.514 4.514z"/>
        </svg>
      ),
      url: 'https://instagram.com/appareldesk'
    },
    {
      name: 'Pinterest',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.097.118.112.222.083.343-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001 12.017.001z"/>
        </svg>
      ),
      url: 'https://pinterest.com/appareldesk'
    },
    {
      name: 'Twitter',
      icon: (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
        </svg>
      ),
      url: 'https://twitter.com/appareldesk'
    }
  ];

  return (
    <footer className="bg-app-surface border-t border-app-border">
      {/* Newsletter Section */}
      <div className="bg-app-secondary py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h3 className="font-display text-2xl font-light text-app-main mb-4">
              Join the Club
            </h3>
            <p className="font-sans text-app-muted mb-8 max-w-2xl mx-auto">
              Be the first to know about new arrivals, exclusive offers, and styling tips
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-3 rounded-pro border border-app-border bg-app-surface text-app-main placeholder-app-muted focus:outline-none focus:ring-2 focus:ring-app-accent focus:border-transparent"
                  required
                />
                <button
                  type="submit"
                  className="bg-app-accent text-white px-6 py-3 rounded-pro font-mono text-sm tracking-wider hover:bg-app-accent/90 transition-all duration-300"
                >
                  SUBSCRIBE
                </button>
              </div>
              {subscribed && (
                <p className="text-green-600 text-sm mt-2 font-sans">
                  Thank you for subscribing!
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center mb-6">
                <div className="bg-app-accent text-white px-4 py-2 rounded-pro font-mono text-lg tracking-wider">
                  APPARELDESK
                </div>
              </Link>
              <p className="font-sans text-app-muted mb-6 leading-relaxed">
                Timeless essentials crafted with premium materials and sustainable practices. 
                Elevating your wardrobe with pieces that last.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-app-muted hover:text-app-accent transition-colors duration-300"
                    aria-label={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Shop Links */}
            <div>
              <h4 className="font-display text-lg font-medium text-app-main mb-6">
                Shop
              </h4>
              <ul className="space-y-3">
                {footerLinks.shop.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="font-sans text-app-muted hover:text-app-accent transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="font-display text-lg font-medium text-app-main mb-6">
                Support
              </h4>
              <ul className="space-y-3">
                {footerLinks.support.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="font-sans text-app-muted hover:text-app-accent transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company Links */}
            <div>
              <h4 className="font-display text-lg font-medium text-app-main mb-6">
                Company
              </h4>
              <ul className="space-y-3">
                {footerLinks.company.map((link) => (
                  <li key={link.name}>
                    <Link
                      to={link.path}
                      className="font-sans text-app-muted hover:text-app-accent transition-colors duration-300"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-app-border py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-sans text-sm text-app-muted">
              © 2024 ApparelDesk. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link
                to="/privacy"
                className="font-sans text-sm text-app-muted hover:text-app-accent transition-colors duration-300"
              >
                Privacy Policy
              </Link>
              <Link
                to="/terms"
                className="font-sans text-sm text-app-muted hover:text-app-accent transition-colors duration-300"
              >
                Terms of Service
              </Link>
              <Link
                to="/cookies"
                className="font-sans text-sm text-app-muted hover:text-app-accent transition-colors duration-300"
              >
                Cookie Policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;