import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-app-primary p-8">
      <div className="max-w-md mx-auto bg-app-surface rounded-pro shadow-lg border border-app-border p-8">
        <h1 className="font-display text-3xl font-light text-app-main tracking-tight mb-4">
          Styling Test
        </h1>
        <p className="text-app-muted font-sans text-sm mb-6">
          If you can see this styled properly, Tailwind CSS is working!
        </p>
        <button className="w-full px-6 py-3 rounded-pro font-mono text-sm tracking-widest uppercase bg-app-accent text-white hover:bg-app-accent/90 transition-all duration-200">
          Test Button
        </button>
        <div className="mt-4 p-4 bg-app-secondary rounded-pro">
          <p className="text-app-main font-sans text-sm">
            Secondary background - if this has a light gray background, CSS variables are working!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;