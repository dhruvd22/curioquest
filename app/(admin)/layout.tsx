import { notFound } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }
  return (
    <div>
      <div className="bg-red-600 text-white text-center py-2">Admin (dev only)</div>
      {children}
    </div>
  );
}
