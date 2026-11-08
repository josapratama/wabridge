import { CodeBlock, Note, H2, P } from "../components/shared";

const BASE = "https://your-domain.com";

export default function TemplatesDocs() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Message Templates</h1>
      <P>
        Create reusable message templates with{" "}
        <code className="text-brand-400">{"{{variable}}"}</code> placeholders.
        Render them with dynamic values at send time.
      </P>

      <H2>Creating a Template</H2>
      <P>
        Templates are created from the{" "}
        <strong className="text-white">Templates</strong> page in the dashboard.
        Use double curly braces for variables:
      </P>
      <CodeBlock
        id="template-example"
        code={`// Template content:
Hello {{name}}! 👋

Your order #{{order_id}} has been confirmed.
Estimated delivery: {{delivery_date}}

Thank you for shopping with us!`}
      />

      <H2>Rendering a Template via API</H2>
      <CodeBlock
        id="template-render"
        code={`POST ${BASE}/message-templates/{template_id}/render
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "variables": {
    "name": "John",
    "order_id": "ORD-12345",
    "delivery_date": "April 15, 2026"
  }
}

// Response:
{
  "success": true,
  "data": "Hello John! 👋\\n\\nYour order #ORD-12345 has been confirmed.\\nEstimated delivery: April 15, 2026\\n\\nThank you for shopping with us!"
}`}
      />

      <H2>Using Templates with Send</H2>
      <P>
        Render a template first, then use the result as the message content:
      </P>
      <CodeBlock
        id="template-send"
        code={`// Step 1: Render the template
const renderRes = await fetch("${BASE}/message-templates/tpl_abc123/render", {
  method: "POST",
  headers: {
    "Authorization": "Bearer YOUR_JWT",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    variables: { name: "John", order_id: "ORD-12345" }
  }),
});
const { data: message } = await renderRes.json();

// Step 2: Send the rendered message
await fetch("${BASE}/v1/messages/send", {
  method: "POST",
  headers: { "X-API-Key": "wai_live_YOUR_KEY" },
  body: JSON.stringify({
    session_id: "sess_abc123",
    to: "628123456789",
    message,
  }),
});`}
      />

      <Note type="info">
        Template rendering uses the dashboard JWT token (not API key). For
        production automation, render templates server-side and pass the result
        to the public API.
      </Note>

      <H2>Variable Detection</H2>
      <P>
        Variables are automatically detected when you save a template. The
        dashboard shows all detected variables so you know what to fill in when
        rendering.
      </P>
    </div>
  );
}
