-- Forward-only: seed default terms when no current/upcoming row exists.
-- Must stay aligned with packages/orm/src/defaults/termsDefaultContent.ts and TermsVersionService.assertConfiguredForStartup.

WITH ins AS (
  INSERT INTO terms_version (version_key, title, content_hash, announcement_starts_at, enforcement_starts_at, status)
  SELECT
    'default-bootstrap-2026-01-01',
    'Agree to Terms of Service',
    '8a29355eaba9fb246479f5db3f05e0d53739309bb2d093866b77ced9bc2000d2',
    NULL,
    TIMESTAMP '2026-01-01 00:00:00',
    'current'
  WHERE NOT EXISTS (
    SELECT 1 FROM terms_version WHERE status IN ('current', 'upcoming')
  )
  RETURNING id
)
INSERT INTO terms_version_content (terms_version_id, content_text_en_us, content_text_es)
SELECT ins.id, $terms_en$**Acceptance and eligibility**
You must accept the latest terms to continue. Accepting now keeps your account eligible to receive Metaboost messages.
**Scope**
These terms apply to MetaBoost message and related metadata delivery. By using the service, you agree to the terms below.
**Service purpose**
MetaBoost is an external service that helps connect creator-facing messages to payment events. MetaBoost does not process, receive, or custody user payments.
**Payment estimates**
Values shown in MetaBoost are a best-effort estimate. We cannot guarantee accuracy, and you should confirm with your payment service provider what final payment amount you actually received.
**Messages and payments**
A message does not guarantee that a payment was sent, settled, or received. Payment flow is handled separately between the message sender and their payment service provider.
**Refunds and disputes**
If payment is successful but a message is missing, delayed, or not associated correctly, MetaBoost does not issue refunds. Payment disputes must be handled between the message sender, the content creator, and the payment service provider.
**Availability**
Message acceptance and retrieval are provided on a best-effort basis. Downtime, network issues, provider outages, or malformed payloads may affect delivery or display.$terms_en$, $terms_es$**Aceptación y elegibilidad**
Debes aceptar los términos más recientes para continuar. Si aceptas ahora, tu cuenta sigue siendo apta para recibir mensajes de Metaboost.
**Alcance**
Estos términos se aplican a la entrega de mensajes de MetaBoost y metadatos relacionados. Al usar el servicio, aceptas los términos a continuación.
**Propósito del servicio**
MetaBoost es un servicio externo que ayuda a conectar mensajes para creadores con eventos de pago. MetaBoost no procesa, recibe ni custodia pagos de usuarios.
**Estimaciones de pago**
Los valores mostrados en MetaBoost son una estimación de mejor esfuerzo. No podemos garantizar la precisión y debes confirmar con tu proveedor de servicios de pago cuál fue el importe final que realmente recibiste.
**Mensajes y pagos**
Un mensaje no garantiza que un pago haya sido enviado, liquidado o recibido. El flujo de pago se maneja por separado entre la persona que envía el mensaje y su proveedor de servicios de pago.
**Reembolsos y disputas**
Si el pago se realiza correctamente pero falta un mensaje, se retrasa o no se asocia correctamente, MetaBoost no emite reembolsos. Las disputas de pago deben resolverse entre quien envía el mensaje, el creador de contenido y el proveedor de servicios de pago.
**Disponibilidad**
La aceptación y recuperación de mensajes se ofrece sobre una base de mejor esfuerzo. Caídas, problemas de red, interrupciones del proveedor o cargas mal formadas pueden afectar la entrega o visualización.$terms_es$
FROM ins;
