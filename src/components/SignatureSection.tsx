import React from 'react';
import SignaturePad from 'react-signature-canvas';

interface SignatureSectionProps {
  isGuestView: boolean;
  observations: string;
  onObservationsChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  signaturePadRef: React.RefObject<SignaturePad>;
  onClearSignature: () => void;
}

export function SignatureSection({
  isGuestView,
  observations,
  onObservationsChange,
  signaturePadRef,
  onClearSignature,
}: SignatureSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Terms and Signature</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Observations</label>
          <textarea
            name="observations"
            value={observations}
            onChange={onObservationsChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
        {isGuestView && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Signature</label>
            <div className="border border-gray-300 rounded-lg bg-white">
              <SignaturePad
                ref={signaturePadRef}
                canvasProps={{
                  className: 'signature-canvas',
                  style: {
                    width: '100%',
                    height: '160px',
                    maxWidth: '100%',
                    minHeight: '160px',
                    backgroundColor: 'white'
                  }
                }}
              />
            </div>
            <button
              type="button"
              onClick={onClearSignature}
              className="mt-2 px-3 py-1 bg-gray-200 rounded-md hover:bg-gray-300"
            >
              Clear Signature
            </button>
          </div>
        )}
      </div>
    </section>
  );
}