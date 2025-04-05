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
    try {
        interface AirtableFields {
            'Form Id': string;
            'Inspection Date': string;
            'Guest Name': string;
            'Property': string;
            'PDF Link': { url: string };
        }

        const fields: AirtableFields = {
            'Form Id': formData.formId || crypto.randomUUID(),
            'Inspection Date': formData.inspectionDate,
            'Guest Name': formData.guestName,
            'Property': formData.property,
            'PDF Link': { url: pdfLink }
        };

        const airtableData = { fields };

        // Corregir el acceso a la variable de entorno
        const baseUrl = `https://api.airtable.com/v0/${import.meta.env.VITE_AIRTABLE_BASE_ID}/${import.meta.env.VITE_AIRTABLE_TABLE_NAME}`;
        const headers = {
            'Authorization': `Bearer ${import.meta.env.VITE_AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        };

        // Crear nuevo registro
        const response = await fetch(
            baseUrl,
            {
                method: 'POST',
                headers,
                body: JSON.stringify(airtableData)
            }
        );

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
