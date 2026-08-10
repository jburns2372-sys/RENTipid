import React, { useId } from 'react';
import { COUNTRIES, CountryOption } from '@/lib/address/countryRegistry';

interface CountrySelectProps {
  value: string | null;
  onChange: (countryCode: string) => void;
  disabled?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({ value, onChange, disabled }) => {
  const uniqueId = useId();
  const selectId = `country-select-${uniqueId}`;
  return (
    <div className="mb-4">
      <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
        Country <span className="text-red-500">*</span>
      </label>
      <select
        id={selectId}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      >
        <option value="" disabled>Select a country</option>
        {COUNTRIES.map((c: CountryOption) => (
          <option key={c.countryCode} value={c.countryCode}>
            {c.countryName}
          </option>
        ))}
      </select>
    </div>
  );
};
