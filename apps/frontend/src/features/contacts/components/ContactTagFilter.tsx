interface Props {
  tags: string[];
  active: string;
  onChange: (tag: string) => void;
}

export default function ContactTagFilter({ tags, active, onChange }: Props) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onChange("")}
        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
          !active
            ? "bg-brand-600 text-white"
            : "bg-gray-800 text-gray-400 hover:text-gray-200"
        }`}
      >
        All
      </button>
      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(tag === active ? "" : tag)}
          className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
            active === tag
              ? "bg-brand-600 text-white"
              : "bg-gray-800 text-gray-400 hover:text-gray-200"
          }`}
        >
          {tag}
        </button>
      ))}
    </div>
  );
}
