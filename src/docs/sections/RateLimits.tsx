import { CodeBlock, Note, H2, P } from "../shared";

export default function RateLimits() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Rate Limits</h1>
      <P>
        Each API key is rate limited independently to prevent abuse and ensure
        fair usage.
      </P>

      <H2>Default Limits</H2>
      <div className="grid grid-cols-2 gap-3 my-4">
        {[
          { label: "Per minute", value: "60", unit: "requests" },
          { label: "Per hour", value: "1,000", unit: "requests" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center"
          >
            <p className="text-3xl font-bold text-white">{item.value}</p>
            <p className="text-xs text-gray-500 mt-1">
              {item.unit} / {item.label.split(" ")[1]}
            </p>
          </div>
        ))}
      </div>

      <H2>Rate Limit Headers</H2>
      <P>When you exceed the rate limit, you receive a 429 response:</P>
      <CodeBlock
        id="rate-err"
        code={`HTTP/1.1 429 Too Many Requests

{
  "success": false,
  "message": "Rate limit exceeded (60 per minute). Retry in 45s.",
  "error": { "code": "TOO_MANY_REQUESTS", "details": null },
  "timestamp": "2026-04-11T14:00:00.000Z"
}`}
      />

      <H2>Configuring Limits</H2>
      <P>
        Default limits can be changed via environment variables on your
        self-hosted instance:
      </P>
      <CodeBlock
        id="rate-env"
        code={`# .env
RATE_LIMIT_PER_MINUTE=60
RATE_LIMIT_PER_HOUR=1000`}
      />

      <H2>Best Practices</H2>
      <ul className="space-y-2 my-3 ml-4">
        {[
          "Implement exponential backoff when you receive 429 responses",
          "For bulk sending, use the /v1/messages/broadcast endpoint with delay_ms",
          "Cache session IDs — don't fetch them on every request",
          "Use separate API keys for different applications to isolate rate limits",
        ].map((item) => (
          <li key={item} className="flex gap-2 text-xs text-gray-400">
            <span className="text-brand-400 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>

      <Note type="tip">
        Rate limits are tracked in-memory per API key. They reset at the start
        of each window (minute/hour).
      </Note>
    </div>
  );
}
