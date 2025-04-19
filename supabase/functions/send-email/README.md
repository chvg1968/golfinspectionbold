# Servicio de Correo Electrónico

Este servicio se encarga de enviar correos electrónicos a huéspedes y administradores para el sistema de inspección de carritos de golf.

## Configuración de Correos

Para facilitar el mantenimiento, todas las direcciones de correo electrónico y otras configuraciones están centralizadas en el archivo `config.ts`.

### Cómo actualizar las direcciones de correo de administradores

El sistema utiliza listas diferenciadas de administradores para distintos tipos de notificaciones. Puedes actualizar cada lista por separado en el archivo `config.ts`:

```typescript
// Lista para alertas de formulario creado
export const FORM_CREATED_ADMIN_EMAILS = [
  "hernancalendar01@gmail.com",
  "luxeprbahia@gmail.com"
];

// Lista para notificaciones de formulario completado/firmado
export const FORM_COMPLETED_ADMIN_EMAILS = [
  "hernancalendar01@gmail.com",
  "luxeprbahia@gmail.com"
];
```

Reemplaza las direcciones existentes con las nuevas direcciones. No es necesario modificar ningún otro archivo, ya que todos los componentes del sistema obtienen las direcciones de correo de este archivo de configuración.

### Cómo actualizar el remitente predeterminado

Para cambiar la dirección de correo del remitente, edita la constante `DEFAULT_SENDER` en el archivo `config.ts`:

```typescript
// Correo de remitente predeterminado
export const DEFAULT_SENDER = "Luxe Properties <noreply@luxepropertiespr.com>";
```

### Cómo actualizar otras configuraciones

El archivo `config.ts` también contiene otras configuraciones como URLs y correo de soporte. Puedes actualizarlas de la misma manera.

## Flujo de Correos

El sistema envía los siguientes tipos de correos:

1. **Formulario Creado (guest-form)**:
   - Correo al huésped con el enlace al formulario
   - Alerta a los administradores sobre la creación del formulario

2. **Formulario Completado (completed-form)**:
   - Correo de confirmación al huésped
   - Correo a los administradores con el PDF firmado

Todos estos correos utilizan las direcciones configuradas en `config.ts`.
