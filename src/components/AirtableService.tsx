import { generateFormId } from '../lib/generate-form-id';

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
    // Solo enviar a Airtable si hay un PDF link (implica que está firmado)
    if (!pdfLink) {
        console.log('No hay PDF firmado, no se envía a Airtable');
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
            'Guest Name': string;
            'Property': string;
            'Inspection Date': string;
            'PDF Link': string;
        }

        const fields: AirtableFields = {
            'Form Id': formData.formId || generateFormId(formData.guestName),
            'Inspection Date': formData.inspectionDate,
            'Guest Name': formData.guestName,
            'Property': formData.property,
            'PDF Link': pdfLink
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
        const searchData = await searchResponse.json();

        if (searchData.records && searchData.records.length > 0) {
            console.log('El registro ya existe en Airtable');
            return searchData.records[0];
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

export async function updateAirtablePdfLink(formId: string, pdfLink: string) {
    // Validar variables de entorno
    const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
    const tableName = import.meta.env.VITE_AIRTABLE_TABLE_NAME;
    const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;

    if (!baseId || !tableName || !apiKey) {
        throw new Error('Faltan variables de entorno de Airtable');
    }

    // Buscar el registro existente
    const searchUrl = `https://api.airtable.com/v0/${baseId}/${tableName}?filterByFormula=${encodeURIComponent(`{Form Id}='${formId}'`)}`;
    const searchResponse = await fetch(searchUrl, {
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        }
    });
    const searchData = await searchResponse.json();

    if (!searchData.records || searchData.records.length === 0) {
        console.log('No se encontró registro para actualizar');
        return null;
    }

    // Obtener el ID del primer registro encontrado
    const recordId = searchData.records[0].id;

    // Preparar datos para actualización
    const updateData = {
        fields: {
            'PDF Link': pdfLink
        }
    };

    // URL para actualizar el registro
    const updateUrl = `https://api.airtable.com/v0/${baseId}/${tableName}/${recordId}`;

    // Realizar actualización
    const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
    });

    const updateResponseData = await updateResponse.json();

    console.log('Actualización en Airtable:', {
        success: updateResponse.ok,
        recordId,
        pdfLink
    });

    return updateResponseData;
}
