'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';

interface CityOption {
  psgcCode: string;
  name: string;
  geographicLevel: 'CITY' | 'MUNICIPALITY';
}

interface PhCitySelectProps {
  value: string | null; // psgcCode of selected city
  selectedName: string | null;
  onChange: (psgcCode: string | null, name: string | null) => void;
  disabled?: boolean;
}

export const PhCitySelect: React.FC<PhCitySelectProps> = ({
  value,
  selectedName,
  onChange,
  disabled,
}) => {
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const uniqueId = useId();
  const selectId = `ph-city-select-${uniqueId}`;
  const listboxId = `ph-city-listbox-${uniqueId}`;

  // Debounced search
  useEffect(() => {
    if (value) return; // Don't search if already selected
    if (search.trim().length < 2) {
      setCities([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(() => {
      setLoading(true);
      fetch(`/api/address/ph/cities?search=${encodeURIComponent(search.trim())}`)
        .then(res => res.ok ? res.json() : Promise.reject('Failed'))
        .then(data => {
          setCities(data.cities || []);
          setLoading(false);
        })
        .catch(() => {
          setCities([]);
          setLoading(false);
        });
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, value]);

  // Close on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSelect = useCallback((city: CityOption) => {
    onChange(city.psgcCode, city.name);
    setSearch('');
    setIsOpen(false);
    setHighlightIndex(-1);
  }, [onChange]);

  const handleClear = useCallback(() => {
    onChange(null, null);
    setSearch('');
    setIsOpen(true);
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => Math.min(prev + 1, cities.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < cities.length) {
          handleSelect(cities[highlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
        City / Municipality <span className="text-red-500">*</span>
      </label>

      {value && selectedName ? (
        <div className="w-full px-3 py-2 border border-green-300 rounded-md bg-green-50 text-sm flex items-center justify-between">
          <span className="text-green-800 font-medium">{selectedName}</span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-green-600 hover:text-green-800 text-xs font-medium ml-2"
              aria-label="Change city"
            >
              Change
            </button>
          )}
        </div>
      ) : (
        <>
          <input
            ref={inputRef}
            id={selectId}
            type="text"
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              setIsOpen(true);
              setHighlightIndex(-1);
            }}
            onFocus={() => { if (cities.length > 0) setIsOpen(true); }}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Type to search city or municipality…"
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={highlightIndex >= 0 ? `${listboxId}-option-${highlightIndex}` : undefined}
            autoComplete="off"
          />

          {isOpen && (search.trim().length >= 2) && (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {loading ? (
                <li className="px-3 py-2 text-sm text-gray-400 flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Searching…
                </li>
              ) : cities.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400">No matching cities</li>
              ) : (
                cities.map((city, idx) => (
                  <li
                    key={city.psgcCode}
                    id={`${listboxId}-option-${idx}`}
                    role="option"
                    aria-selected={highlightIndex === idx}
                    className={`px-3 py-2 text-sm cursor-pointer transition-colors ${
                      highlightIndex === idx
                        ? 'bg-blue-50 text-blue-800'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(city);
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    <span>{city.name}</span>
                    <span className="text-gray-400 text-xs ml-2">
                      {city.geographicLevel === 'CITY' ? 'City' : 'Municipality'}
                    </span>
                  </li>
                ))
              )}
            </ul>
          )}
        </>
      )}
    </div>
  );
};
