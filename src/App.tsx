import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import SignaturePad from 'react-signature-canvas';
import { format } from 'date-fns';
import { Property, PROPERTIES, Point, DiagramData } from './types';
import { sendToAirtable } from './components/AirtableService';
import { supabase, uploadPDF } from './lib/supabase';
import { GuestInformation } from './components/GuestInformation';
import { PropertyInformation } from './components/PropertyInformation';
import { DiagramCanvas } from './components/DiagramCanvas';
import { SignatureSection } from './components/SignatureSection';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ThankYou } from './components/ThankYou';
import { sendFormEmail } from './lib/email';
import { generateFormPDF } from './components/PDFGenerator';

interface FormData {
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  inspectionDate: string;
  property: string;
  cartType: string;
  cartNumber: string;
  observations: string;
}

interface PDFVersion {
  blob: Blob;
  base64: string;
}

interface PDFResult {
  download: PDFVersion;
  email: PDFVersion;
}

function InspectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    inspectionDate: format(new Date(), 'yyyy-MM-dd'),
    property: PROPERTIES[0].name,
    cartType: PROPERTIES[0].diagramType.includes('6seater') ? '6-Seater' : '4-Seater',
    cartNumber: PROPERTIES[0].cartNumber,
    observations: '',
  });
  
  const [isGuestView, setIsGuestView] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property>(PROPERTIES[0]);
  const [history, setHistory] = useState<Point[][]>([[]]);
  const [currentStep, setCurrentStep] = useState(0);
  
  const signaturePadRef = useRef<SignaturePad>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formContentRef = useRef<HTMLDivElement>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const handlePropertyChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const property = PROPERTIES.find(p => p.name === e.target.value);
    if (property) {
      setSelectedProperty(property);
      setFormData(prev => ({
        ...prev,
        property: property.name,
        cartType: property.diagramType.includes('6seater') ? '6-Seater' : '4-Seater',
        cartNumber: property.cartNumber
      }));
      setHistory([[]]);
      setCurrentStep(0);
    }
  }, []);

  const handlePointsChange = useCallback((newPoints: Point[]) => {
    setHistory(prev => [...prev.slice(0, currentStep + 1), newPoints]);
    setCurrentStep(prev => prev + 1);
  }, [currentStep]);

  const handleUndo = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const clearCanvas = useCallback(() => {
    if (!isGuestView) {
      setHistory([[]]);
      setCurrentStep(0);
    }
  }, [isGuestView]);

  const clearSignature = useCallback(() => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  }, []);

  const loadInspection = useCallback(async (inspectionId: string) => {
    setIsLoading(true);
    try {
      const { data: inspection, error } = await supabase
        .from('inspections')
        .select('*')
        .eq('id', inspectionId)
        .single();

      if (error) throw error;

      if (inspection) {
        setFormData({
          guestName: inspection.guest_name,
          guestEmail: inspection.guest_email,
          guestPhone: inspection.guest_phone,
          inspectionDate: inspection.inspection_date,
          property: inspection.property,
          cartType: inspection.cart_type,
          cartNumber: inspection.cart_number,
          observations: inspection.observations || '',
        });

        const property = PROPERTIES.find(p => p.name === inspection.property);
        if (property) {
          setSelectedProperty(property);
        }

        if (inspection.diagram_data) {
          const diagramData = inspection.diagram_data as DiagramData;
          const loadedPoints = diagramData.points || [];
          setHistory([[...loadedPoints]]);
          setCurrentStep(0);
        }

        if (inspection.status === 'completed') {
          navigate('/thank-you');
          return;
        }
      }
    } catch (error) {
      console.error('Error loading inspection:', error);
      alert('Error loading inspection. Please try again.');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    setIsGuestView(!!id);
    if (id) {
      loadInspection(id);
    }
  }, [id, loadInspection]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      // Validar firma en vista de invitado
      if (isGuestView && !signaturePadRef.current?.toData()?.length) {
        alert('Please sign the form before submitting.');
        return;
      }

      // Generar PDF
      const pdfData = await generateFormPDF({
        contentRef: formContentRef
      }) as PDFResult | null;
      
      if (!pdfData) {
        throw new Error('Failed to generate PDF');
      }

      // Subir PDF a Supabase
      const pdfBlob = pdfData.download.blob;
      const pdfFilename = `${formData.property}_${formData.guestName.toLowerCase().replace(/\s+/g, '_')}_${formData.inspectionDate}.pdf`;
      const pdfUrl = await uploadPDF(pdfBlob, pdfFilename);

      if (!pdfUrl) {
        throw new Error('Failed to upload PDF');
      }

      if (!isGuestView) {
        // Crear nueva inspección
        const { data: inspection, error } = await supabase
          .from('inspections')
          .insert([
            {
              guest_name: formData.guestName,
              guest_email: formData.guestEmail,
              guest_phone: formData.guestPhone,
              inspection_date: formData.inspectionDate,
              property: formData.property,
              cart_type: formData.cartType,
              cart_number: formData.cartNumber,
              diagram_data: {
                points: history[currentStep] || []
              },
              status: 'pending'
            }
          ])
          .select()
          .single();

        if (error) throw error;

        // Enviar email al invitado
        await sendFormEmail('guest-form', {
          to_email: formData.guestEmail,
          to_name: formData.guestName,
          from_name: 'Golf Cart Inspection System',
          from_email: 'no-reply@email.golfcartinspection.app',
          property: formData.property,
          cart_type: formData.cartType,
          cart_number: formData.cartNumber,
          inspection_date: formData.inspectionDate,
          form_link: `${window.location.origin}/inspection/${inspection.id}`,
          pdf_attachment: pdfUrl
        });

        // Solo enviar a Airtable si es una nueva inspección
        // El envío real se hará cuando el guest firme

        // Descargar versión local
        try {
          if (pdfData && pdfData.download && pdfData.download.blob) {
            const downloadUrl = window.URL.createObjectURL(pdfData.download.blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = pdfFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
          } else {
            throw new Error('PDF data is not available for download');
          }
        } catch (downloadError) {
          console.error('Error downloading PDF:', downloadError);
          alert('Error downloading PDF. Please try again.');
        }

        navigate('/thank-you');
      } else {
        // Actualizar inspección existente
        const { error } = await supabase
          .from('inspections')
          .update({
            observations: formData.observations,
            signature_data: signaturePadRef.current?.toDataURL(),
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', id);

        if (error) throw error;

        // Enviar a Airtable cuando el guest firma
        if (pdfUrl) {
          try {
            await sendToAirtable({
              guestName: formData.guestName,
              inspectionDate: formData.inspectionDate,
              property: formData.property,
              formId: id
            }, pdfUrl);
            console.log('Datos enviados exitosamente a Airtable');
          } catch (airtableError) {
            console.error('Error al enviar datos a Airtable:', airtableError);
            // No lanzamos el error para no interrumpir el flujo principal
          }
        } else {
          console.error('No se pudo enviar a Airtable: URL del PDF no disponible');
        }

        // Enviar email de confirmación
        await sendFormEmail('completed-form', {
          to_email: formData.guestEmail,
          to_name: formData.guestName,
          from_name: 'Golf Cart Inspection System',
          from_email: 'no-reply@email.golfcartinspection.app',
          property: formData.property,
          cart_type: formData.cartType,
          cart_number: formData.cartNumber,
          inspection_date: formData.inspectionDate,
          observations: formData.observations,
          pdf_attachment: pdfUrl
        });

        // Descargar versión local
        try {
          if (pdfData && pdfData.download && pdfData.download.blob) {
            const downloadUrl = window.URL.createObjectURL(pdfData.download.blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = pdfFilename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(downloadUrl);
          } else {
            throw new Error('PDF data is not available for download');
          }
        } catch (downloadError) {
          console.error('Error downloading PDF:', downloadError);
          alert('Error downloading PDF. Please try again.');
        }

        navigate('/thank-you');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSending(false);
    }
  }, [formData, history, currentStep, id, isGuestView, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <img src="/diagrams/logo.png" alt="Golf Cart Inspection Logo" className="mx-auto h-32 mb-6" />
          <h1 className="text-3xl font-bold text-gray-900">Golf Cart Inspection</h1>
          <p className="mt-2 text-sm text-gray-600">
            {isGuestView ? 'Please review and sign the inspection form' : 'Fill out the inspection details below'}
          </p>
        </div>

        <form ref={formRef} onSubmit={handleSubmit}>
          <div ref={formContentRef} className="space-y-8">
            <div className="space-y-8">
              <GuestInformation
                formData={formData}
                onInputChange={handleInputChange}
                isGuestView={isGuestView}
              />

              <PropertyInformation
                formData={formData}
                onPropertyChange={handlePropertyChange}
                isGuestView={isGuestView}
              />

              <div className="border-t pt-8">
                <h2 className="text-xl font-semibold mb-4">Cart Diagram</h2>
                <DiagramCanvas
                  selectedProperty={selectedProperty || PROPERTIES[0]}
                  history={history}
                  currentStep={currentStep}
                  onPointsChange={handlePointsChange}
                  onUndo={handleUndo}
                  onClear={clearCanvas}
                  isGuestView={isGuestView}
                />
              </div>

              <div className="border-t pt-8">

                <SignatureSection
                  signaturePadRef={signaturePadRef}
                  onClearSignature={clearSignature}
                  isGuestView={true}
                  observations={formData.observations}
                  onObservationsChange={handleInputChange}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={isSending}
              className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {isSending ? 'Sending...' : isGuestView ? 'Submit Inspection' : 'Send to Guest'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<InspectionForm />} />
      <Route path="/inspection/:id" element={<InspectionForm />} />
      <Route path="/thank-you" element={<ThankYou />} />
    </Routes>
  );
}

export default App;
