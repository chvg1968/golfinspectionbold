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

interface PDFButtonProps {
  isSending: boolean;
  disabled?: boolean;
}

const generatePDFVersion = async (canvas: HTMLCanvasElement, quality: number): Promise<PDFVersion> => {
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

export async function generateFormPDF({ contentRef }: PDFGeneratorProps): Promise<{ 
  download: PDFVersion; 
  email: PDFVersion;
} | null> {
  if (!contentRef.current) return null;
  
  let tempContainer: HTMLDivElement | null = null;
  const buttons = contentRef.current.querySelectorAll('button');
  
  try {
    // Ocultar botones
    buttons.forEach(button => button.style.display = 'none');

    // Crear contenedor temporal
    tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'background-color: #ffffff; padding: 20px;';
    document.body.appendChild(tempContainer);

    // Agregar encabezado
    const header = document.createElement('div');
    header.style.cssText = 'text-align: center; margin-bottom: 20px;';
    header.innerHTML = `
      <img src="/diagrams/logo.png" style="height: 100px; margin-bottom: 10px;" />
      <h1 style="font-size: 24px; font-weight: bold; color: #1f2937;">Golf Cart Inspection</h1>
    `;
    tempContainer.appendChild(header);

    // Clonar contenido
    const contentClone = contentRef.current.cloneNode(true) as HTMLElement;
    
    // Copiar canvas
    const originalCanvases = contentRef.current.getElementsByTagName('canvas');
    const clonedCanvases = contentClone.getElementsByTagName('canvas');
    for (let i = 0; i < originalCanvases.length; i++) {
      const context = clonedCanvases[i].getContext('2d');
      if (context) {
        context.drawImage(originalCanvases[i], 0, 0);
      }
    }
    
    tempContainer.appendChild(contentClone);

    // Esperar a que las imágenes se carguen
    await Promise.all(
      Array.from(tempContainer.getElementsByTagName('img')).map(
        img => new Promise<void>((resolve, reject) => {
          if (img.complete) resolve();
          else {
            img.onload = () => resolve();
            img.onerror = () => reject(new Error(`Failed to load image: ${img.src}`));
          }
        })
      )
    );

    // Generar canvas
    const canvas = await html2canvas(tempContainer, {
      scale: 2.0,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      allowTaint: true,
      removeContainer: true,
      onclone: (clonedDoc) => {
        const canvases = clonedDoc.getElementsByTagName('canvas');
        Array.from(canvases).forEach(canvas => {
          canvas.style.cssText = 'display: block; width: 100%; height: auto; image-rendering: high-quality;';
        });
      }
    });

    // Generar versiones del PDF
    const [downloadVersion, emailVersion] = await Promise.all([
      generatePDFVersion(canvas, 0.7), // Alta calidad para descarga
      generatePDFVersion(canvas, 0.2)  // Baja calidad para email
    ]);

    return { download: downloadVersion, email: emailVersion };

  } catch (error: unknown) {
    console.error('Error generating PDF:', error);
    throw new Error('Failed to generate PDF: ' + (error instanceof Error ? error.message : String(error)));
  } finally {
    // Restaurar botones y limpiar
    buttons.forEach(button => button.style.display = '');
    if (tempContainer?.parentNode) {
      tempContainer.parentNode.removeChild(tempContainer);
    }
  }
}

export const PDFButton: React.FC<PDFButtonProps> = ({ isSending, disabled }) => (
  <button
    type="submit"
    disabled={disabled || isSending}
    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
  >
    <Download className="w-4 h-4 mr-2" />
    {isSending ? 'Processing...' : 'Sign and Download PDF'}
  </button>
);
