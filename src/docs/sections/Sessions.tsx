import { CodeBlock, Note, H2, H3, P } from "../components/shared";

export default function SessionsDocs() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Sessions</h1>
      <P>
        A session represents an active WhatsApp connection. Every message you
        send must reference an active session.
      </P>

      <H2>What is a Session?</H2>
      <P>
        Think of a session as a "logged-in WhatsApp account" on the server. It
        links a provider config (credentials/connection settings) to an active
        WebSocket connection with WhatsApp.
      </P>
      <div className="grid grid-cols-2 gap-3 my-4">
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-xs font-semibold text-white mb-1">
            Provider Config
          </p>
          <p className="text-[11px] text-gray-400">
            Credentials & settings (API keys, phone number ID, etc.)
          </p>
        </div>
        <div className="p-4 bg-gray-900 border border-gray-800 rounded-xl">
          <p className="text-xs font-semibold text-white mb-1">Session</p>
          <p className="text-[11px] text-gray-400">
            Active runtime connection using those credentials
          </p>
        </div>
      </div>

      <H2>Session Lifecycle</H2>
      <div className="space-y-2 my-3">
        {[
          {
            state: "inactive",
            desc: "Session exists in DB but is not connected to WhatsApp",
          },
          {
            state: "active",
            desc: "Session is connected and ready to send/receive messages",
          },
        ].map((s) => (
          <div
            key={s.state}
            className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-800 rounded-lg"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${s.state === "active" ? "bg-brand-400" : "bg-gray-600"}`}
            />
            <div>
              <code className="text-xs text-brand-400 font-mono">
                {s.state}
              </code>
              <p className="text-[11px] text-gray-400 mt-0.5">{s.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <H2>Auto-reconnect on Restart</H2>
      <P>
        When the server restarts, all sessions with status{" "}
        <code className="text-brand-400">active</code> are automatically
        reconnected. For Baileys, the auth state is persisted in the{" "}
        <code className="text-brand-400">baileys_auth_*</code> folder — no need
        to scan QR again.
      </P>

      <Note type="warning">
        If the <code className="text-yellow-300">baileys_auth_*</code> folder is
        deleted, or if WhatsApp logs out the linked device, you'll need to scan
        the QR code again.
      </Note>

      <H2>Multiple Sessions</H2>
      <P>
        You can have multiple sessions — one per WhatsApp number. Each session
        has its own ID that you use when sending messages.
      </P>
      <CodeBlock
        id="sessions-multi"
        code={`// Session for customer support
session_id: "sess_support_abc123"

// Session for notifications
session_id: "sess_notif_def456"

// Send via specific session
POST /v1/messages/send
{ "session_id": "sess_support_abc123", "to": "...", "message": "..." }`}
      />

      <H2>Getting the Session ID</H2>
      <P>
        Find your session ID in the dashboard under{" "}
        <strong className="text-white">Sessions</strong>. Click the copy icon
        next to the ID in the table.
      </P>

      <Note type="info">
        Session IDs are UUIDs like{" "}
        <code className="text-brand-400">
          59a847c6-81f5-4cd3-ab88-1279654e4cb3
        </code>
        . They don't change unless you delete and recreate the session.
      </Note>
    </div>
  );
}
