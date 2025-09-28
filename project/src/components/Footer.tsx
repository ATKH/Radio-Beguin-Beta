// src/components/Footer.tsx
'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-pink-500 text-pink-500 text-xs py-3 px-6 flex flex-col md:flex-row justify-between items-center gap-2 md:gap-0">
      {/* Mention légales et copyright */}
      <div className="text-center md:text-left">
        © {new Date().getFullYear()} Radio Béguin. Tous droits réservés.
      </div>

      {/* Liens légaux et contacts */}
      <div className="flex flex-wrap justify-center md:justify-end gap-4">
        <Link href="/mentions-legales" className="hover:text-pink-700 transition-colors">
          Mentions légales
        </Link>
        <Link href="/politique-confidentialite" className="hover:text-pink-700 transition-colors">
          Politique de confidentialité
        </Link>
        <Link href="mailto:lebeguin@radiobeguin.com" className="hover:text-pink-700 transition-colors">
          Contact
        </Link>
      </div>
    </footer>
  );
}
