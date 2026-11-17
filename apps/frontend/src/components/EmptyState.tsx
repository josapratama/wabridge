import { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-10 sm:py-16 px-4 text-center">
      <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-800/80 border border-gray-700/60 flex items-center justify-center mb-3.5 shadow-inner text-brand-400">
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <h3 className="text-sm sm:text-base font-semibold text-gray-200 mb-1">{title}</h3>
      <p className="text-xs sm:text-sm text-gray-400 max-w-sm mb-4 leading-relaxed">{description}</p>
      {action}
    </div>
  );
}
