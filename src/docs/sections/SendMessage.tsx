import { useState } from "react";
import { CodeBlock, Badge, Field, Note, H2, H3, P } from "../components/shared";

const BASE = "https://your-domain.com";

const snippets = {
  curl: `curl -X POST ${BASE}/v1/messages/send \\
  -H "X-API-Key: wai_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "sess_abc123",
    "to": "628123456789",
    "message": "Hello! 👋"
  }'`,
  js: `const res = await fetch("${BASE}/v1/messages/send", {
  method: "POST",
  headers: {
    "X-API-Key": "wai_live_YOUR_KEY",
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    session_id: "sess_abc123",
    to: "628123456789",
    message: "Hello! 👋",
  }),
});
const data = await res.json();
// data.data.message_id`,
  php: `<?php
$ch = curl_init("${BASE}/v1/messages/send");
curl_setopt_array($ch, [
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    "X-API-Key: wai_live_YOUR_KEY",
    "Content-Type: application/json",
  ],
  CURLOPT_POSTFIELDS => json_encode([
    "session_id" => "sess_abc123",
    "to"         => "628123456789",
    "message"    => "Hello! 👋",
  ]),
]);
$data = json_decode(curl_exec($ch), true);`,
  python: `import requests

res = requests.post(
    "${BASE}/v1/messages/send",
    headers={"X-API-Key": "wai_live_YOUR_KEY"},
    json={
        "session_id": "sess_abc123",
        "to": "628123456789",
        "message": "Hello! 👋",
    },
)
data = res.json()`,
};

export default function SendMessage() {
  const [lang, setLang] = useState<"curl" | "js" | "php" | "python">("curl");

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Send Message</h1>
      <P>
        Send a WhatsApp message to a single recipient. Supports text, image,
        document, audio, video, and location.
      </P>

      <div className="flex items-center gap-2 my-4 flex-wrap">
        <Badge method="POST" />
        <code className="text-sm text-gray-300 font-mono">
          /v1/messages
        </code>
        <span className="text-xs text-gray-500">or</span>
        <code className="text-sm text-gray-400 font-mono">
          /v1/messages/send
        </code>
      </div>

      <H2>Example Request</H2>
      <div className="flex gap-1 mb-2">
        {(["curl", "js", "php", "python"] as const).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${lang === l ? "bg-brand-600 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"}`}
          >
            {l === "js"
              ? "JavaScript"
              : l === "php"
                ? "PHP"
                : l === "python"
                  ? "Python"
                  : "cURL"}
          </button>
        ))}
      </div>
      <CodeBlock code={snippets[lang]} id={`send-${lang}`} />

      <H2>Request Body</H2>
      <div className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-1 my-3">
        <Field
          name="session_id"
          type="string"
          required
          desc="ID of an active session. Get it from the Sessions page in the dashboard."
        />
        <Field
          name="to"
          type="string"
          required
          desc="Recipient phone number with country code. No + or spaces. Example: 628123456789"
        />
        <Field
          name="message"
          type="string"
          required
          desc="Text content. Max 4096 characters. Required even for media messages (used as log description)."
        />
        <Field
          name="type"
          type="string"
          desc="Message type: text | image | document | audio | video | location. Default: text"
        />
        <Field
          name="media_url"
          type="string"
          desc="Publicly accessible URL of the media file. Required for image, document, audio, video."
        />
        <Field
          name="caption"
          type="string"
          desc="Caption text for image, document, or video. Max 1024 characters."
        />
        <Field
          name="media_mime_type"
          type="string"
          desc="MIME type of the media. e.g. image/jpeg, application/pdf, audio/mpeg"
        />
        <Field
          name="latitude"
          type="number"
          desc="Latitude coordinate. Required for location type."
        />
        <Field
          name="longitude"
          type="number"
          desc="Longitude coordinate. Required for location type."
        />
        <Field
          name="location_name"
          type="string"
          desc="Display name for the location. Optional."
        />
        <Field
          name="sandbox"
          type="boolean"
          desc="If true, returns a fake success response without actually sending. Useful for testing."
        />
      </div>

      <H2>Response</H2>
      <CodeBlock
        id="send-res"
        code={`{
  "success": true,
  "message": "OK",
  "data": {
    "message_id": "msg_abc123",
    "session_id": "sess_abc123",
    "to": "628123456789",
    "status": "sent",
    "sent_at": "2026-04-11T14:00:00.000Z"
  },
  "error": null,
  "timestamp": "2026-04-11T14:00:00.000Z"
}`}
      />

      <H2>Message Status Flow</H2>
      <div className="flex items-center gap-2 flex-wrap my-3">
        {["queued", "→", "sent", "→", "delivered", "→", "read"].map((s, i) =>
          s === "→" ? (
            <span key={i} className="text-gray-600 text-xs">
              →
            </span>
          ) : (
            <span
              key={i}
              className="text-xs px-2 py-1 bg-gray-800 text-gray-300 rounded font-mono"
            >
              {s}
            </span>
          ),
        )}
      </div>
      <P>
        Failed messages will have status{" "}
        <code className="text-brand-400">failed</code>. The system retries up to
        3 times before marking as failed.
      </P>

      <Note type="warning">
        The session must be <strong>active</strong> before sending. Activate it
        from the Sessions page in the dashboard.
      </Note>
    </div>
  );
}
