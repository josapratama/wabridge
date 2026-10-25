import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  Terminal,
  Send,
  Image,
  Radio,
  Layers,
  ExternalLink,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { BASE } from "../../../api/base";
import { ApiKey } from "../../../api/client";
import { Link } from "react-router-dom";

interface DeveloperUsageGuideProps {
  keys?: ApiKey[];
}

type Lang = "curl" | "javascript" | "python" | "php";
type Scenario = "text" | "media" | "sessions" | "broadcast";

export default function DeveloperUsageGuide({ keys = [] }: DeveloperUsageGuideProps) {
  const [lang, setLang] = useState<Lang>("curl");
  const [scenario, setScenario] = useState<Scenario>("text");
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Use the first active key's prefix + placeholder or default placeholder
  const activeKey = keys.find((k) => k.isActive);
  const keyDisplay = activeKey
    ? `${activeKey.keyPrefix}...YOUR_KEY_SECRET`
    : "wai_live_YOUR_API_KEY";

  const getSnippets = (baseUrl: string, apiKey: string) => {
    return {
      text: {
        method: "POST",
        endpoint: "/v1/messages",
        title: "Kirim Pesan Teks (Single Message)",
        description:
          "Kirim pesan WhatsApp biasa ke satu nomor tujuan menggunakan session yang aktif.",
        curl: `curl -X POST "${baseUrl}/v1/messages" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    "to": "6281234567890",
    "message": "Halo! Pesanan #1042 Anda sudah diproses. 🚀"
  }'`,
        javascript: `// Menggunakan Fetch (Node.js 18+ / Browser)
const response = await fetch("${baseUrl}/v1/messages", {
  method: "POST",
  headers: {
    "X-API-Key": "${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    session_id: "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    to: "6281234567890",
    message: "Halo! Pesanan #1042 Anda sudah diproses. 🚀"
  })
});

const data = await response.json();
console.log("Status:", data.success, "Message ID:", data.data?.message_id);`,
        python: `import requests

url = "${baseUrl}/v1/messages"
headers = {
    "X-API-Key": "${apiKey}",
    "Content-Type": "application/json"
}
payload = {
    "session_id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    "to": "6281234567890",
    "message": "Halo! Pesanan #1042 Anda sudah diproses. 🚀"
}

response = requests.post(url, json=payload, headers=headers)
print(response.json())`,
        php: `<?php
$ch = curl_init("${baseUrl}/v1/messages");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "X-API-Key: ${apiKey}",
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "session_id" => "4a62b976-f038-4c60-84d4-2d280b9a48aa",
        "to"         => "6281234567890",
        "message"    => "Halo! Pesanan #1042 Anda sudah diproses. 🚀"
    ])
]);

$response = curl_exec($ch);
curl_close($ch);
$result = json_decode($response, true);
print_r($result);`,
        response: `{
  "success": true,
  "message": "OK",
  "data": {
    "message_id": "87ab349f-e60d-40ba-9be6-71d182283a01",
    "session_id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    "to": "6281234567890",
    "status": "sent",
    "type": "text",
    "sent_at": "2026-10-25T11:30:00.000Z"
  }
}`,
      },

      media: {
        method: "POST",
        endpoint: "/v1/messages",
        title: "Kirim Gambar / Dokumen / Media",
        description:
          "Kirim file media (image, document, audio, video) beserta caption melalui URL file.",
        curl: `curl -X POST "${baseUrl}/v1/messages" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    "to": "6281234567890",
    "type": "image",
    "media_url": "https://example.com/invoices/inv-1042.jpg",
    "caption": "Berikut bukti pembayaran & invoice Anda.",
    "message": "Invoice #1042"
  }'`,
        javascript: `const response = await fetch("${baseUrl}/v1/messages", {
  method: "POST",
  headers: {
    "X-API-Key": "${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    session_id: "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    to: "6281234567890",
    type: "image", // "image" | "document" | "video" | "audio"
    media_url: "https://example.com/invoices/inv-1042.jpg",
    caption: "Berikut bukti pembayaran & invoice Anda.",
    message: "Invoice #1042"
  })
});

const data = await response.json();
console.log(data);`,
        python: `import requests

response = requests.post(
    "${baseUrl}/v1/messages",
    headers={"X-API-Key": "${apiKey}"},
    json={
        "session_id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
        "to": "6281234567890",
        "type": "image",
        "media_url": "https://example.com/invoices/inv-1042.jpg",
        "caption": "Berikut bukti pembayaran & invoice Anda.",
        "message": "Invoice #1042"
    }
)
print(response.json())`,
        php: `<?php
$payload = [
    "session_id" => "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    "to"         => "6281234567890",
    "type"       => "image",
    "media_url"  => "https://example.com/invoices/inv-1042.jpg",
    "caption"    => "Berikut bukti pembayaran & invoice Anda.",
    "message"    => "Invoice #1042"
];

$ch = curl_init("${baseUrl}/v1/messages");
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "X-API-Key: ${apiKey}",
    "Content-Type: application/json"
]);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$result = curl_exec($ch);
curl_close($ch);
echo $result;`,
        response: `{
  "success": true,
  "message": "OK",
  "data": {
    "message_id": "98cc124b-34a1-4011-8be9-09fca99214d0",
    "session_id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    "to": "6281234567890",
    "status": "sent",
    "type": "image",
    "media_url": "https://example.com/invoices/inv-1042.jpg"
  }
}`,
      },

      sessions: {
        method: "GET",
        endpoint: "/v1/sessions",
        title: "Cek WhatsApp Sessions yang Aktif",
        description:
          "Ambil daftar session WhatsApp aktif tanpa perlu membuka web dashboard, sangat berguna untuk load-balancing atau multi-device.",
        curl: `curl -X GET "${baseUrl}/v1/sessions" \\
  -H "X-API-Key: ${apiKey}"`,
        javascript: `const res = await fetch("${baseUrl}/v1/sessions", {
  headers: { "X-API-Key": "${apiKey}" }
});
const { data: sessions } = await res.json();

// Dapatkan session yang sedang aktif
const activeSession = sessions.find(s => s.status === "active");
console.log("Pakai Session ID:", activeSession?.id);`,
        python: `import requests

res = requests.get(
    "${baseUrl}/v1/sessions",
    headers={"X-API-Key": "${apiKey}"}
)
sessions = res.json().get("data", [])
for s in sessions:
    print(f"[{s['status']}] {s['name']} -> ID: {s['id']}")`,
        php: `<?php
$ch = curl_init("${baseUrl}/v1/sessions");
curl_setopt($ch, CURLOPT_HTTPHEADER, ["X-API-Key: ${apiKey}"]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$sessions = json_decode(curl_exec($ch), true);
curl_close($ch);

print_r($sessions["data"]);`,
        response: `{
  "success": true,
  "data": [
    {
      "id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
      "name": "Customer Support WhatsApp",
      "status": "active",
      "provider_type": "baileys",
      "created_at": "2026-10-25T03:31:13.108Z"
    }
  ]
}`,
      },

      broadcast: {
        method: "POST",
        endpoint: "/v1/broadcast",
        title: "Kirim Broadcast Pesan Masal",
        description:
          "Kirim pesan ke banyak nomor sekaligus secara otomatis dengan jeda delay antar pesan agar aman dari blokir.",
        curl: `curl -X POST "${baseUrl}/v1/broadcast" \\
  -H "X-API-Key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "session_id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    "recipients": ["6281234567890", "6289876543210", "6285551234567"],
    "message": "Halo pelanggan setia! Ada promo flash sale 50% hari ini 🎉",
    "delay_ms": 3000
  }'`,
        javascript: `const res = await fetch("${baseUrl}/v1/broadcast", {
  method: "POST",
  headers: {
    "X-API-Key": "${apiKey}",
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    session_id: "4a62b976-f038-4c60-84d4-2d280b9a48aa",
    recipients: ["6281234567890", "6289876543210"],
    message: "Halo! Dapatkan diskon 50% hari ini 🎉",
    delay_ms: 3000
  })
});

const data = await res.json();
console.log("Job ID:", data.data?.job_id, "Total Antrian:", data.data?.total);`,
        python: `import requests

res = requests.post(
    "${baseUrl}/v1/broadcast",
    headers={"X-API-Key": "${apiKey}"},
    json={
        "session_id": "4a62b976-f038-4c60-84d4-2d280b9a48aa",
        "recipients": ["6281234567890", "6289876543210"],
        "message": "Halo! Dapatkan diskon 50% hari ini 🎉",
        "delay_ms": 3000
    }
)
print(res.json())`,
        php: `<?php
$ch = curl_init("${baseUrl}/v1/broadcast");
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => [
        "X-API-Key: ${apiKey}",
        "Content-Type: application/json"
    ],
    CURLOPT_POSTFIELDS => json_encode([
        "session_id" => "4a62b976-f038-4c60-84d4-2d280b9a48aa",
        "recipients" => ["6281234567890", "6289876543210"],
        "message"    => "Halo! Dapatkan diskon 50% hari ini 🎉",
        "delay_ms"   => 3000
    ])
]);
$res = curl_exec($ch);
curl_close($ch);
print_r(json_decode($res, true));`,
        response: `{
  "success": true,
  "message": "OK",
  "data": {
    "job_id": "673f8a91-456c-482a-bc91-20984dafa123",
    "total": 2,
    "status": "processing"
  }
}`,
      },
    };
  };

  const snippets = getSnippets(BASE, keyDisplay);
  const current = snippets[scenario];
  const activeCode = current[lang];

  const handleCopy = () => {
    void navigator.clipboard.writeText(activeCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card overflow-hidden border-brand-900/40 bg-gray-900/90 shadow-xl transition-all">
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 border-b border-gray-800 bg-gradient-to-r from-gray-900 via-gray-900 to-brand-950/40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-600/20 border border-brand-500/30 flex items-center justify-center text-brand-400 shrink-0">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-white">
                Contoh Integrasi API untuk Developer
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-brand-500/10 text-brand-400 border border-brand-500/20">
                REST v1 Ready
              </span>
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Salin kode di bawah untuk langsung menguji pengiriman pesan dari aplikasi Anda
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/public-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-xs flex items-center gap-1.5 py-1.5 px-3"
          >
            <span>Buka Full Docs</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1.5 rounded-lg border border-gray-800 bg-gray-850 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-5 space-y-5">
          {/* Scenario Selector Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {[
              { id: "text", label: "Kirim Pesan Teks", icon: Send },
              { id: "media", label: "Kirim Media / Gambar", icon: Image },
              { id: "sessions", label: "Daftar Session Aktif", icon: Radio },
              { id: "broadcast", label: "Broadcast Massal", icon: Layers },
            ].map((sc) => {
              const Icon = sc.icon;
              const isActive = scenario === sc.id;
              return (
                <button
                  key={sc.id}
                  onClick={() => setScenario(sc.id as Scenario)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                    isActive
                      ? "bg-brand-600 text-white shadow-lg shadow-brand-600/25 ring-1 ring-brand-400/50"
                      : "bg-gray-850 text-gray-400 border border-gray-800 hover:bg-gray-800 hover:text-gray-200"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{sc.label}</span>
                </button>
              );
            })}
          </div>

          {/* Description & Endpoint URL banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-950/80 border border-gray-800/80 rounded-xl p-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    current.method === "POST"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800/50"
                      : "bg-blue-950 text-blue-400 border border-blue-800/50"
                  }`}
                >
                  {current.method}
                </span>
                <code className="text-xs font-mono font-semibold text-gray-200">
                  {BASE}
                  {current.endpoint}
                </code>
              </div>
              <p className="text-xs text-gray-400">{current.description}</p>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-gray-400 bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-lg shrink-0">
              <span className="text-gray-500">Header:</span>
              <code className="text-brand-300 font-mono">X-API-Key</code>
              <span className="text-gray-600">atau</span>
              <code className="text-brand-300 font-mono">Authorization: Bearer</code>
            </div>
          </div>

          {/* Code Section */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left: Code Snippet (8 cols) */}
            <div className="lg:col-span-8 flex flex-col rounded-xl border border-gray-800 bg-gray-950 overflow-hidden shadow-inner">
              {/* Language Tabs & Copy Button */}
              <div className="flex items-center justify-between px-3 py-2 bg-gray-900/80 border-b border-gray-800 text-xs">
                <div className="flex items-center gap-1">
                  <Terminal className="w-3.5 h-3.5 text-gray-500 mr-1.5 hidden sm:inline" />
                  {[
                    { id: "curl", label: "cURL" },
                    { id: "javascript", label: "Node.js (Fetch)" },
                    { id: "python", label: "Python" },
                    { id: "php", label: "PHP" },
                  ].map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setLang(l.id as Lang)}
                      className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                        lang === l.id
                          ? "bg-gray-800 text-white font-semibold"
                          : "text-gray-400 hover:text-gray-200 hover:bg-gray-850"
                      }`}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 text-xs text-gray-300 hover:text-white bg-gray-800 hover:bg-gray-700 px-2.5 py-1 rounded-md transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-brand-400" />
                      <span className="text-brand-400 font-medium">Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Kode</span>
                    </>
                  )}
                </button>
              </div>

              {/* Code Pre Block */}
              <div className="p-4 overflow-x-auto text-xs font-mono leading-relaxed text-gray-300 scrollbar-thin">
                <pre>{activeCode}</pre>
              </div>
            </div>

            {/* Right: Response Preview (4 cols) */}
            <div className="lg:col-span-4 flex flex-col rounded-xl border border-gray-800 bg-gray-950 overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 bg-gray-900/80 border-b border-gray-800 text-xs">
                <div className="flex items-center gap-1.5 text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
                  <span className="font-semibold text-gray-300">Contoh Response (200 OK)</span>
                </div>
              </div>

              <div className="p-4 overflow-x-auto text-[11px] font-mono leading-relaxed text-emerald-400/90 scrollbar-thin">
                <pre>{current.response}</pre>
              </div>
            </div>
          </div>

          {/* Quick Tip Footer */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
              <span>
                <strong>Mode Sandbox:</strong> Tambahkan{" "}
                <code className="text-brand-300 font-mono bg-gray-850 px-1.5 py-0.5 rounded border border-gray-800">
                  &quot;sandbox&quot;: true
                </code>{" "}
                dalam payload JSON untuk mencoba API tanpa memotong limit atau mengirim chat WhatsApp nyata.
              </span>
            </div>

            <span className="text-[11px] text-gray-500 whitespace-nowrap">
              Rate limit: 60 req / menit
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
