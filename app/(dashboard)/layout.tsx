import { requireAuth } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-8 overflow-auto bg-gradient-to-br from-green-50/50 via-white to-orange-50/30">
        {children}
      </main>
    </div>
  );
}
