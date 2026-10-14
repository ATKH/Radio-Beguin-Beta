import TickerAdmin from '@/components/TickerAdmin';

export const metadata = {
  title: 'Modération de la barre',
  robots: { index: false, follow: false },
};

export default function AdminTickerPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <TickerAdmin />
    </main>
  );
}