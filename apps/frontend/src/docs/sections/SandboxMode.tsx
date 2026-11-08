import { CodeBlock, Note, H2, P } from "../components/shared";

export default function SandboxMode() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Sandbox Mode</h1>
      <P>
        Test your integration without sending real WhatsApp messages. Add{" "}
        <code className="text-brand-400">"sandbox": true</code> to any send
        request.
      </P>

      <H2>How to use</H2>
      <CodeBlock
        id="sandbox-req"
        code={`POST /v1/messages/send
{
  "session_id": "sess_abc123",
  "to": "628123456789",
  "message": "Test message",
  "sandbox": true
}`}
      />

      <H2>Sandbox Response</H2>
      <P>
        The response looks identical to a real send, but no message is actually
        sent:
      </P>
      <CodeBlock
        id="sandbox-res"
        code={`{
  "success": true,
  "message": "OK",
  "data": {
    "message_id": "sandbox_1712844000000",
    "session_id": "sess_abc123",
    "to": "628123456789",
    "status": "sandbox",
    "sent_at": "2026-04-11T14:00:00.000Z",
    "sandbox": true
  },
  "error": null
}`}
      />

      <H2>Use Cases</H2>
      <ul className="space-y-2 my-3 ml-4">
        {[
          "Testing your integration without consuming WhatsApp quota",
          "CI/CD pipelines — verify your code sends the right payload",
          "Development environments where you don't want real messages sent",
          "Load testing your application logic without hitting WhatsApp",
        ].map((item) => (
          <li key={item} className="flex gap-2 text-xs text-gray-400">
            <span className="text-brand-400 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>

      <Note type="tip">
        Sandbox mode works even if the session is inactive or the provider
        config is not connected. It's purely a client-side simulation.
      </Note>

      <H2>Broadcast Sandbox</H2>
      <P>Sandbox also works for broadcast requests:</P>
      <CodeBlock
        id="sandbox-broadcast"
        code={`POST /v1/messages/broadcast
{
  "session_id": "sess_abc123",
  "recipients": ["628111", "628222", "628333"],
  "message": "Test broadcast",
  "sandbox": true
}

// Response:
{
  "success": true,
  "data": {
    "job_id": "sandbox_1712844000000",
    "total": 3,
    "status": "sandbox",
    "sandbox": true
  }
}`}
      />
    </div>
  );
}
