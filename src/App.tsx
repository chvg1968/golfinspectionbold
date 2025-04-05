import React, { useRef, useState, useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import SignaturePad from 'react-signature-canvas';
import { format } from 'date-fns';
import { Property, PROPERTIES, Point, DiagramData } from './types';
import { supabase } from './lib/supabase';
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

function InspectionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    inspectionDate: format(new Date(), 'yyyy-MM-dd'),
    property: '',
    cartType: '',
    cartNumber: '',
    observations: '',
  });
  
  const [isGuestView, setIsGuestView] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [history, setHistory] = useState<Point[][]>([[]]);
  const [currentStep, setCurrentStep] = useState(0);
  
  const signaturePadRef = useRef<SignaturePad>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const formContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsGuestView(!!id);
    if (id) {
      loadInspection(id);
    }
  }, [id]);

  const loadInspection = async (inspectionId: string) => {
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
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePropertyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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
  };

  const handlePointsChange = (newPoints: Point[]) => {
    setHistory(prev => [...prev.slice(0, currentStep + 1), newPoints]);
    setCurrentStep(prev => prev + 1);
  };

  const handleUndo = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const clearCanvas = () => {
    if (!isGuestView) {
      setHistory([[]]);
      setCurrentStep(0);
    }
  };

  const clearSignature = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    
    try {
      if (isGuestView && id) {
        if (!signaturePadRef.current || signaturePadRef.current.isEmpty()) {
          alert('Please provide your signature before submitting.');
          setIsSending(false);
          return;
        }

        const diagramData: DiagramData = {
          points: history[currentStep] || [],
          width: 600,
          height: 400
        };

        const signatureData = signaturePadRef.current?.toDataURL();

        const { error: updateError } = await supabase
          .from('inspections')
          .update({
            observations: formData.observations,
            diagram_data: diagramData,
            signature_data: signatureData,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .eq('id', id);

        if (updateError) throw updateError;

        const pdfData = await generateFormPDF({ contentRef: formContentRef });
        if (!pdfData) throw new Error('Error generating PDF');

        // Enviar email con la versión optimizada para email
        await sendFormEmail('completed-form', {
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          property: formData.property,
          inspectionData: {
            observations: formData.observations,
            cartType: formData.cartType,
            cartNumber: formData.cartNumber,
          },
          pdfBase64: pdfData.email.base64,
        });

        // Descargar versión de alta calidad
        const pdfBlob = pdfData.download.blob;
        const pdfFileName = `inspection-form-${formData.property.replace(/\s+/g, '-').toLowerCase()}.pdf`;

        try {
          // Intentar descarga usando Blob URL
          const downloadUrl = window.URL.createObjectURL(pdfBlob);
          const downloadLink = document.createElement('a');
          downloadLink.href = downloadUrl;
          downloadLink.download = pdfFileName;
          downloadLink.style.display = 'none';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          window.URL.revokeObjectURL(downloadUrl);
        } catch (error) {
          console.error('Error downloading PDF:', error);
          throw new Error('Failed to download PDF');
        }

        alert('Form submitted successfully!');
        navigate('/thank-you');
      } else {
        const { data: inspection, error: insertError } = await supabase
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
                points: history[currentStep] || [],
                width: 600,
                height: 400
              },
              status: 'pending'
            }
          ])
          .select()
          .single();

        if (insertError) throw insertError;

        const shareableLink = `${window.location.origin}/inspection/${inspection.id}`;
        
        await sendFormEmail('guest-form', {
          guestName: formData.guestName,
          guestEmail: formData.guestEmail,
          property: formData.property,
          inspectionDate: formData.inspectionDate,
          formLink: shareableLink,
        });

        alert('Form link sent successfully to guest!');
        setFormData({
          guestName: '',
          guestEmail: '',
          guestPhone: '',
          inspectionDate: format(new Date(), 'yyyy-MM-dd'),
          property: '',
          cartType: '',
          cartNumber: '',
          observations: '',
        });
        setSelectedProperty(null);
        setHistory([[]]);
        setCurrentStep(0);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Error submitting form. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div ref={formContentRef}>
          <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            {isGuestView ? 'Complete Inspection Form' : 'Create Inspection Form'}
          </h1>
          
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-8">
            <GuestInformation
              formData={formData}
              isGuestView={isGuestView}
              onInputChange={handleInputChange}
            />

            <PropertyInformation
              formData={formData}
              isGuestView={isGuestView}
              onPropertyChange={handlePropertyChange}
            />

            <DiagramCanvas
              isGuestView={isGuestView}
              selectedProperty={selectedProperty}
              history={history}
              currentStep={currentStep}
              onUndo={handleUndo}
              onClear={clearCanvas}
              onPointsChange={handlePointsChange}
            />

            <SignatureSection
              isGuestView={isGuestView}
              observations={formData.observations}
              onObservationsChange={handleInputChange}
              signaturePadRef={signaturePadRef}
              onClearSignature={clearSignature}
            />

            <div className="flex justify-end space-x-4">
              <button
                type="submit"
                disabled={isSending}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending ? 'Processing...' : (isGuestView ? 'Sign and Download PDF' : 'Send to Guest')}
              </button>
            </div>
          </form>
        </div>
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