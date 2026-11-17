import { Search } from "lucide-react";
import { useI18n } from "../../../context/I18nContext";

interface Props {
  search: string;
  status: string;
  direction: string;
  onSearch: (v: string) => void;
  onStatus: (v: string) => void;
  onDirection: (v: string) => void;
}

const STATUSES = ["queued", "sent", "delivered", "read", "failed", "received"];

export default function MessageFilters({
  search,
  status,
  direction,
  onSearch,
  onStatus,
  onDirection,
}: Props) {
  const { t } = useI18n();

  return (
    <div className="flex flex-wrap gap-3">
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
        <input
          className="input pl-8 text-xs"
          placeholder={t("messages.filter_placeholder", "Cari berdasarkan isi pesan, pengirim, atau tujuan…")}
          value={search}
          onChange={(e) => onSearch(e.target.value)}
        />
      </div>
      <select
        className="input w-36 text-xs"
        value={status}
        onChange={(e) => onStatus(e.target.value)}
      >
        <option value="">{t("messages.all_statuses", "Semua Status")}</option>
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <select
        className="input w-36 text-xs"
        value={direction}
        onChange={(e) => onDirection(e.target.value)}
      >
        <option value="">{t("messages.all_directions", "Semua Arah")}</option>
        <option value="inbound">{t("messages.inbound", "Masuk (Inbound)")}</option>
        <option value="outbound">{t("messages.outbound", "Keluar (Outbound)")}</option>
      </select>
    </div>
  );
}
