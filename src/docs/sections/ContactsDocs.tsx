import { CodeBlock, Note, H2, P } from "../components/shared";

const BASE = "https://your-domain.com";

export default function ContactsDocs() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Contacts</h1>
      <P>
        Store and manage your WhatsApp contacts with tags and notes. Use
        contacts for targeted broadcasts.
      </P>

      <H2>Managing Contacts</H2>
      <P>
        Contacts are managed from the{" "}
        <strong className="text-white">Contacts</strong> page in the dashboard.
        Each contact has:
      </P>
      <div className="space-y-1.5 my-3 ml-4">
        {[
          { field: "Name", desc: "Display name for the contact" },
          {
            field: "Phone",
            desc: "Phone number with country code (e.g. 628123456789)",
          },
          {
            field: "Tags",
            desc: "Comma-separated labels for grouping (e.g. customer, vip, newsletter)",
          },
          { field: "Notes", desc: "Optional free-text notes" },
        ].map((item) => (
          <p key={item.field} className="flex gap-2 text-xs text-gray-400">
            <span className="text-brand-400 shrink-0">•</span>
            <span>
              <strong className="text-gray-200">{item.field}</strong> —{" "}
              {item.desc}
            </span>
          </p>
        ))}
      </div>

      <H2>Using Tags for Broadcast</H2>
      <P>
        Tags let you group contacts and broadcast to a specific group. From the
        Broadcast page, select "From Contacts" and choose a tag to send to all
        contacts with that tag.
      </P>
      <CodeBlock
        id="contacts-tags"
        code={`// Example contact tags:
"customer"     → all paying customers
"vip"          → VIP customers
"newsletter"   → newsletter subscribers
"inactive"     → users who haven't ordered in 30 days

// Broadcast to all VIP customers:
// Dashboard → Broadcast → New Broadcast → From Contacts → Select "vip"`}
      />

      <H2>Export Contacts</H2>
      <P>
        Export your contact list as CSV or JSON from the Contacts page using the
        Export button. Useful for backup or analysis.
      </P>
      <CodeBlock
        id="contacts-export-csv"
        code={`// CSV format:
id,name,phone,tags,notes,createdAt
abc123,John Doe,628123456789,customer;vip,,2026-04-11T00:00:00.000Z`}
      />

      <Note type="tip">
        Import contacts in bulk by using the dashboard's contact creation form
        or by calling the contacts API endpoint directly.
      </Note>
    </div>
  );
}
