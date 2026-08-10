import React, { useState, useEffect, useRef, useId } from 'react';
import { AddressSuggestion } from '@/lib/address/types';

interface AddressAutocompleteProps {
  countryCode: string | null;
  onSelect: (placeId: string, sessionToken: string) => void | Promise<void>;
  disabled?: boolean;
}

function generateSessionToken() {
  return crypto.randomUUID();
}

export const AddressAutocomplete: React.FC<AddressAutocompleteProps> = ({ countryCode, onSelect, disabled }) => {
  const currentRequestRef = useRef<string | null>(null);
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const uniqueId = useId();
  const inputId = `address-autocomplete-input-${uniqueId}`;
  const listboxId = `address-suggestions-list-${uniqueId}`;
  const labelId = `address-autocomplete-label-${uniqueId}`;
  const [activeIndex, setActiveIndex] = useState(-1);
  const [sessionToken, setSessionToken] = useState(generateSessionToken());
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const lastSearchedInputRef = useRef<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);
    setActiveIndex(-1);
    
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    
    if (val.trim().length < 3 || !countryCode) {
      setSuggestions([]);
      setIsOpen(false);
      lastSearchedInputRef.current = '';
      return;
    }

    setLoading(true);
    setError(null);
    debounceRef.current = setTimeout(async () => {
      if (val === lastSearchedInputRef.current) {
        setLoading(false);
        setIsOpen(suggestions.length > 0);
        return;
      }
      
      lastSearchedInputRef.current = val;
      abortControllerRef.current = new AbortController();
      const requestId = crypto.randomUUID();
      currentRequestRef.current = requestId;

      try {
        const res = await fetch(`/api/address/autocomplete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            input: val,
            countryCode,
            sessionToken
          }),
          signal: abortControllerRef.current.signal
        });
        
        if (currentRequestRef.current !== requestId) return; // Latest request wins guard
        
        if (!res.ok) throw new Error('Search unavailable');
        const data = await res.json();
        
        if (data.status === 'PROVIDER_UNAVAILABLE') {
          setError('Address search is temporarily unavailable.');
          setSuggestions([]);
        } else if (data.status === 'NO_RESULTS') {
          setSuggestions([]);
        } else {
          setSuggestions(data.suggestions || []);
        }
        setIsOpen(true);
      } catch (err: unknown) {
        if (currentRequestRef.current !== requestId) return; // Latest request wins guard
        if (err instanceof Error && err.name === 'AbortError') return;
        setError('Address search is temporarily unavailable.');
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = async (placeId: string, mainText: string) => {
    setInput(mainText);
    setIsOpen(false);
    await onSelect(placeId, sessionToken);
    // Regenerate session token for next search
    setSessionToken(generateSessionToken());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        const selected = suggestions[activeIndex];
        handleSelect(selected.placeId, selected.mainText);
      }
    } else if (e.key === 'Escape' || e.key === 'Tab') {
      setIsOpen(false);
    }
  };

  return (
    <div className="mb-4 relative" ref={wrapperRef}>
      <label htmlFor={inputId} id={labelId} className="block text-sm font-medium text-gray-700 mb-1">
        Find your address *
      </label>
      <input
        id={inputId}
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        disabled={disabled || !countryCode}
        placeholder={countryCode ? "Start typing your address..." : "Select a country first"}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
        autoComplete="off"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `suggestion-${uniqueId}-${activeIndex}` : undefined}
        aria-labelledby={labelId}
      />
      
      <div aria-live="assertive" className="sr-only">
        {loading ? 'Searching for address...' : 
         error ? error : 
         (!loading && !error && suggestions.length === 0 && input.length >= 3) ? 'No matching address found. Try entering manually.' :
         (isOpen && suggestions.length > 0) ? `${suggestions.length} suggestions available. Use up and down arrows to navigate.` : ''}
      </div>
      
      {isOpen && (
        <ul 
          id={listboxId}
          role="listbox"
          className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {loading && <li className="px-4 py-2 text-gray-500 text-sm" role="option" aria-selected="false">Searching...</li>}
          {error && <li className="px-4 py-2 text-red-500 text-sm" role="option" aria-selected="false">{error}</li>}
          {!loading && !error && suggestions.length === 0 && input.length >= 3 && (
            <li className="px-4 py-2 text-gray-500 text-sm" role="option" aria-selected="false">No matching address found. Try entering manually.</li>
          )}
          {suggestions.map((suggestion, index) => (
            <li 
              key={suggestion.placeId} 
              id={`suggestion-${uniqueId}-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              className={`px-4 py-2 cursor-pointer border-b last:border-0 border-gray-100 ${activeIndex === index ? 'bg-blue-100' : 'hover:bg-blue-50'}`}
              onClick={() => handleSelect(suggestion.placeId, suggestion.mainText)}
            >
              <div className="font-medium text-gray-800 text-sm">{suggestion.mainText}</div>
              <div className="text-xs text-gray-500 truncate">{suggestion.description}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
