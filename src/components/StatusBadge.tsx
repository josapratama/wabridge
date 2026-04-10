interface Props {
  value: string;
}

const map: Record<string, string> = {
  active: "bg-brand-500/15 text-brand-400 ring-brand-500/30",
  inactive: "bg-gray-700/40 text-gray-400 ring-gray-600/30",
  sent: "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  delivered: "bg-brand-500/15 text-brand-400 ring-brand-500/30",
  read: "bg-purple-500/15 text-purple-400 ring-purple-500/30",
  queued: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30",
  failed: "bg-red-500/15 text-red-400 ring-red-500/30",
  received: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30",
  "meta-cloud": "bg-blue-500/15 text-blue-400 ring-blue-500/30",
  bsp: "bg-orange-500/15 text-orange-400 ring-orange-500/30",
  ok: "bg-brand-500/15 text-brand-400 ring-brand-500/30",
  degraded: "bg-yellow-500/15 text-yellow-400 ring-yellow-500/30",
  inbound: "bg-cyan-500/15 text-cyan-400 ring-cyan-500/30",
  outbound: "bg-indigo-500/15 text-indigo-400 ring-indigo-500/30",
};

export default function StatusBadge({ value }: Props) {
  const cls = map[value] ?? "bg-gray-700/40 text-gray-400 ring-gray-600/30";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ${cls}`}
    >
      {value}
    </span>
  );
}
