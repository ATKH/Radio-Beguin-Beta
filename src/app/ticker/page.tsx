import TickerSubmitForm from '@/components/TickerSubmitForm';

export const metadata = {
  title: 'Un message pour la barre',
};

export default function TickerPage() {
  return (
    <main className="container mx-auto max-w-xl px-4 py-10">
      <TickerSubmitForm />
    </main>
  );
}