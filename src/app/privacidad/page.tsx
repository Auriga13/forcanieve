import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Política de privacidad — ForcaNieve",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl prose prose-sm">
      <h1>Política de Privacidad</h1>
      <p>Última actualización: abril 2026</p>

      <h2>1. Datos que recopilamos</h2>
      <p>
        Si te suscribes a nuestros informes, recopilamos tu dirección de correo
        electrónico, las zonas de interés seleccionadas y la frecuencia de
        envío. No recopilamos datos de navegación ni utilizamos cookies de
        seguimiento.
      </p>

      <h2>2. Uso de los datos</h2>
      <p>
        Tu correo electrónico se utiliza exclusivamente para enviarte los
        informes de condiciones del Pirineo que has solicitado. No compartimos
        tu correo con terceros ni lo usamos con fines publicitarios.
      </p>

      <h2>3. Base legal</h2>
      <p>
        El tratamiento de tus datos se basa en tu consentimiento explícito al
        suscribirte (Art. 6.1.a RGPD).
      </p>

      <h2>4. Almacenamiento</h2>
      <p>
        Tus datos se almacenan de forma segura en Supabase (infraestructura en
        la UE). Las direcciones de correo se almacenan cifradas en reposo.
      </p>

      <h2>5. Retención</h2>
      <p>
        Si cancelas tu suscripción, tus datos se eliminarán automáticamente en
        un plazo de 30 días.
      </p>

      <h2>6. Tus derechos</h2>
      <p>
        Tienes derecho a acceder, rectificar, eliminar y portar tus datos.
        Puedes darte de baja en cualquier momento haciendo clic en el enlace
        de desuscripción presente en cada correo.
      </p>

      <h2>7. Contenido generado por IA</h2>
      <p>
        Los resúmenes de condiciones meteorológicas y nivológicas se generan
        mediante inteligencia artificial (Claude de Anthropic). Esta
        información es orientativa y no sustituye a las fuentes oficiales
        (AEMET, Meteo-France).
      </p>

      <h2>8. Analítica</h2>
      <p>
        Utilizamos GoatCounter, un servicio de analítica web que respeta la
        privacidad y no utiliza cookies ni rastrea usuarios individuales.
      </p>

      <h2>9. Contacto</h2>
      <p>
        Para cualquier consulta sobre privacidad, puedes contactarnos a través
        del repositorio del proyecto en GitHub.
      </p>
    </div>
  );
}
