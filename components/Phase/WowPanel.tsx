export default function WowPanel({ heading, body }: { heading: string; body: string }) {
  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
      <h2 className="text-xl font-semibold mb-1">{heading}</h2>
      <p>{body}</p>
    </div>
  );
}
