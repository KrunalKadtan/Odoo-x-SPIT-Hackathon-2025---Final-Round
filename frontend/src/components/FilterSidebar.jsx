import React, { useState } from 'react';

const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-app-border pb-4 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left font-sans font-medium text-app-main mb-3"
      >
        {title}
        <svg 
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

const FilterSidebar = ({ filters, onFilterChange }) => {
  const categories = ['Men', 'Women', 'Children'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  const materials = ['Cotton', 'Polyester', 'Silk', 'Wool', 'Linen', 'Denim'];
  const colors = ['Black', 'White', 'Red', 'Blue', 'Green', 'Yellow', 'Pink', 'Gray'];
  const priceRanges = [
    { label: 'Under ₹500', min: 0, max: 500 },
    { label: '₹500 - ₹1000', min: 500, max: 1000 },
    { label: '₹1000 - ₹2000', min: 1000, max: 2000 },
    { label: '₹2000 - ₹5000', min: 2000, max: 5000 },
    { label: 'Above ₹5000', min: 5000, max: Infinity },
  ];

  const handleCheckboxChange = (filterType, value) => {
    const currentValues = filters[filterType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    
    onFilterChange(filterType, newValues);
  };

  const CheckboxOption = ({ label, value, filterType }) => (
    <label className="flex items-center space-x-2 cursor-pointer">
      <input
        type="checkbox"
        checked={(filters[filterType] || []).includes(value)}
        onChange={() => handleCheckboxChange(filterType, value)}
        className="rounded border-app-border text-app-accent focus:ring-app-accent focus:ring-1"
      />
      <span className="text-sm text-app-main">{label}</span>
    </label>
  );

  return (
    <div className="w-64 bg-app-surface border-r border-app-border p-6 h-full">
      <h2 className="font-display text-xl font-medium text-app-main mb-6">
        Filters
      </h2>

      {/* Category Filter */}
      <FilterSection title="Category">
        {categories.map(category => (
          <CheckboxOption
            key={category}
            label={category}
            value={category}
            filterType="category"
          />
        ))}
      </FilterSection>

      {/* Size Filter */}
      <FilterSection title="Size">
        {sizes.map(size => (
          <CheckboxOption
            key={size}
            label={size}
            value={size}
            filterType="size"
          />
        ))}
      </FilterSection>

      {/* Material Filter */}
      <FilterSection title="Material">
        {materials.map(material => (
          <CheckboxOption
            key={material}
            label={material}
            value={material}
            filterType="material"
          />
        ))}
      </FilterSection>

      {/* Color Filter */}
      <FilterSection title="Color">
        {colors.map(color => (
          <CheckboxOption
            key={color}
            label={color}
            value={color}
            filterType="color"
          />
        ))}
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection title="Price Range">
        {priceRanges.map((range, index) => (
          <CheckboxOption
            key={index}
            label={range.label}
            value={`${range.min}-${range.max}`}
            filterType="priceRange"
          />
        ))}
      </FilterSection>

      {/* Clear Filters Button */}
      <button
        onClick={() => onFilterChange('clear', null)}
        className="w-full mt-6 px-4 py-2 border border-app-border rounded-pro text-sm font-sans text-app-main hover:bg-app-secondary transition-colors duration-200"
      >
        Clear All Filters
      </button>
    </div>
  );
};

export default FilterSidebar;