'use client';

import React, { useState, useEffect, useRef, useId, useCallback, useMemo } from 'react';

interface BarangayOption {
  psgcCode: string;
  name: string;
}

interface BarangaySelectProps {
  cityPsgcCode: string | null;
  value: string | null; // psgcCode of selected barangay
  selectedName: string | null; // display name of selected barangay
  onChange: (psgcCode: string | null, name: string | null) => void;
  googleSublocalityHint?: string | null;
  disabled?: boolean;
}

export const BarangaySelect: React.FC<BarangaySelectProps> = ({
  cityPsgcCode,
  value,
  selectedName,
  onChange,
  googleSublocalityHint,
  disabled,
}) => {
  const [loadedBarangays, setLoadedBarangays] = useState<{
    cityPsgcCode: string | null;
    items: BarangayOption[];
  }>({ cityPsgcCode: null, items: [] });
  const [search, setSearch] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const autoMatchKeyRef = useRef<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const uniqueId = useId();
  const selectId = `barangay-select-${uniqueId}`;
  const listboxId = `barangay-listbox-${uniqueId}`;

  // Fetch barangays when city changes
  useEffect(() => {
    if (!cityPsgcCode) return;

    let cancelled = false;
    const requestedCityCode = cityPsgcCode;

    fetch(`/api/address/ph/barangays?cityPsgcCode=${requestedCityCode}`)
      .then(res => res.ok ? res.json() : Promise.reject('Failed'))
      .then(data => {
        if (!cancelled) {
          setLoadedBarangays({
            cityPsgcCode: requestedCityCode,
            items: data.barangays || [],
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadedBarangays({ cityPsgcCode: requestedCityCode, items: [] });
        }
      });

    return () => { cancelled = true; };
  }, [cityPsgcCode]);

  const barangays = useMemo(
    () => loadedBarangays.cityPsgcCode === cityPsgcCode ? loadedBarangays.items : [],
    [cityPsgcCode, loadedBarangays],
  );
  const loading = Boolean(cityPsgcCode && loadedBarangays.cityPsgcCode !== cityPsgcCode);

  // Auto-match Google hint when barangays load
  useEffect(() => {
    if (!cityPsgcCode || !googleSublocalityHint || barangays.length === 0 || value) return;
    const autoMatchKey = `${cityPsgcCode}:${googleSublocalityHint}`;
    if (autoMatchKeyRef.current === autoMatchKey) return;
    autoMatchKeyRef.current = autoMatchKey;

    const normalizeForMatch = (s: string) =>
      s.trim().toLowerCase()
        .replace(/^barangay\s+/i, '')
        .replace(/^brgy\.?\s*/i, '')
        .replace(/['']/g, "'")
        .replace(/\s+/g, ' ');

    const hint = normalizeForMatch(googleSublocalityHint);
    const matches = barangays.filter(b => normalizeForMatch(b.name) === hint);

    if (matches.length === 1) {
      onChange(matches[0].psgcCode, matches[0].name);
    }
  }, [barangays, cityPsgcCode, googleSublocalityHint, value, onChange]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = search.trim()
    ? barangays.filter(b => b.name.toLowerCase().includes(search.toLowerCase()))
    : barangays;

  const handleSelect = useCallback((brgy: BarangayOption) => {
    onChange(brgy.psgcCode, brgy.name);
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
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsOpen(true);
      return;
    }
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex(prev => Math.min(prev + 1, filtered.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          handleSelect(filtered[highlightIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setHighlightIndex(-1);
        break;
    }
  };

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightIndex >= 0 && listRef.current) {
      const item = listRef.current.children[highlightIndex] as HTMLElement;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightIndex]);

  if (!cityPsgcCode) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Barangay / District <span className="text-red-500">*</span>
        </label>
        <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100 text-gray-400 text-sm">
          Select a city first
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Barangay / District <span className="text-red-500">*</span>
        </label>
        <div className="w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-50 text-gray-500 text-sm flex items-center gap-2">
          <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading barangays…
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
        Barangay / District <span className="text-red-500">*</span>
      </label>

      {value && selectedName ? (
        <div className="w-full px-3 py-2 border border-green-300 rounded-md bg-green-50 text-sm flex items-center justify-between">
          <span className="text-green-800 font-medium">{selectedName}</span>
          {!disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="text-green-600 hover:text-green-800 text-xs font-medium ml-2"
              aria-label="Change barangay"
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
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder={`Search from ${barangays.length} barangays…`}
            role="combobox"
            aria-expanded={isOpen}
            aria-controls={listboxId}
            aria-activedescendant={highlightIndex >= 0 ? `${listboxId}-option-${highlightIndex}` : undefined}
            autoComplete="off"
          />

          {isOpen && (
            <ul
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-gray-400">
                  {search ? 'No matching barangays' : 'No barangays available'}
                </li>
              ) : (
                filtered.map((brgy, idx) => (
                  <li
                    key={brgy.psgcCode}
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
                      handleSelect(brgy);
                    }}
                    onMouseEnter={() => setHighlightIndex(idx)}
                  >
                    {brgy.name}
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
