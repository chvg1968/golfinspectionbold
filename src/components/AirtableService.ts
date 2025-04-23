import { generateFormId } from '../lib/generate-form-id';

/**
 * Servicio para enviar datos a Airtable
 */

interface InspectionFormData {
    guestName: string;
    inspectionDate: string;
    property: string;
    formId?: string;
    inspectionStatus: string
}

// Interfaces para las respuestas de Airtable
interface AirtableRecord {
    id: string;
    createdTime: string;
    fields: Record<string, unknown>; // Usamos unknown para flexibilidad, pero se podría definir más estrictamente
}

interface AirtableErrorResponse {
    error?: {
        type: string;
        message: string;
    };
    message?: string; // A veces Airtable devuelve un 'message' en lugar de 'error'
}

interface AirtableSearchResponse extends AirtableErrorResponse {
    records?: AirtableRecord[];
}

interface AirtableCreateResponse extends AirtableRecord, AirtableErrorResponse {}

interface AirtableUpdateResponse extends AirtableRecord, AirtableErrorResponse {}


/**
 * Crea un registro en Airtable y retorna el recordId (id de Airtable)
 * @returns El recordId de Airtable, o null si falla
 */
export async function sendToAirtable(formData: InspectionFormData, pdfLink: string): Promise<string | null> {
    // Solo enviar a Airtable si hay un PDF link (implica que está firmado)
    if (!pdfLink) {
        console.log('No hay PDF firmado, no se envía a Airtable');
        return null;
    }
    
    console.log(`Enviando a Airtable con PDF link: ${pdfLink}`);

    // Validar que el pdfLink sea una URL válida
    try {
        new URL(pdfLink);
    } catch {
        console.error(`El pdfLink no es una URL válida: ${pdfLink}`);
        return null;
    }

    // Validar variables de entorno
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME;
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

    if (!baseId || !tableName || !apiKey) {
        const missingVars = [];
        if (!baseId) missingVars.push('VITE_AIRTABLE_BASE_ID');
        if (!tableName) missingVars.push('VITE_AIRTABLE_TABLE_NAME');
        if (!apiKey) missingVars.push('VITE_AIRTABLE_API_KEY');
        throw new Error(`Faltan variables de entorno de Airtable: ${missingVars.join(', ')}`);
    }

    console.log('Iniciando envío a Airtable...', {
        formData,
        pdfLink,
        baseId,
        tableName
    });

    try {
        interface AirtableFields {
            'Form Id': string;
            'Inspection Status': string;
            'Guest Name': string;
            'Property': string;
            'Inspection Date': string;
            'PDF Link': string;
        }

        // Asegurarse de que el pdfLink sea una URL válida y accesible
        let finalPdfLink = pdfLink;
        
        // Si el pdfLink parece ser un ID o path relativo, construir la URL completa
        if (!pdfLink.startsWith('http')) {
            const supabaseProjectId = 'lngsgyvpqhjmedjrycqw';
            const pdfFileName = `${formData.property.toLowerCase().replace(/\s+/g, '_')}_${formData.guestName.toLowerCase().replace(/\s+/g, '_')}_${formData.inspectionDate.replace(/-/g, '_')}.pdf`;
            finalPdfLink = `https://${supabaseProjectId}.supabase.co/storage/v1/object/public/pdfs/${pdfFileName}`;
            console.log('Construyendo URL completa para PDF:', finalPdfLink);
        }

        // Verificar que finalPdfLink sea una URL válida
        try {
            new URL(finalPdfLink);
        } catch {
            console.error(`El finalPdfLink no es una URL válida: ${finalPdfLink}`);
            return null;
        }

        const fields: AirtableFields = {
            'Form Id': formData.formId || generateFormId(formData.guestName),
            'Inspection Status': formData.inspectionStatus || 'Pending',
            'Inspection Date': formData.inspectionDate,
            'Guest Name': formData.guestName,
            'Property': formData.property,
            'PDF Link': finalPdfLink
        };

        // Validar que todos los campos tengan valor
        const emptyFields = Object.entries(fields)
            .filter(([, value]) => !value)
            .map(([key]) => key);

        if (emptyFields.length > 0) {
            throw new Error(`Los siguientes campos están vacíos: ${emptyFields.join(', ')}`);
        }

        const airtableData = { fields };

        // Corregir el acceso a la variable de entorno
        if (!import.meta.env.VITE_AIRTABLE_BASE_ID || !import.meta.env.VITE_AIRTABLE_TABLE_NAME || !import.meta.env.VITE_AIRTABLE_API_KEY) {
            throw new Error('Faltan variables de entorno de Airtable');
        }

        const baseUrl = `https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE_ID}/${import.meta.env.VITE_AIRTABLE_TABLE_NAME}`;
        const headers = {
            'Authorization': `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        };

        // Verificar si ya existe un registro con el mismo Form Id
        const searchUrl = `${baseUrl}?filterByFormula=${encodeURIComponent(`{Form Id}='${fields['Form Id']}'`)}`;
        const searchResponse = await fetch(searchUrl, { headers });
        // Tipar la respuesta JSON
        const searchData: AirtableSearchResponse = await searchResponse.json();

        if (!searchResponse.ok) {
             console.error('Error en la búsqueda de Airtable:', {
                status: searchResponse.status,
                statusText: searchResponse.statusText,
                error: searchData.error || searchData.message,
                formId: fields['Form Id']
            });
            // Lanzar un error o devolver null según la lógica deseada
             throw new Error(`Error buscando en Airtable: ${searchData.error?.message || searchData.message || 'Error desconocido'}`);
        }


        if (searchData.records && searchData.records.length > 0) {
            console.log('El registro ya existe en Airtable');
            // Devuelve el recordId existente
            return searchData.records[0].id;
        }

        // Crear nuevo registro si no existe
        console.log('Enviando nuevo registro a Airtable:', { url: baseUrl, data: airtableData });

        const response = await fetch(
            baseUrl,
            {
                method: 'POST',
                headers,
                body: JSON.stringify(airtableData)
            }
        );

        // Tipar la respuesta JSON
        const responseData: AirtableCreateResponse = await response.json();
        console.log('Respuesta de Airtable:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData
        });

        if (!response.ok) {
            console.error('Error detallado de Airtable al crear:', {
                status: response.status,
                statusText: response.statusText,
                error: responseData.error || responseData.message, // Usar error o message
                fields: fields
            });
            throw new Error(`Error Airtable: ${responseData.error?.message || responseData.message || 'Error desconocido'}`);
        }

        // Devuelve el recordId del nuevo registro creado
        return responseData.id;

    } catch (error: unknown) { // Rename 'e' to 'error' and type it
        console.error('Error enviando datos a Airtable:', error); // Use 'error'
        // Puedes hacer un manejo más específico del error si es necesario
        if (error instanceof Error) {
             // Optionally use error.message or error.stack here
             throw new Error(`Error procesando la solicitud a Airtable: ${error.message}`);
        } else {
             throw new Error('Ocurrió un error desconocido al enviar a Airtable');
        }
        // O simplemente relanzar el error original si prefieres
        // throw error;
        // O devolver null si esa es la lógica deseada en caso de error
        // return null;
    }
}

/**
 * Actualiza el PDF y el status en Airtable usando el recordId directamente
 * @param recordId El id de Airtable del registro a actualizar
 * @param pdfUrl   El enlace al PDF firmado
 */
export const updateAirtablePdfLink = async (recordId: string, pdfUrl: string): Promise<boolean> => {
  try {
    console.log(`Actualizando enlace PDF en Airtable para recordId ${recordId} con URL: ${pdfUrl}`);
    
    // Validar que pdfUrl sea una URL válida
    try {
        new URL(pdfUrl);
    } catch {
        console.error(`La URL del PDF no es válida: ${pdfUrl}`);
        return false;
    }
    
    // Validar variables de entorno
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME;
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

    if (!baseId || !tableName || !apiKey) {
      const missingVars = [];
      if (!baseId) missingVars.push('VITE_AIRTABLE_BASE_ID');
      if (!tableName) missingVars.push('VITE_AIRTABLE_TABLE_NAME');
      if (!apiKey) missingVars.push('VITE_AIRTABLE_API_KEY');
      throw new Error(`Faltan variables de entorno de Airtable: ${missingVars.join(', ')}`);
    }
    
    const AIRTABLE_API_URL = `https://api.airtable.com/v0/${baseId}/${tableName}`;

    // Actualizar el registro con el enlace del PDF usando el recordId directamente
    const updateResponse = await fetch(`${AIRTABLE_API_URL}/${recordId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        fields: {
          'PDF Link': pdfUrl,
          'Inspection Status': 'Signed'
        },
        typecast: true
      })
    });

    console.log('PATCH status:', updateResponse.status);
    // Tipar la respuesta JSON
    const updateData: AirtableUpdateResponse = await updateResponse.json();
    console.log('PATCH response:', updateData);

    // Verificar si la respuesta contiene un error de Airtable
    if (!updateResponse.ok || updateData.error || updateData.message) {
      console.error('Error de Airtable al actualizar:', {
          status: updateResponse.status,
          statusText: updateResponse.statusText,
          error: updateData.error || updateData.message,
          recordId: recordId
      });
      return false;
    } else {
      console.log('Respuesta de actualización de Airtable:', updateData);
      // Asegurarse de que fields exista antes de acceder a él
      if (updateData.fields && updateData.fields['Inspection Status'] !== 'Signed') {
        console.error('Status no se actualizó correctamente:', updateData.fields['Inspection Status']);
        return false;
      } else if (updateData.fields) { // Verificar que fields exista
        console.log('¡Status actualizado correctamente a Signed!');
        return true;
      } else {
         console.warn('La respuesta de Airtable no incluyó el campo "fields" actualizado.');
         // Decide si esto debe considerarse un éxito o un fallo
         return false; // O true dependiendo de la lógica requerida
      }
    }
  } catch (error: unknown) { // Rename 'e' to 'error' and type it
    console.error('Error al actualizar enlace PDF en Airtable:', error); // Use 'error'
     // Puedes hacer un manejo más específico del error si es necesario
     if (error instanceof Error) {
         console.error(`Error específico: ${error.message}`); // Use error.message
     }
    return false;
  }
}
