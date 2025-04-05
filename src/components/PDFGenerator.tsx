import React from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

interface PDFGeneratorProps {
  contentRef: React.RefObject<HTMLDivElement>;
}

interface PDFVersion {
  blob: Blob;
  base64: string;
}

export async function generateFormPDF({ contentRef }: PDFGeneratorProps): Promise<{ 
  download: PDFVersion; 
  email: PDFVersion;
} | null> {
  if (!contentRef.current) return null;
  
  try {
    // Ocultar temporalmente los botones para la captura
    const buttons = contentRef.current.querySelectorAll('button');
    buttons.forEach(button => button.style.display = 'none');

    // Esperar a que las imágenes y canvas estén cargados
    await Promise.all(
      Array.from(contentRef.current.getElementsByTagName('img')).map(
        img => new Promise(resolve => {
          if (img.complete) resolve(true);
          else img.onload = () => resolve(true);
        })
      )
    );

    await new Promise(resolve => setTimeout(resolve, 500)); // Esperar que todo esté renderizado

    const canvas = await html2canvas(contentRef.current, {
      scale: 1.0,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      allowTaint: true,
      removeContainer: true,
      onclone: (clonedDoc) => {
        const canvases = clonedDoc.getElementsByTagName('canvas');
        Array.from(canvases).forEach(canvas => {
          canvas.style.display = 'block';
          canvas.style.width = '100%';
          canvas.style.height = 'auto';
        });
      }
    });

    // Restaurar los botones
    buttons.forEach(button => button.style.display = '');

    // Función para generar PDF con calidad configurable
    const generatePDF = async (quality: number): Promise<PDFVersion> => {
      const imgData = canvas.toDataURL('image/jpeg', quality);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
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
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (!reader.result) {
            reject(new Error('Failed to read PDF data'));
            return;
          }
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.onerror = () => reject(new Error('Failed to read PDF blob'));
        reader.readAsDataURL(blob);
      });

      return { blob, base64 };
    };

    const [downloadVersion, emailVersion] = await Promise.all([
      generatePDF(0.7), // Calidad media-alta para descarga
      generatePDF(0.2)  // Calidad muy reducida para email
    ]);

    return {
      download: downloadVersion,
      email: emailVersion
    };

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : String(error)));
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
      {isSending ? 'Processing...' : 'Sign and Download PDF'}
    </button>
  );
}
