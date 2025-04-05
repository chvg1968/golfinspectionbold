import dotenv from 'dotenv';
dotenv.config();

async function testAirtable() {
    const testData = {
        fields: {
            'Form Id': 'test_form_001',
            'Guest Name': 'Test User',
            'Property': 'Casa de Campo',
            'Inspection Date': '2025-04-05',
            'PDF Link': 'https://example.com/test.pdf'
        }
    };

    const baseId = process.env.VITE_AIRTABLE_BASE_ID;
    const tableName = process.env.VITE_AIRTABLE_TABLE_NAME;
    const apiKey = process.env.VITE_AIRTABLE_API_KEY;

    console.log('Configuración:', {
        baseId,
        tableName,
        hasApiKey: !!apiKey
    });

    const baseUrl = `https://api.airtable.com/v0/${baseId}/${tableName}`;
    
    try {
        const response = await fetch(baseUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
        });

        const responseData = await response.json();
        console.log('Respuesta:', {
            status: response.status,
            statusText: response.statusText,
            data: responseData
        });

        if (!response.ok) {
            throw new Error(`Error: ${responseData.error?.message || 'Error desconocido'}`);
        }

        console.log('Datos enviados exitosamente');
    } catch (error) {
        console.error('Error:', error);
    }
}

testAirtable();
