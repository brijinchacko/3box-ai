'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MapPin } from 'lucide-react';
import { searchCities, type CityEntry } from '@/lib/data/cities';

interface LocationInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  icon?: React.ElementType;
  className?: string;
  inputClassName?: string;
  id?: string;
}

export default function LocationInput({
  value,
  onChange,
  placeholder,
  label,
  icon: Icon,
  className = '',
  inputClassName,
  id,
}: LocationInputProps) {
  const [suggestions, setSuggestions] = useState<CityEntry[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const closeSuggestions = useCallback(() => {
    setIsOpen(false);
    setHighlightedIndex(-1);
    setSuggestions([]);
  }, []);

  // Debounced search
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      if (newValue.trim().length < 2) {
        closeSuggestions();
        return;
      }

      debounceRef.current = setTimeout(() => {
        const results = searchCities(newValue, 8);
        setSuggestions(results);
        setIsOpen(results.length > 0);
        setHighlightedIndex(-1);
      }, 150);
    },
    [onChange, closeSuggestions]
  );

  // Select a city from the dropdown
  const selectCity = useCallback(
    (city: CityEntry) => {
      onChange(city.displayLabel);
      closeSuggestions();
    },
    [onChange, closeSuggestions]
  );

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!isOpen || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setHighlightedIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
            selectCity(suggestions[highlightedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          closeSuggestions();
          break;
      }
    },
    [isOpen, suggestions, highlightedIndex, selectCity, closeSuggestions]
  );

  // Close dropdown on blur with a slight delay so click events register
  const handleBlur = useCallback(() => {
    setTimeout(() => {
      closeSuggestions();
    }, 200);
  }, [closeSuggestions]);

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && dropdownRef.current) {
      const items = dropdownRef.current.querySelectorAll('[data-suggestion]');
      const item = items[highlightedIndex];
      if (item) {
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const defaultInputClass = `w-full bg-white/[0.05] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-[#00d4ff]/50 focus:ring-1 focus:ring-[#00d4ff]/25 transition-all ${
    Icon ? 'pl-10' : ''
  }`;

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="text-sm text-gray-500 dark:text-white/50 mb-1.5 block"
        >
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-white/30 pointer-events-none" />
        )}

        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder={placeholder}
          autoComplete="off"
          className={inputClassName || defaultInputClass}
        />
      </div>

      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-[#1a1a2e] border border-gray-200 dark:border-white/10 rounded-lg shadow-xl overflow-hidden max-h-[240px] overflow-y-auto"
        >
          {suggestions.map((city, index) => (
            <div
              key={`${city.displayLabel}-${city.countryCode}-${index}`}
              data-suggestion
              onMouseDown={(e) => {
                e.preventDefault();
                selectCity(city);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`flex items-center gap-2.5 px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                highlightedIndex === index
                  ? 'bg-gray-100 dark:bg-white/[0.08] text-gray-900 dark:text-white'
                  : value === city.displayLabel
                  ? 'text-blue-600 dark:text-[#00d4ff]'
                  : 'text-gray-600 dark:text-white/70 hover:bg-gray-50 dark:hover:bg-white/[0.08]'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-gray-400 dark:text-white/30 flex-shrink-0" />
              <span>{city.displayLabel}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
