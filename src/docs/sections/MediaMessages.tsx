import { CodeBlock, Note, H2, H3, P } from "../shared";

export default function MediaMessages() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-2">Media Messages</h1>
      <P>
        Send images, documents, audio, video, and location messages by setting
        the <code className="text-brand-400">type</code> field.
      </P>

      <Note type="info">
        Media files must be hosted at a publicly accessible HTTPS URL. The
        WhatsApp server will download the file directly from the URL you
        provide.
      </Note>

      <H2>Image</H2>
      <CodeBlock
        id="media-image"
        code={`{
  "session_id": "sess_abc123",
  "to": "628123456789",
  "message": "Sending photo",
  "type": "image",
  "media_url": "https://example.com/photo.jpg",
  "caption": "Check this out! 📸",
  "media_mime_type": "image/jpeg"
}`}
      />

      <H2>Document</H2>
      <CodeBlock
        id="media-doc"
        code={`{
  "session_id": "sess_abc123",
  "to": "628123456789",
  "message": "Sending document",
  "type": "document",
  "media_url": "https://example.com/invoice.pdf",
  "caption": "Invoice #001",
  "media_mime_type": "application/pdf"
}`}
      />

      <H2>Audio</H2>
      <CodeBlock
        id="media-audio"
        code={`{
  "session_id": "sess_abc123",
  "to": "628123456789",
  "message": "Sending audio",
  "type": "audio",
  "media_url": "https://example.com/voice.mp3",
  "media_mime_type": "audio/mpeg"
}`}
      />

      <H2>Video</H2>
      <CodeBlock
        id="media-video"
        code={`{
  "session_id": "sess_abc123",
  "to": "628123456789",
  "message": "Sending video",
  "type": "video",
  "media_url": "https://example.com/clip.mp4",
  "caption": "Watch this! 🎬",
  "media_mime_type": "video/mp4"
}`}
      />

      <H2>Location</H2>
      <CodeBlock
        id="media-location"
        code={`{
  "session_id": "sess_abc123",
  "to": "628123456789",
  "message": "Sending location",
  "type": "location",
  "latitude": -6.2088,
  "longitude": 106.8456,
  "location_name": "Jakarta, Indonesia"
}`}
      />

      <H2>Supported MIME Types</H2>
      <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden my-3">
        {[
          {
            type: "image",
            mimes: "image/jpeg, image/png, image/webp, image/gif",
          },
          {
            type: "document",
            mimes:
              "application/pdf, application/msword, application/vnd.ms-excel, text/plain, and more",
          },
          {
            type: "audio",
            mimes: "audio/mpeg, audio/ogg, audio/wav, audio/aac",
          },
          { type: "video", mimes: "video/mp4, video/3gpp" },
        ].map((row, i) => (
          <div
            key={row.type}
            className={`flex gap-4 px-4 py-3 text-xs ${i < 3 ? "border-b border-gray-800" : ""}`}
          >
            <code className="text-brand-400 font-mono w-20 shrink-0">
              {row.type}
            </code>
            <span className="text-gray-400">{row.mimes}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
