import React, { useState, useEffect, useId } from 'react';
import { CountrySelect } from './CountrySelect';
import { AddressAutocomplete } from './AddressAutocomplete';
import { NormalizedAddress } from '@/lib/address/types';

interface AddressFormProps {
  initialAddress?: NormalizedAddress | null;
  onAddressChange: (address: NormalizedAddress) => void;
  disabled?: boolean;
}

const emptyAddress: NormalizedAddress = {
  addressLine1: null,
  addressLine2: null,
  sublocality: null,
  locality: null,
  administrativeArea2: null,
  administrativeArea1: null,
  postalCode: null,
  countryCode: null,
  formattedAddress: null,
  latitude: null,
  longitude: null,
  provider: 'MANUAL',
  providerPlaceId: null,
  validationStatus: 'UNVERIFIED',
  validationLevel: null,
  manuallyEdited: true,
  validatedAt: null,
};

export const AddressForm: React.FC<AddressFormProps> = ({ initialAddress, onAddressChange, disabled }) => {
  const [address, setAddress] = useState<NormalizedAddress>(initialAddress || emptyAddress);
  const [manualMode, setManualMode] = useState(initialAddress?.addressLine1 ? !initialAddress.providerPlaceId : false);
  
  const uniqueId = useId();
  const idLine1 = `address-line1-${uniqueId}`;
  const idLine2 = `address-line2-${uniqueId}`;
  const idSubloc = `address-subloc-${uniqueId}`;
  const idLoc = `address-loc-${uniqueId}`;
  const idAdmin = `address-admin-${uniqueId}`;
  const idPostal = `address-postal-${uniqueId}`;

  useEffect(() => {
    onAddressChange(address);
  }, [address, onAddressChange]);

  const hasMeaningfulAddressData = (addr: NormalizedAddress) => {
    return !!(
      addr.addressLine1 || 
      addr.addressLine2 || 
      addr.sublocality || 
      addr.locality || 
      addr.administrativeArea2 || 
      addr.administrativeArea1 || 
      addr.postalCode || 
      addr.formattedAddress || 
      addr.providerPlaceId ||
      (typeof addr.latitude === 'number' && !isNaN(addr.latitude)) ||
      (typeof addr.longitude === 'number' && !isNaN(addr.longitude)) ||
      (addr.provider && addr.provider !== 'MANUAL') ||
      (addr.validationStatus && addr.validationStatus !== 'UNVERIFIED')
    );
  };

  const handleCountryChange = (countryCode: string) => {
    if (address.countryCode && address.countryCode !== countryCode && hasMeaningfulAddressData(address)) {
      if (!window.confirm("Changing the country will clear the selected address. Continue?")) {
        return;
      }
    }
    
    setAddress({
      ...emptyAddress,
      countryCode,
      manuallyEdited: false
    });
    setManualMode(false);
  };

  const [detailsError, setDetailsError] = useState<string | null>(null);

  const handleAutocompleteSelect = async (placeId: string, sessionToken: string) => {
    try {
      setDetailsError(null);
      const res = await fetch(`/api/address/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId, sessionToken })
      });
      if (res.ok) {
        const details = await res.json();
        setAddress({
          ...details,
          // Preserve any addressLine2 user already typed
          addressLine2: address.addressLine2
        });
        setManualMode(false);
      } else {
        setDetailsError('Could not retrieve address details. Please enter manually.');
        setManualMode(true);
      }
    } catch {
      console.error('Failed to get address details');
      setDetailsError('Could not retrieve address details. Please enter manually.');
      setManualMode(true);
    }
  };

  const handleFieldChange = (field: keyof NormalizedAddress, value: string) => {
    setAddress(prev => ({
      ...prev,
      [field]: value || null,
      manuallyEdited: field !== 'addressLine2' ? true : prev.manuallyEdited,
      validationStatus: field !== 'addressLine2' && prev.validationStatus === 'AUTOCOMPLETE_SELECTED' ? 'MANUAL' : prev.validationStatus
    }));
  };

  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-gray-50">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>
      
      <CountrySelect 
        value={address.countryCode} 
        onChange={handleCountryChange} 
        disabled={disabled}
      />
      
      {!manualMode && (
        <>
          <AddressAutocomplete 
            key={address.countryCode || 'empty'}
            countryCode={address.countryCode} 
            onSelect={handleAutocompleteSelect} 
            disabled={disabled}
          />
          {detailsError && (
            <div className="mb-4 text-sm font-medium text-red-700 bg-red-50 p-2 rounded">
              {detailsError}
            </div>
          )}
        </>
      )}

      {address.validationStatus === 'AUTOCOMPLETE_SELECTED' && !manualMode && (
        <div className="mb-4 text-sm font-medium text-green-700 bg-green-50 p-2 rounded flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
          Address selected
        </div>
      )}

      {(address.validationStatus === 'MANUAL' || address.validationStatus === 'UNVERIFIED') && address.addressLine1 && (
        <div className="mb-4 text-sm font-medium text-yellow-700 bg-yellow-50 p-2 rounded flex items-center">
          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
          Manually entered
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label htmlFor={idLine1} className="block text-sm font-medium text-gray-700 mb-1">Address Line 1 *</label>
          <input 
            id={idLine1}
            type="text" 
            value={address.addressLine1 || ''} 
            onChange={e => handleFieldChange('addressLine1', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Street address, building, house number"
          />
        </div>
        
        <div className="md:col-span-2">
          <label htmlFor={idLine2} className="block text-sm font-medium text-gray-700 mb-1">Address Line 2 (Optional)</label>
          <input 
            id={idLine2}
            type="text" 
            value={address.addressLine2 || ''} 
            onChange={e => handleFieldChange('addressLine2', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            placeholder="Apartment, unit, suite, or floor"
          />
        </div>

        <div>
          <label htmlFor={idSubloc} className="block text-sm font-medium text-gray-700 mb-1">
            {address.countryCode === 'PH' ? 'Barangay / District' : 'District / Sublocality'}
          </label>
          <input 
            id={idSubloc}
            type="text" 
            value={address.sublocality || ''} 
            onChange={e => handleFieldChange('sublocality', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor={idLoc} className="block text-sm font-medium text-gray-700 mb-1">City / Municipality</label>
          <input 
            id={idLoc}
            type="text" 
            value={address.locality || ''} 
            onChange={e => handleFieldChange('locality', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor={idAdmin} className="block text-sm font-medium text-gray-700 mb-1">
            {address.countryCode === 'PH' ? 'Province / Region' : 'State / Province / Region'}
          </label>
          <input 
            id={idAdmin}
            type="text" 
            value={address.administrativeArea1 || ''} 
            onChange={e => handleFieldChange('administrativeArea1', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>

        <div>
          <label htmlFor={idPostal} className="block text-sm font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
          <input 
            id={idPostal}
            type="text" 
            value={address.postalCode || ''} 
            onChange={e => handleFieldChange('postalCode', e.target.value)}
            disabled={disabled}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
          />
        </div>
      </div>
      
      {!manualMode && (
        <div className="mt-4 text-right">
          <button 
            type="button" 
            className="text-sm text-blue-600 font-medium hover:underline"
            onClick={() => setManualMode(true)}
            disabled={disabled}
          >
            Enter address manually
          </button>
        </div>
      )}
      {manualMode && (
        <div className="mt-4 text-right">
          <button 
            type="button" 
            className="text-sm text-blue-600 font-medium hover:underline"
            onClick={() => setManualMode(false)}
            disabled={disabled}
          >
            Search address instead
          </button>
        </div>
      )}
    </div>
  );
};
