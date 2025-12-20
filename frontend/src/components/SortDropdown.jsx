import React, { useState, useRef, useEffect } from 'react';

const SortDropdown = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleOptionSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = options.find(option => option.value === value);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={toggleDropdown}
        className={`flex items-center justify-between space-x-3 px-4 py-2 border rounded-pro font-sans text-sm transition-all duration-200 min-w-[220px] ${
          isOpen
            ? 'border-app-accent bg-app-secondary text-app-main shadow-sm'
            : 'border-app-border bg-app-surface text-app-main hover:bg-app-secondary hover:border-app-accent/50'
        } focus:outline-none focus:ring-1 focus:ring-app-accent focus:border-app-accent`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center space-x-2">
          {selectedOption?.icon && (
            <svg className="w-4 h-4 text-app-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {selectedOption.icon}
            </svg>
          )}
          <span>{selectedOption?.label || 'Sort By'}</span>
        </div>
        <svg 
          className={`w-4 h-4 text-app-muted transition-transform duration-200 ${isOpen ? 'rotate-180 text-app-accent' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-full bg-app-surface rounded-pro shadow-lg border border-app-border z-50 overflow-hidden">
          <div className="py-1">
            {options.map((option, index) => (
              <button
                key={option.value}
                onClick={() => handleOptionSelect(option.value)}
                className={`block w-full text-left px-4 py-3 text-sm transition-all duration-200 ${
                  value === option.value
                    ? 'bg-app-accent text-white'
                    : 'text-app-main hover:bg-app-secondary'
                } ${index === 0 ? '' : 'border-t border-app-border/30'}`}
                role="option"
                aria-selected={value === option.value}
              >
                <div className="flex items-center space-x-3">
                  {option.icon && (
                    <svg 
                      className={`w-4 h-4 ${value === option.value ? 'text-white' : 'text-app-accent'}`} 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      {option.icon}
                    </svg>
                  )}
                  <span className="font-sans">{option.label}</span>
                  {value === option.value && (
                    <svg className="w-4 h-4 ml-auto text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortDropdown;