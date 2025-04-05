import React, { useEffect, useRef } from 'react';
import SignaturePad from 'react-signature-canvas';

interface PassiveSignaturePadProps {
  canvasProps: React.DetailedHTMLProps<React.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;
  signaturePadRef: React.RefObject<SignaturePad>;
}

export function PassiveSignaturePad({ canvasProps, signaturePadRef }: PassiveSignaturePadProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: AddEventListenerOptions = {
      passive: true
    };

    const noop = () => {};

    // Add passive event listeners for touch events
    container.addEventListener('touchstart', noop, options);
    container.addEventListener('touchmove', noop, options);

    return () => {
      container.removeEventListener('touchstart', noop, options);
      container.removeEventListener('touchmove', noop, options);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <SignaturePad
        ref={signaturePadRef}
        canvasProps={canvasProps}
      />
    </div>
  );
}
