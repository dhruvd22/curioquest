export default function Hook({ heading, body }: { heading: string; body: string }) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-1">{heading}</h2>
      <p>{body}</p>
    </div>
  );
}
