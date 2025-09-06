"use client";
export default function CopyButton({ text, label }: { text: string; label: string }) {
  return (
    <button
      onClick={() => navigator.clipboard.writeText(text)}
      className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
    >
      {label}
    </button>
  );
}
