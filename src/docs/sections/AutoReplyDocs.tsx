import { CodeBlock, Note, H2, H3, P } from "../shared";

export default function AutoReplyDocs() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Auto-reply</h1>
      <P>
        Automatically reply to inbound messages based on configurable rules.
        Rules are evaluated in priority order (highest first).
      </P>

      <H2>Match Types</H2>
      <div className="space-y-2 my-3">
        {[
          {
            type: "contains",
            desc: "Message includes the keyword (case-insensitive)",
            example: 'Keyword: "price" → matches "What is the price?"',
          },
          {
            type: "exact",
            desc: "Message matches exactly (case-insensitive)",
            example: 'Keyword: "hi" → matches "hi" but not "hi there"',
          },
          {
            type: "starts_with",
            desc: "Message begins with the keyword",
            example: 'Keyword: "order" → matches "order #123"',
          },
          {
            type: "regex",
            desc: "Advanced pattern matching using regular expressions",
            example: 'Pattern: "^(hi|hello|hey)" → matches greetings',
          },
        ].map((m) => (
          <div
            key={m.type}
            className="p-4 bg-gray-900 border border-gray-800 rounded-xl space-y-1"
          >
            <div className="flex items-center gap-2">
              <code className="text-xs text-brand-400 font-mono">{m.type}</code>
            </div>
            <p className="text-xs text-gray-400">{m.desc}</p>
            <p className="text-[11px] text-gray-600 font-mono">{m.example}</p>
          </div>
        ))}
      </div>

      <H2>Priority</H2>
      <P>
        Rules are checked in descending priority order (higher number = checked
        first). The first matching rule wins. Set priority 0–100.
      </P>

      <H2>Session Scope</H2>
      <P>
        Rules can apply to all sessions or a specific session. Leave "Apply to
        Session" empty to match messages from any session.
      </P>

      <H2>Example Rules</H2>
      <CodeBlock
        id="autoreply-examples"
        code={`// Rule 1: Greeting (priority 10)
matchType: "contains"
matchValue: "hello"
replyContent: "Hi! 👋 How can I help you today?"

// Rule 2: Price inquiry (priority 20)
matchType: "contains"
matchValue: "price"
replyContent: "Our pricing starts at Rp 99K/month. Visit /pricing for details."

// Rule 3: Business hours (priority 5)
matchType: "regex"
matchValue: ".*"
replyContent: "Thanks for your message! We'll reply during business hours (9am-5pm WIB)."`}
      />

      <Note type="info">
        Auto-reply only triggers for <strong>inbound text messages</strong>.
        Media messages (images, documents, etc.) are stored but do not trigger
        auto-reply rules.
      </Note>

      <H2>Managing Rules</H2>
      <P>
        Rules are managed from the{" "}
        <strong className="text-white">Auto-reply</strong> page in the
        dashboard. You can:
      </P>
      <ul className="space-y-1.5 my-3 ml-4">
        {[
          "Create, edit, and delete rules",
          "Toggle rules on/off without deleting them",
          "Set priority to control evaluation order",
          "Scope rules to a specific session",
        ].map((item) => (
          <li key={item} className="flex gap-2 text-xs text-gray-400">
            <span className="text-brand-400 shrink-0">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
