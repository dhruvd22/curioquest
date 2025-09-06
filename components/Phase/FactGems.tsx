export default function FactGems({ items }: { items: { sourceId: string; text: string }[] }) {
  return (
    <ul className="list-disc pl-6">
      {items.map((it, i) => (
        <li key={i}><strong>Did you know?</strong> {it.text}</li>
      ))}
    </ul>
  );
}
