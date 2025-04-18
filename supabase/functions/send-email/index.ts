// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { EmailService } from "./email-service.ts";
import { EmailData } from "./types.ts";

// Configuración de variables de entorno
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";

// Dominios permitidos para CORS
const ALLOWED_ORIGINS = [
  "http://localhost:5173",  // Desarrollo de Vite
  "http://localhost:5174",  // Otro puerto de desarrollo
  "http://127.0.0.1:5173",  // Otra variante de localhost
  "http://127.0.0.1:5174",  // Otro puerto de localhost
  "http://127.0.0.1:60943", // Origen de la vista previa
  "https://golf-cart-inspection.netlify.app",  // Producción
  "https://www.luxepropertiespr.com"  // Dominio de producción
];

// Inicializar servicio de email
const emailService = new EmailService(RESEND_API_KEY);

// Función para manejar CORS
function handleCORS(req: Request, origin: string): Response | null {
  // Verificar si el origen está permitido de manera más flexible
  const isOriginAllowed = ALLOWED_ORIGINS.some(
    allowedOrigin => {
      try {
        const originUrl = new URL(origin);
        const allowedUrl = new URL(allowedOrigin);
        return (
          originUrl.hostname === allowedUrl.hostname && 
          (originUrl.port === allowedUrl.port || 
           (allowedUrl.hostname === 'localhost' && ['5173', '5174', '60943'].includes(originUrl.port))
          )
        );
      } catch {
        return origin.startsWith(allowedOrigin);
      }
    }
  );

  // Manejar solicitudes OPTIONS (preflight)
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': isOriginAllowed ? origin : ALLOWED_ORIGINS[0],
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Message-ID',
        'Access-Control-Max-Age': '86400',
        'Vary': 'Origin'
      }
    });
  }

  // Validar método
  if (req.method !== "POST") {
    return new Response('Método no permitido', { 
      status: 405,
      headers: {
        'Access-Control-Allow-Origin': isOriginAllowed ? origin : ALLOWED_ORIGINS[0],
        'Content-Type': 'text/plain',
        'Vary': 'Origin'
      }
    });
  }

  return null;
}

// Función para leer el cuerpo de la solicitud de manera segura
async function safeReadRequestBody(req: Request): Promise<string> {
  try {
    // Verificar si el cuerpo es legible
    if (!req.body) {
      throw new Error('No hay cuerpo de solicitud');
    }

    // Lector de stream
    const reader = req.body.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }

    // Concatenar chunks
    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const combinedChunk = new Uint8Array(totalLength);
    
    let position = 0;
    for (const chunk of chunks) {
      combinedChunk.set(chunk, position);
      position += chunk.length;
    }

    // Decodificar a texto
    return new TextDecoder().decode(combinedChunk);

  } catch (error) {
    console.error('Error al leer el cuerpo de la solicitud:', error);
    throw new Error(`No se pudo leer el cuerpo de la solicitud: ${error.message}`);
  }
}

