import React from 'react';
import { PROPERTIES } from '../types';

interface PropertyInformationProps {
  formData: {
    property: string;
    cartType: string;
    cartNumber: string;
  };
  isGuestView: boolean;
  onPropertyChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

export function PropertyInformation({ formData, isGuestView, onPropertyChange }: PropertyInformationProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Property Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Property</label>
          {isGuestView ? (
            <input
              type="text"
              name="property"
              value={formData.property || 'Not selected'}
              readOnly
              aria-label="Property"
              title="Property"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 cursor-not-allowed"
            />
          ) : (
            <select
              name="property"
              value={formData.property}
              onChange={onPropertyChange}
              aria-label="Select property"
              title="Select property"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select property</option>
              {PROPERTIES.map(property => (
                <option key={property.id} value={property.name}>
                  {property.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cart Type</label>
          <input
            type="text"
            name="cartType"
            value={formData.cartType}
            readOnly
            aria-label="Cart Type"
            title="Cart Type"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Cart Number</label>
          <input
            type="text"
            name="cartNumber"
            value={formData.cartNumber}
            readOnly
            aria-label="Cart Number"
            title="Cart Number"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 bg-gray-100 cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
}