import React from 'react';

interface GuestInformationProps {
  formData: {
    guestName: string;
    guestEmail: string;
    guestPhone: string;
    inspectionDate: string;
  };
  isGuestView: boolean;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function GuestInformation({ formData, isGuestView, onInputChange }: GuestInformationProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Guest Information</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Guest Name</label>
          <input
            type="text"
            name="guestName"
            value={formData.guestName}
            onChange={onInputChange}
            readOnly={isGuestView}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 read-only:bg-gray-100 read-only:cursor-not-allowed"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            name="guestPhone"
            value={formData.guestPhone}
            onChange={onInputChange}
            readOnly={isGuestView}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 read-only:bg-gray-100 read-only:cursor-not-allowed"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="guestEmail"
            value={formData.guestEmail}
            onChange={onInputChange}
            readOnly={isGuestView}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 read-only:bg-gray-100 read-only:cursor-not-allowed"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Inspection Date</label>
          <input
            type="date"
            name="inspectionDate"
            value={formData.inspectionDate}
            onChange={onInputChange}
            readOnly={isGuestView}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 read-only:bg-gray-100 read-only:cursor-not-allowed"
            required
          />
        </div>
      </div>
    </section>
  );
}