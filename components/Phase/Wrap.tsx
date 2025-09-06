export default function Wrap({ keyTakeaways }: { keyTakeaways: string[] }) {
  return (
    <div>
      <h3 className="font-semibold">Takeaways</h3>
      <ul className="list-disc pl-6">
        {keyTakeaways.map((k, i) => <li key={i}>{k}</li>)}
      </ul>
    </div>
  );
}
