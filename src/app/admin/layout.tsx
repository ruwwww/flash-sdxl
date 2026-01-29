import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 p-4 space-y-4">
        <h2 className="text-xl font-bold tracking-tight px-2 text-primary">Flash Admin</h2>
        <nav className="flex flex-col gap-1">
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/admin/dashboard">Dashboard</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/admin/users">Users & Credits</Link>
          </Button>
          <Button variant="ghost" className="justify-start" asChild>
            <Link href="/admin/configuration">System Config</Link>
          </Button>
          <div className="h-px bg-slate-800 my-2" />
          <Button variant="ghost" className="justify-start text-muted-foreground" asChild>
            <Link href="/generate">Back to App</Link>
          </Button>
        </nav>
      </aside>
      
      {/* Content */}
      <main className="flex-1 overflow-auto">
         {children}
      </main>
    </div>
  );
}
