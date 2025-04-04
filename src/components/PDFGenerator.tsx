import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

interface PDFGeneratorProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

export async function generateFormPDF({ contentRef }: PDFGeneratorProps) {
  if (!contentRef.current) return null;
  
  try {
    const canvas = await html2canvas(contentRef.current);
    const imgData = canvas.toDataURL('image/png');
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    return pdf.output('blob');
  } catch (error) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
}

interface PDFButtonProps {
  isSending: boolean;
  disabled?: boolean;
}

export function PDFButton({ isSending, disabled }: PDFButtonProps) {
  return (
    <button
      type="submit"
      disabled={disabled || isSending}
      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4 mr-2" />
      {isSending ? 'Generating PDF...' : 'Submit and Download PDF'}
    </button>
  );
}