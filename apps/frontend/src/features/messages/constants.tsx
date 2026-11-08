import { Image, FileText, Mic, Video, MapPin } from "lucide-react";

export const MESSAGE_TYPES = [
  "text",
  "image",
  "document",
  "audio",
  "video",
  "location",
] as const;
export type MsgType = (typeof MESSAGE_TYPES)[number];

export const TYPE_ICONS: Record<MsgType, React.ReactNode> = {
  text: null,
  image: <Image className="w-3 h-3" />,
  document: <FileText className="w-3 h-3" />,
  audio: <Mic className="w-3 h-3" />,
  video: <Video className="w-3 h-3" />,
  location: <MapPin className="w-3 h-3" />,
};

export const EMPTY_SEND_FORM = {
  sessionId: "",
  to: "",
  message: "",
  type: "text" as MsgType,
  mediaUrl: "",
  mediaCaption: "",
  mediaMimeType: "",
  latitude: "",
  longitude: "",
  locationName: "",
};

export type SendForm = typeof EMPTY_SEND_FORM;
