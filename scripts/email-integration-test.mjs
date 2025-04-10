import { sendFormEmail } from '../src/lib/email.js';
import { sendAdminNotification } from '../src/services/email-service.js';

async function runEmailIntegrationTests() {
  console.log('🧪 Iniciando pruebas de integración de email');

  const testCases = [
    {
      description: 'Envío de formulario de invitado',
      type: 'guest-form',
      data: {
        to_name: 'Oman Rodriguez',
        to_email: 'conradovilla@icloud.com',
        property_name: 'Rental 6 Passenger Cart',
        cart_type: '6-Seater',
        form_link: 'https://example.com/form/test-form-123',
        pdf_attachment: 'https://lngsgyvpqhjmedjrycqw.supabase.co/storage/v1/object/public/pdfs/rental_6_passenger_150_oman_2025-04-09.pdf'
      }
    },
    {
      description: 'Envío de formulario completado',
      type: 'completed-form',
      data: {
        property: 'Rental 6 Passenger Cart',
        cart_number: '150',
        inspection_date: '2025-04-09'
      }
    },
    {
      description: 'Notificación de admin directa',
      type: 'admin-notification',
      data: {
        message: 'Prueba de notificación de administrador'
      }
    }
  ];

  for (const testCase of testCases) {
    console.log(`\n🔍 Ejecutando: ${testCase.description}`);
    
    try {
      let result;
      if (testCase.type === 'admin-notification') {
        result = await sendAdminNotification(testCase.data.message);
      } else {
        result = await sendFormEmail(
          testCase.type, 
          testCase.data
        );
      }

      console.log('✅ Resultado del envío:', JSON.stringify(result, null, 2));
    } catch (error) {
      console.error('❌ Error en el envío:', error);
    }
  }

  console.log('\n🏁 Pruebas de integración de email completadas');
}

runEmailIntegrationTests();
