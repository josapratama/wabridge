import { CodeBlock, H2, P } from "../shared";

const errors = [
  {
    code: 400,
    name: "BAD_REQUEST",
    desc: "Invalid request body, missing required fields, or session not active",
  },
  {
    code: 401,
    name: "UNAUTHORIZED",
    desc: "Missing, invalid, or expired API key",
  },
  {
    code: 403,
    name: "FORBIDDEN",
    desc: "IP address not in the API key's whitelist",
  },
  {
    code: 404,
    name: "NOT_FOUND",
    desc: "Session, message, or resource not found",
  },
  {
    code: 422,
    name: "VALIDATION_ERROR",
    desc: "Request body failed validation (check field types and required fields)",
  },
  {
    code: 429,
    name: "TOO_MANY_REQUESTS",
    desc: "Rate limit exceeded — check the message for retry time",
  },
  { code: 500, name: "INTERNAL_ERROR", desc: "Unexpected server error" },
];

export default function ErrorReference() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Error Reference</h1>
      <P>
        All errors follow the same response envelope. The{" "}
        <code className="text-brand-400">error.code</code> field contains a
        machine-readable error code.
      </P>

      <H2>Response Envelope</H2>
      <CodeBlock
        id="error-envelope"
        code={`{
  "success": false,
  "message": "Human readable error message",
  "data": null,
  "error": {
    "code": "ERROR_CODE",
    "details": null | "validation details"
  },
  "timestamp": "2026-04-11T14:00:00.000Z"
}`}
      />

      <H2>Error Codes</H2>
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden my-3">
        <div className="flex gap-4 px-4 py-2 border-b border-gray-800 bg-gray-900/50">
          <span className="text-[10px] font-semibold text-gray-600 uppercase w-10">
            Code
          </span>
          <span className="text-[10px] font-semibold text-gray-600 uppercase w-44">
            Name
          </span>
          <span className="text-[10px] font-semibold text-gray-600 uppercase">
            Description
          </span>
        </div>
        {errors.map((e, i) => (
          <div
            key={e.code}
            className={`flex items-start gap-4 px-4 py-3 text-xs ${i < errors.length - 1 ? "border-b border-gray-800" : ""}`}
          >
            <span
              className={`font-bold font-mono w-10 shrink-0 ${e.code >= 500 ? "text-red-400" : e.code === 429 ? "text-orange-400" : "text-yellow-400"}`}
            >
              {e.code}
            </span>
            <code className="text-brand-400 font-mono w-44 shrink-0">
              {e.name}
            </code>
            <span className="text-gray-400">{e.desc}</span>
          </div>
        ))}
      </div>

      <H2>Common Error Examples</H2>
      <CodeBlock
        id="err-400"
        code={`// 400 — Session not active
{
  "success": false,
  "message": "Session sess_abc123 is not active",
  "error": { "code": "BAD_REQUEST", "details": null }
}

// 400 — Validation error
{
  "success": false,
  "message": "to must be longer than or equal to 7 characters",
  "error": { "code": "VALIDATION_ERROR", "details": "to must be longer than or equal to 7 characters" }
}

// 401 — Invalid API key
{
  "success": false,
  "message": "Invalid or expired API key",
  "error": { "code": "UNAUTHORIZED", "details": null }
}

// 429 — Rate limited
{
  "success": false,
  "message": "Rate limit exceeded (60 per minute). Retry in 45s.",
  "error": { "code": "TOO_MANY_REQUESTS", "details": null }
}`}
      />
    </div>
  );
}
