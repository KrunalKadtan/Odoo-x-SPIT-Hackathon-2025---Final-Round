import React from 'react';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-app-primary flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-app-surface rounded-pro shadow-lg border border-app-border p-8">
          <div className="text-center mb-8">
            <h1 className="font-display text-3xl font-light text-app-main tracking-tight mb-2">
              {title}
            </h1>
            {subtitle && (
              <p className="text-app-muted font-sans text-sm">
                {subtitle}
              </p>
            )}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;