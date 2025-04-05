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
    console.log('Iniciando envío a Airtable...', {
        formData,
        pdfLink,
        baseId: import.meta.env.VITE_AIRTABLE_BASE_ID,
        tableName: import.meta.env.VITE_AIRTABLE_TABLE_NAME,
        hasApiKey: !!import.meta.env.VITE_AIRTABLE_API_KEY
    });
    try {
        interface AirtableFields {
            'Form Id': string;
            'Guest Name': string;
            'Property': string;
            'Inspection Date': string;
            'PDF URL': string;
        }

        const fields: AirtableFields = {
            'Form Id': formData.formId || crypto.randomUUID(),
            'Inspection Date': formData.inspectionDate,
            'Guest Name': formData.guestName,
            'Property': formData.property,
            'PDF URL': pdfLink
        };

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

        console.log('Respuesta de Airtable:', { status: response.status, statusText: response.statusText });

        const responseData = await response.json();

        if (!response.ok) {
            console.error('Respuesta detallada de Airtable:', responseData);
            throw new Error(`Error Airtable: ${responseData.error?.message || 'Error desconocido'}`);
        }

        return responseData;

    } catch (error) {
        console.error('Error enviando datos a Airtable:', error);
        throw error;
    }
}
