import React from 'react';
import { Link } from 'react-router-dom';

const Breadcrumb = ({ items }) => {
  return (
    <nav className="flex items-center space-x-2 text-sm font-sans mb-6">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && (
            <span className="text-app-muted">/</span>
          )}
          {item.href ? (
            <Link 
              to={item.href}
              className="text-app-accent hover:text-app-accent/80 transition-colors duration-200"
            >
              {item.label}
            </Link>
          ) : (
            <span className="text-app-main font-medium">
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;