import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

interface PDFGeneratorProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

<<<<<<< HEAD
export async function generateFormPDF({ contentRef }: PDFGeneratorProps): Promise<{ blob: Blob; base64: string } | null> {
  if (!contentRef.current) return null;
  
  try {
    // Ocultar temporalmente los botones para la captura
    const buttons = contentRef.current.querySelectorAll('button');
    buttons.forEach(button => button.style.display = 'none');

    const canvas = await html2canvas(contentRef.current, {
      scale: 1.5, // Reducido para disminuir el tamaño del archivo
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      allowTaint: true,
      removeContainer: true
    });

    // Restaurar los botones
    buttons.forEach(button => button.style.display = '');

    // Comprimir la imagen antes de añadirla al PDF
    const imgData = canvas.toDataURL('image/jpeg', 0.7);
=======
export async function generateFormPDF({ contentRef }: PDFGeneratorProps) {
  if (!contentRef.current) return null;
  
  try {
    const canvas = await html2canvas(contentRef.current);
    const imgData = canvas.toDataURL('image/png');
>>>>>>> f0b21650ba5eb0efc04b5981ca6969c441ed5566
    
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
<<<<<<< HEAD
      format: 'a4',
      compress: true,
      hotfixes: ['px_scaling']
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    const widthRatio = pageWidth / canvas.width;
    const heightRatio = pageHeight / canvas.height;
    const ratio = Math.min(widthRatio, heightRatio);

    const canvasWidth = canvas.width * ratio;
    const canvasHeight = canvas.height * ratio;

    const marginX = (pageWidth - canvasWidth) / 2;
    const marginY = (pageHeight - canvasHeight) / 2;

    pdf.addImage(imgData, 'JPEG', marginX, marginY, canvasWidth, canvasHeight, undefined, 'FAST');
    
    const blob = pdf.output('blob');
    const base64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        resolve(base64String.split(',')[1]);
      };
      reader.readAsDataURL(blob);
    });

    return { blob, base64 };
=======
      format: [canvas.width, canvas.height]
    });
    
    pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
    return pdf.output('blob');
>>>>>>> f0b21650ba5eb0efc04b5981ca6969c441ed5566
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
<<<<<<< HEAD
      {isSending ? 'Processing...' : 'Sign and Download PDF'}
=======
      {isSending ? 'Generating PDF...' : 'Submit and Download PDF'}
>>>>>>> f0b21650ba5eb0efc04b5981ca6969c441ed5566
    </button>
  );
}