import { CodeBlock, Badge, Field, Note, H2, P } from "../components/shared";

const BASE = "https://your-domain.com";

export default function BroadcastDocs() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Broadcast</h1>
      <P>
        Send a message to multiple recipients at once with a configurable delay
        between each send to avoid WhatsApp rate limiting.
      </P>

      <div className="flex items-center gap-2 my-4">
        <Badge method="POST" />
        <code className="text-sm text-gray-300 font-mono">
          /v1/messages/broadcast
        </code>
      </div>

      <H2>Example Request</H2>
      <CodeBlock
        id="broadcast-req"
        code={`curl -X POST ${BASE}/v1/messages/broadcast \\
  -H "X-API-Key: wai_live_YOUR_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "sess_abc123",
    "recipients": [
      "628111111111",
      "628222222222",
      "628333333333"
    ],
    "message": "🎉 Special offer just for you!",
    "delay_ms": 2000
  }'`}
      />

      <H2>Request Body</H2>
      <div className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-1 my-3">
        <Field
          name="session_id"
          type="string"
          required
          desc="ID of an active session."
        />
        <Field
          name="recipients"
          type="string[]"
          required
          desc="Array of phone numbers with country code. Max 1000 per request."
        />
        <Field
          name="message"
          type="string"
          required
          desc="Message content. Max 4096 characters."
        />
        <Field
          name="delay_ms"
          type="number"
          desc="Delay between each message in milliseconds. Default: 2000. Min: 500."
        />
        <Field
          name="sandbox"
          type="boolean"
          desc="If true, returns fake success without sending."
        />
      </div>

      <H2>Response</H2>
      <CodeBlock
        id="broadcast-res"
        code={`{
  "success": true,
  "data": {
    "job_id": "broadcast_1712844000000",
    "total": 3,
    "status": "running"
  }
}`}
      />

      <H2>Broadcast Job Status</H2>
      <P>
        After starting a broadcast, you can monitor its progress from the{" "}
        <strong className="text-white">Broadcast</strong> page in the dashboard.
        Possible statuses:
      </P>
      <div className="space-y-1.5 my-3">
        {[
          { status: "pending", desc: "Job created but not started yet" },
          { status: "running", desc: "Currently sending messages" },
          { status: "completed", desc: "All messages processed" },
          { status: "failed", desc: "All messages failed to send" },
          { status: "cancelled", desc: "Manually cancelled" },
        ].map((s) => (
          <div key={s.status} className="flex items-center gap-3 text-xs">
            <code className="text-brand-400 font-mono w-20 shrink-0">
              {s.status}
            </code>
            <span className="text-gray-400">{s.desc}</span>
          </div>
        ))}
      </div>

      <Note type="warning">
        Use <code className="text-yellow-300">delay_ms ≥ 2000</code> to avoid
        WhatsApp detecting bulk sending and banning your number. The minimum
        recommended delay is 2 seconds.
      </Note>

      <H2>Using Contact Tags</H2>
      <P>
        From the dashboard, you can broadcast to a group of contacts filtered by
        tag without manually listing phone numbers. Go to{" "}
        <strong className="text-white">
          Broadcast → New Broadcast → From Contacts
        </strong>{" "}
        and select a tag.
      </P>
    </div>
  );
}
