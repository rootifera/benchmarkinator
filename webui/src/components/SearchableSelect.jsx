import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';

const SearchableSelect = ({ 
  value, 
  onChange, 
  options = [], 
  placeholder = "Select option", 
  searchPlaceholder = "Search...",
  displayField = "name",
  valueField = "id",
  className = "",
  size = "md",
  required = false,
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Filter options based on search term
  const filteredOptions = options.filter(option => {
    const displayValue = option[displayField] || option.name || option.label || '';
    const searchableValue = option.searchText || option.title || displayValue;
    return searchableValue.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Find selected option for display
  const selectedOption = options.find(option => String(option[valueField]) === String(value));
  const displayValue = selectedOption ? (selectedOption[displayField] || selectedOption.name || selectedOption.label) : '';
  const descriptionValue = selectedOption?.description || '';
  const titleValue = selectedOption ? (selectedOption.title || selectedOption.searchText || displayValue) : '';

  const handleSelect = (option) => {
    onChange(option[valueField]);
    setIsOpen(false);
    setSearchTerm('');
  };

  const clearSelection = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const isSmall = size === 'sm';

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Main Select Button */}
      <button
        type="button"
        className={`
          w-full border border-gray-300 dark:border-gray-700 rounded-md
          focus:ring-2 focus:ring-primary-500 focus:border-transparent
          bg-white dark:bg-gray-800 text-gray-900 dark:text-white
          text-left flex items-center justify-between
          ${isSmall ? 'h-8 px-3 py-1 text-sm' : 'min-h-10 px-3 py-2'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-400 dark:hover:border-gray-500'}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
      >
        <span
          className={`min-w-0 flex-1 ${displayValue ? '' : 'text-gray-500 dark:text-gray-400'}`}
          title={titleValue}
        >
          <span className="block truncate">{displayValue || placeholder}</span>
          {descriptionValue && (
            <span className="mt-0.5 block whitespace-normal break-words text-xs leading-4 text-gray-500 dark:text-gray-400">
              {descriptionValue}
            </span>
          )}
        </span>
        <div className="ml-2 flex shrink-0 items-center gap-1">
          {value && !disabled && (
            <X 
              className="w-4 h-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              onClick={clearSelection}
            />
          )}
          <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-hidden">
          {/* Search Input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const optionValue = option[valueField];
                const optionDisplay = option[displayField] || option.name || option.label || '';
                const optionDescription = option.description || '';
                const optionTitle = option.title || option.searchText || optionDisplay;
                const isSelected = String(optionValue) === String(value);

                return (
                  <button
                    key={optionValue}
                    type="button"
                    className={`
                      w-full px-3 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-800
                      ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}
                    `}
                    onClick={() => handleSelect(option)}
                    title={optionTitle}
                  >
                    <span className="block truncate">{optionDisplay}</span>
                    {optionDescription && (
                      <span className={`mt-0.5 block whitespace-normal break-words text-xs leading-4 ${isSelected ? 'text-primary-600 dark:text-primary-300' : 'text-gray-500 dark:text-gray-400'}`}>
                        {optionDescription}
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden input for form validation */}
      {required && (
        <input
          type="hidden"
          value={value}
          required={required}
        />
      )}
    </div>
  );
};

export default SearchableSelect;
