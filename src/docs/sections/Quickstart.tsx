import { Link } from "react-router-dom";
import { CodeBlock, Note, H2, P } from "../shared";

const BASE = "https://your-domain.com";

export default function Quickstart() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Quick Start</h1>
      <P>Send your first WhatsApp message in under 5 minutes.</P>

      <H2>Step 1 — Create an account</H2>
      <P>
        <Link to="/login" className="text-brand-400 hover:underline">
          Sign in
        </Link>{" "}
        to the dashboard. If you don't have an account yet, register first.
      </P>

      <H2>Step 2 — Create a Provider Config</H2>
      <P>
        Go to <strong className="text-white">Provider Configs</strong> → New
        Config. Choose your provider:
      </P>
      <div className="space-y-2 my-3">
        {[
          {
            name: "Baileys (recommended for testing)",
            desc: "No business account needed. Connect any WhatsApp number via QR code.",
          },
          {
            name: "Meta Cloud API",
            desc: "Official API. Requires a WhatsApp Business account from Meta.",
          },
          {
            name: "BSP / Partner",
            desc: "Via a third-party Business Solution Provider.",
          },
        ].map((p) => (
          <div
            key={p.name}
            className="flex gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg"
          >
            <span className="text-brand-400 shrink-0 mt-0.5">→</span>
            <div>
              <p className="text-xs font-semibold text-white">{p.name}</p>
              <p className="text-[11px] text-gray-400 mt-0.5">{p.desc}</p>
            </div>
          </div>
        ))}
      </div>
      <P>
        After creating, click <strong className="text-white">Activate</strong>{" "}
        on the config.
      </P>

      <H2>Step 3 — Connect WhatsApp (Baileys)</H2>
      <P>
        After activating a Baileys config, click{" "}
        <strong className="text-white">QR Code</strong> to open the connection
        modal. Scan the QR code with your WhatsApp mobile app:
      </P>
      <div className="space-y-1.5 my-3 ml-4">
        {[
          "Open WhatsApp on your phone",
          "Tap Menu (⋮) → Linked Devices",
          "Tap Link a Device",
          "Scan the QR code shown in the dashboard",
        ].map((s, i) => (
          <p key={i} className="flex gap-2 text-xs text-gray-400">
            <span className="text-brand-400 font-bold shrink-0">{i + 1}.</span>
            {s}
          </p>
        ))}
      </div>
      <Note type="tip">
        Alternatively, use <strong>Pairing Code</strong> instead of QR — enter
        your phone number and type the code shown in WhatsApp.
      </Note>

      <H2>Step 4 — Create & Activate a Session</H2>
      <P>
        Go to <strong className="text-white">Sessions</strong> → New Session.
        Select your provider config and give it a name. Then click{" "}
        <strong className="text-white">Activate</strong>.
      </P>
      <Note type="info">
        Copy the <strong>Session ID</strong> from the Sessions table — you'll
        need it to send messages.
      </Note>

      <H2>Step 5 — Generate an API Key</H2>
      <P>
        Go to <strong className="text-white">API Keys</strong> → New API Key.
        Give it a name and click Create.{" "}
        <strong className="text-white">Copy the key immediately</strong> — it's
        shown only once.
      </P>
      <CodeBlock
        id="qs-key"
        code={`wai_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
      />

      <H2>Step 6 — Send your first message</H2>
      <CodeBlock
        id="qs-send"
        code={`curl -X POST ${BASE}/v1/messages/send \\
  -H "X-API-Key: wai_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "YOUR_SESSION_ID",
    "to": "628123456789",
    "message": "Hello from WA Integration! 🎉"
  }'`}
      />
      <P>
        You should receive a success response and the message will appear on the
        recipient's WhatsApp.
      </P>
      <CodeBlock
        id="qs-res"
        code={`{
  "success": true,
  "data": {
    "message_id": "msg_abc123",
    "status": "sent",
    "sent_at": "2026-04-11T14:00:00.000Z"
  }
}`}
      />

      <Note type="tip">
        Not ready to send real messages? Add{" "}
        <code className="text-brand-300">"sandbox": true</code> to test without
        actually sending.
      </Note>
    </div>
  );
}
