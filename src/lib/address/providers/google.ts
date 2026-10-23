import { AddressProvider, AddressSuggestion, NormalizedAddress } from '../types';

export class GoogleAddressProvider implements AddressProvider {
  private getApiKey(): string {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      throw new Error('Missing GOOGLE_MAPS_API_KEY configuration.');
    }
    return key;
  }

  async autocomplete(input: string, context?: Record<string, string>): Promise<{ status: string, suggestions: AddressSuggestion[] }> {
    if (!input || input.trim().length < 2) {
      return { status: 'NO_RESULTS', suggestions: [] };
    }

    const apiKey = this.getApiKey();
    // Using Google Places API (New) - Autocomplete
    const url = 'https://places.googleapis.com/v1/places:autocomplete';
    
    const requestBody: Record<string, string | string[]> = {
      input: input,
    };

    if (context?.countryCode) {
      // ISO 3166-1 Alpha-2
      requestBody.includedRegionCodes = [context.countryCode.toLowerCase()];
    }
    if (context?.sessionToken) {
      requestBody.sessionToken = context.sessionToken;
    }

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        await response.json().catch(() => ({}));
        console.error('Google Autocomplete Error Status:', response.status);
        
        if (response.status === 400) return { status: 'INVALID_PROVIDER_REQUEST', suggestions: [] };
        if (response.status === 403) return { status: 'PROVIDER_CONFIGURATION_MISSING', suggestions: [] };
        if (response.status === 429) return { status: 'RATE_LIMITED', suggestions: [] };
        
        return { status: 'PROVIDER_UNAVAILABLE', suggestions: [] };
      }

      const data = await response.json();
      const suggestions: AddressSuggestion[] = [];

      if (data.suggestions && data.suggestions.length > 0) {
        for (const prediction of data.suggestions) {
          if (prediction.placePrediction) {
            suggestions.push({
              placeId: prediction.placePrediction.placeId,
              mainText: prediction.placePrediction.text.text,
              secondaryText: '', // You can parse from structuredFormatting if needed
              description: prediction.placePrediction.text.text,
            });
          }
        }
        return { status: 'OK', suggestions };
      }

      return { status: 'NO_RESULTS', suggestions: [] };
    } catch {
      console.error('Failed to contact Google API');
      return { status: 'PROVIDER_UNAVAILABLE', suggestions: [] };
    }
  }

  async getDetails(placeId: string, context?: Record<string, string>): Promise<NormalizedAddress> {
    const apiKey = this.getApiKey();
    // Use Places API (New) - Get Place Details
    const url = `https://places.googleapis.com/v1/places/${placeId}?fields=id,formattedAddress,addressComponents,location`;
    
    // Add sessionToken to headers if provided, according to the API spec for Places Details
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
    };
    if (context?.sessionToken) {
      headers['X-Goog-FieldMask'] = 'id,formattedAddress,addressComponents,location';
      // Note: session token for Details might require specific header or param depending on the New API, 
      // typically it's included as a query parameter `sessionToken` or in the request body (which is GET so it has to be a header or param).
    }

    const response = await fetch(url + (context?.sessionToken ? `&sessionToken=${context.sessionToken}` : ''), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      console.error(JSON.stringify({
        event: "Address Details Error",
        stage: "GOOGLE_PLACE_DETAILS",
        upstreamStatus: response.status,
        errorType: "GooglePlacesError",
        errorCode: errBody?.error?.status || errBody?.error?.code || 'UNKNOWN'
      }));
      if (response.status === 400) throw new Error('INVALID_PROVIDER_REQUEST');
      if (response.status === 403) throw new Error('PROVIDER_CONFIGURATION_MISSING');
      if (response.status === 429) throw new Error('RATE_LIMITED');
      throw new Error('PROVIDER_UNAVAILABLE');
    }

    const place = await response.json();

    if (!place || !place.id) {
      throw new Error('NO_RESULTS');
    }

    const normalized: NormalizedAddress = {
      addressLine1: null,
      addressLine2: null,
      sublocality: null,
      locality: null,
      administrativeArea2: null,
      administrativeArea1: null,
      postalCode: null,
      countryCode: null,
      formattedAddress: place.formattedAddress || null,
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
      provider: 'google',
      providerPlaceId: place.id,
      validationStatus: 'AUTOCOMPLETE_SELECTED',
      validationLevel: 'PROVIDER',
      manuallyEdited: false,
      validatedAt: new Date().toISOString(),
    };

    let streetNumber = '';
    let route = '';

    if (place.addressComponents) {
      for (const component of place.addressComponents) {
        const types = component.types || [];
        
        if (types.includes('street_number')) {
          streetNumber = component.shortText || '';
        } else if (types.includes('route')) {
          route = component.shortText || '';
        } else if (types.includes('sublocality_level_1') || types.includes('sublocality') || types.includes('neighborhood')) {
          normalized.sublocality = component.longText;
        } else if (types.includes('locality') || types.includes('postal_town')) {
          normalized.locality = component.longText;
        } else if (types.includes('administrative_area_level_2')) {
          normalized.administrativeArea2 = component.longText;
        } else if (types.includes('administrative_area_level_1')) {
          normalized.administrativeArea1 = component.longText;
        } else if (types.includes('country')) {
          normalized.countryCode = component.shortText;
        } else if (types.includes('postal_code')) {
          normalized.postalCode = component.shortText;
        }
      }
    }

    const addressLine1 = [streetNumber, route].filter(Boolean).join(' ');
    if (addressLine1) {
      normalized.addressLine1 = addressLine1;
    }

    // Attempt to extract line 1 if components failed but we have formattedAddress
    if (!normalized.addressLine1 && normalized.formattedAddress) {
      normalized.addressLine1 = normalized.formattedAddress.split(',')[0];
    }

    return normalized;
  }
}
