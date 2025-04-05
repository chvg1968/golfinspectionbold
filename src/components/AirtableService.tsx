/**
 * Servicio para enviar datos a Airtable
 */

interface InspectionFormData {
    guestName: string;
    inspectionDate: string;
    property: string;
    formId?: string;
}

export async function sendToAirtable(formData: InspectionFormData, pdfLink: string) {
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
            'Guest Name': string;
            'Property': string;
            'Inspection Date': string;
            'PDF Link': string;
        }

        const fields: AirtableFields = {
            'Form Id': formData.formId || crypto.randomUUID(),
            'Inspection Date': formData.inspectionDate,
            'Guest Name': formData.guestName,
            'Property': formData.property,
            'PDF Link': pdfLink
        };

        // Validar que todos los campos tengan valor
        const emptyFields = Object.entries(fields)
            .filter(([_, value]) => !value)
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

        // Crear nuevo registro
        console.log('Enviando a Airtable:', { url: baseUrl, data: airtableData });

        const response = await fetch(
            baseUrl,
            {
                method: 'POST',
                headers,
                body: JSON.stringify(airtableData)
            }
        );

        const responseData = await response.json();
        console.log('Respuesta de Airtable:', { 
            status: response.status, 
            statusText: response.statusText,
            data: responseData
        });

        if (!response.ok) {
            console.error('Error detallado de Airtable:', {
                status: response.status,
                statusText: response.statusText,
                error: responseData.error,
                fields: fields
            });
            throw new Error(`Error Airtable: ${responseData.error?.message || 'Error desconocido'}`);
        }

        return responseData;

    } catch (error) {
        console.error('Error enviando datos a Airtable:', error);
        throw error;
    }
}