// Función para manejar la solicitud
async function handleRequest(req: Request): Promise<Response> {
  // Obtener origen de la solicitud
  const origin = req.headers.get('origin') || '*';
  
  // Manejar CORS
  const corsResponse = handleCORS(req, origin);
  if (corsResponse) return corsResponse;

  try {
    // Leer el cuerpo de la solicitud de manera segura
    const body = await safeReadRequestBody(req);
    console.log("Cuerpo de la solicitud:", body);

    // Parsear datos de la solicitud
    const data: EmailData = JSON.parse(body);
    console.log("Datos parseados:", data);

    // Log adicional para campos de diagrama
    if (data.diagramBase64) {
      console.log("Diagrama Base64 recibido:", {
        length: data.diagramBase64.length,
        points: data.diagramPoints?.length || 0
      });
    }

    // Validación de campos requeridos
    const requiredFields: (keyof EmailData)[] = [
      "guestName", 
      "guestEmail", 
      "property"
    ];

    const missingFields = requiredFields.filter(field => !data[field]);
    
    if (missingFields.length > 0) {
      return new Response(
        JSON.stringify({ 
          error: "Campos requeridos incompletos",
          missingFields 
        }), 
        { 
          status: 400,
          headers: { 
            'Access-Control-Allow-Origin': origin,
            'Content-Type': 'application/json',
            'Vary': 'Origin'
          } 
        }
      );
    }

    console.log('Datos recibidos para envío de email:', {
      guestName: data.guestName,
      guestEmail: data.guestEmail,
      type: data.type,
      diagramBase64: data.diagramBase64 ? 'Base64 presente' : 'Base64 ausente',
      diagramPoints: data.diagramPoints ? data.diagramPoints.length : 'Sin puntos'
    });

    // Validación adicional de puntos de diagrama
    if (data.diagramPoints && Array.isArray(data.diagramPoints)) {
      console.log('Validando puntos de diagrama:', {
        totalPoints: data.diagramPoints.length,
        firstPoints: data.diagramPoints.slice(0, 3)
      });

      const invalidPoints = data.diagramPoints.filter(point => 
        !point || 
        typeof point.x !== 'number' || 
        typeof point.y !== 'number' || 
        isNaN(point.x) || 
        isNaN(point.y)
      );

      if (invalidPoints.length > 0) {
        console.error('Puntos de diagrama inválidos detectados:', {
          invalidPointsCount: invalidPoints.length,
          invalidPoints
        });

        return new Response(
          JSON.stringify({ 
            error: "Puntos de diagrama inválidos",
            invalidPoints 
          }), 
          { 
            status: 400,
            headers: { 
              'Access-Control-Allow-Origin': origin,
              'Content-Type': 'application/json',
              'Vary': 'Origin'
            } 
          }
        );
      }
    }

    // Validación de diagrama base64
    if (data.diagramBase64) {
      try {
        // Verificar si es un base64 válido
        const base64Regex = /^data:image\/(png|jpeg|jpg|gif);base64,/;
        if (!base64Regex.test(data.diagramBase64)) {
          console.error('Formato de diagrama base64 inválido');
          return new Response(
            JSON.stringify({ 
              error: "Formato de diagrama base64 inválido" 
            }), 
            { 
              status: 400,
              headers: { 
                'Access-Control-Allow-Origin': origin,
                'Content-Type': 'application/json',
                'Vary': 'Origin'
              } 
            }
          );
        }
      } catch (base64Error) {
        console.error('Error al validar diagrama base64:', base64Error);
      }
    }

    // Añadir un nuevo endpoint o parámetro para manejar específicamente alertas admin
    if (data.type === 'admin-alert' || data.adminAlert) {
      try {
        // Usar directamente la plantilla de alerta admin
        const adminEmailService = new EmailService(Deno.env.get('RESEND_API_KEY') || '');
        const adminEmailData = {
          ...data,
          // Asegurar que los destinatarios sean los administradores
          guestEmail: undefined, // No enviar al huésped
          adminEmails: data.adminEmails || ["hernancalendar01@gmail.com", "luxeprbahia@gmail.com"]
        };
        
        const adminContent = generarContenidoAlertaFormularioCreado(adminEmailData);
        
        // Enviar directamente sin pasar por la lógica compleja
        const adminPayload = {
          from: adminContent.from,
          to: Array.isArray(adminContent.to) ? adminContent.to : [adminContent.to],
          subject: adminContent.subject,
          html: adminContent.html
        };
        
        console.log("Enviando alerta directa a administradores:", adminPayload.to);
        
        const adminResult = await adminEmailService.sendDirectEmail(adminPayload);
        
        return new Response(
          JSON.stringify({ 
            message: "Alerta admin enviada exitosamente", 
            result: adminResult || {} 
          }), 
          { 
            status: 200,
            headers: { 
              'Access-Control-Allow-Origin': origin,
              'Content-Type': 'application/json',
              'Vary': 'Origin'
            } 
          }
        );
      } catch (adminError) {
        console.error("Error enviando alerta admin:", adminError);
        return new Response(
          JSON.stringify({ error: "Error enviando alerta admin", details: adminError.message }), 
          { 
            status: 500,
            headers: { 
              'Access-Control-Allow-Origin': origin,
              'Content-Type': 'application/json',
              'Vary': 'Origin'
            } 
          }
        );
      }
    }

    // Enviar correo electrónico
    const emailService = new EmailService(Deno.env.get('RESEND_API_KEY') || '');
    try {
      const emailResult = await emailService.sendEmail({
        to_name: data.guestName,
        to_email: data.guestEmail,
        property: data.property,
        type: data.type,
        inspection_date: data.inspectionDate,
        form_link: data.formLink,
        formId: data.formId,
        reply_to: data.replyTo,
        cart_type: data.cartType,
        cart_number: data.cartNumber,
        observations: data.observations,
        pdf_attachment: data.pdfBase64
      });

      // Devolver una respuesta exitosa
      return new Response(
        JSON.stringify({ 
          message: "Correo enviado exitosamente", 
          result: emailResult || {} 
        }), 
        { 
          status: 200,
          headers: { 
            'Access-Control-Allow-Origin': origin,
            'Content-Type': 'application/json',
            'Vary': 'Origin'
          } 
        }
      );
    } catch (error) {
      console.error('Error al enviar correo:', error);
      return new Response(
        JSON.stringify({ 
          error: "Error al enviar correo",
          details: error.message 
        }), 
        { 
          status: 500,
          headers: { 
            'Access-Control-Allow-Origin': origin,
            'Content-Type': 'application/json',
            'Vary': 'Origin'
          } 
        }
      );
    }

  } catch (error) {
    console.error("Error en función de email:", error);
    console.error("Error completo en el manejo de solicitud:", {
      errorName: error.name,
      errorMessage: error.message,
      errorStack: error.stack,
      errorType: typeof error,
      errorProperties: Object.keys(error),
      fullErrorObject: JSON.stringify(error, Object.getOwnPropertyNames(error), 2)
    });
    
    // Log detallado del error
    console.error("Detalles del error:", {
      name: error instanceof Error ? error.name : 'Unknown Error',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : 'No stack trace',
      type: typeof error,
      stringified: JSON.stringify(error, Object.getOwnPropertyNames(error))
    });
    
    return new Response(
      JSON.stringify({ 
        error: "Error interno", 
        message: error instanceof Error ? error.message : String(error),
        details: error instanceof Error ? {
          name: error.name,
          stack: error.stack
        } : {}
      }), 
      { 
        status: 500,
        headers: { 
          'Access-Control-Allow-Origin': origin,
          'Content-Type': 'application/json',
          'Vary': 'Origin'
        } 
      }
    );
  }
}

// Servir la función con manejo de solicitudes
serve(handleRequest);
