import { CodeBlock, Note, H2, H3, P } from "../components/shared";

export default function Authentication() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Authentication</h1>
      <P>
        All API requests to <code className="text-brand-400">/v1/*</code>{" "}
        endpoints require an API key.
      </P>

      <H2>API Key Format</H2>
      <P>API keys follow this format:</P>
      <CodeBlock
        id="key-format"
        code={`wai_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
      />
      <P>
        Keys are prefixed with <code className="text-brand-400">wai_live_</code>{" "}
        followed by 64 random hex characters.
      </P>

      <H2>Passing the API Key</H2>
      <P>
        Include your API key in the{" "}
        <code className="text-brand-400">X-API-Key</code> header:
      </P>
      <CodeBlock id="auth-header" code={`X-API-Key: wai_live_YOUR_KEY`} />
      <P>
        Alternatively, you can use the{" "}
        <code className="text-brand-400">Authorization: Bearer</code> header:
      </P>
      <CodeBlock
        id="auth-bearer"
        code={`Authorization: Bearer wai_live_YOUR_KEY`}
      />

      <H2>Creating an API Key</H2>
      <P>
        API keys are created from the dashboard under{" "}
        <strong className="text-white">API Keys</strong>. When creating a key
        you can set:
      </P>
      <ul className="space-y-1.5 my-3 ml-4">
        {[
          {
            field: "Name",
            desc: 'A label to identify the key (e.g. "Production App")',
          },
          {
            field: "Expiry date",
            desc: "Optional. Leave empty for no expiry.",
          },
          {
            field: "IP Whitelist",
            desc: "Optional. Restrict the key to specific IP addresses or CIDR ranges.",
          },
        ].map((item) => (
          <li key={item.field} className="flex gap-2 text-xs text-gray-400">
            <span className="text-brand-400 shrink-0">•</span>
            <span>
              <strong className="text-gray-200">{item.field}</strong> —{" "}
              {item.desc}
            </span>
          </li>
        ))}
      </ul>

      <Note type="warning">
        The plain API key is shown <strong>only once</strong> at creation time.
        Store it securely — we hash it immediately and cannot recover it. If
        lost, revoke and create a new one.
      </Note>

      <H2>IP Whitelist</H2>
      <P>
        You can restrict an API key to specific IP addresses or CIDR ranges. If
        no rules are set, all IPs are allowed.
      </P>
      <CodeBlock
        id="ip-examples"
        code={`// Examples of valid CIDR rules:
"192.168.1.100/32"   // single IP
"10.0.0.0/8"         // private network
"203.0.113.0/24"     // subnet`}
      />
      <Note type="info">
        IP whitelist is managed per API key from the dashboard: API Keys →
        expand a key → IP Whitelist panel.
      </Note>

      <H2>Error Responses</H2>
      <CodeBlock
        id="auth-errors"
        code={`// 401 — Missing or invalid API key
{
  "success": false,
  "message": "Invalid or expired API key",
  "error": { "code": "UNAUTHORIZED", "details": null }
}

// 403 — IP not whitelisted
{
  "success": false,
  "message": "IP address not whitelisted",
  "error": { "code": "FORBIDDEN", "details": null }
}`}
      />
    </div>
  );
}
