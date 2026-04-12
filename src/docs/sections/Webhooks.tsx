import { CodeBlock, Note, H2, H3, P } from "../components/shared";

const BASE = "https://your-domain.com";

export default function WebhooksDocs() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Webhooks</h1>
      <P>
        Receive real-time notifications when events occur — such as when a
        message is received, sent, delivered, or when a session connects or
        disconnects.
      </P>

      <H2>How it works</H2>
      <P>
        Register a webhook endpoint URL in the dashboard. When an event occurs,
        the system sends an HTTP POST request to your URL with the event
        payload.
      </P>

      <H2>Registering a Webhook</H2>
      <P>
        Go to <strong className="text-white">Webhooks</strong> in the dashboard
        and create a new endpoint. You can:
      </P>
      <ul className="space-y-1.5 my-3 ml-4">
        {[
          "Set a name and URL",
          "Choose which events to subscribe to",
          "Set an optional HMAC-SHA256 signing secret for payload verification",
        ].map((item) => (
          <li key={item} className="flex gap-2 text-xs text-gray-400">
            <span className="text-brand-400 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>

      <H2>Available Events</H2>
      <div className="space-y-1.5 my-3">
        {[
          { event: "message.received", desc: "A new inbound message arrived" },
          {
            event: "message.sent",
            desc: "An outbound message was sent successfully",
          },
          {
            event: "message.delivered",
            desc: "Message was delivered to recipient's device",
          },
          { event: "message.read", desc: "Message was read by the recipient" },
          {
            event: "message.failed",
            desc: "Message failed to send after all retries",
          },
          {
            event: "session.connected",
            desc: "A session connected to WhatsApp",
          },
          {
            event: "session.disconnected",
            desc: "A session disconnected from WhatsApp",
          },
        ].map((e) => (
          <div
            key={e.event}
            className="flex items-start gap-3 text-xs py-1.5 border-b border-gray-800/50 last:border-0"
          >
            <code className="text-brand-400 font-mono w-44 shrink-0">
              {e.event}
            </code>
            <span className="text-gray-400">{e.desc}</span>
          </div>
        ))}
      </div>

      <H2>Payload Format</H2>
      <CodeBlock
        id="webhook-payload"
        code={`// message.received
POST https://your-app.com/webhook
Content-Type: application/json
X-Webhook-Signature: sha256=abc123...

{
  "event": "message.received",
  "timestamp": "2026-04-11T14:00:00.000Z",
  "data": {
    "messageId": "msg_abc123",
    "sessionId": "sess_abc123",
    "from": "628123456789",
    "content": "Hello!"
  }
}`}
      />

      <H2>Verifying Signatures</H2>
      <P>
        If you set a signing secret, each request includes an{" "}
        <code className="text-brand-400">X-Webhook-Signature</code> header.
        Verify it to ensure the request came from your WA Integration instance:
      </P>
      <CodeBlock
        id="webhook-verify"
        code={`// Node.js example
const crypto = require("crypto");

function verifySignature(payload, signature, secret) {
  const expected = "sha256=" + crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}

// In your webhook handler:
const isValid = verifySignature(
  req.rawBody,
  req.headers["x-webhook-signature"],
  "your_secret"
);`}
      />

      <H2>Retry Policy</H2>
      <P>
        If your endpoint returns a non-2xx response or times out (10 seconds),
        the system retries up to 3 times with exponential backoff:
      </P>
      <div className="space-y-1 my-3 ml-4">
        {[
          "Attempt 1 — immediate",
          "Attempt 2 — 1 second later",
          "Attempt 3 — 2 seconds later",
        ].map((a) => (
          <p key={a} className="text-xs text-gray-400 flex gap-2">
            <span className="text-brand-400">•</span>
            {a}
          </p>
        ))}
      </div>
      <P>
        All delivery attempts are logged and visible in the dashboard under{" "}
        <strong className="text-white">Webhooks → Logs</strong>.
      </P>

      <Note type="tip">
        Your webhook endpoint should respond with HTTP 200 as quickly as
        possible. Process the event asynchronously if needed.
      </Note>
    </div>
  );
}
