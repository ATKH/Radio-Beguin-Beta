'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Menu, X, Instagram, Mail } from 'lucide-react';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Podcasts', href: '/shows' },
    { label: 'Playlists', href: '/shows/playlists' },
    { label: 'À propos', href: '/about' },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="bg-white sticky top-0 z-50 border-b border-pink-500">
      <div className="container mx-auto px-4 h-[70px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center overflow-hidden h-12">
          <img src="/logo.svg" alt="Radio Béguin" className="h-20 w-auto" />
        </Link>

        {/* Menu desktop */}
        <nav className="hidden md:flex items-center space-x-6">
          {menuItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="relative font-semibold text-pink-500 hover:opacity-80 transition-opacity"
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-pink-500 rounded-full" />
              )}
            </Link>
          ))}

          {/* Icônes à droite */}
          <div className="flex items-center space-x-4 ml-6">
            <Link href="https://www.instagram.com/radiobeguin/" target="_blank" rel="noopener noreferrer">
              <Instagram className="w-5 h-5 text-pink-500 hover:text-pink-600 transition-colors" />
            </Link>
            <Link href="mailto:lebeguin@radiobeguin.com">
              <Mail className="w-5 h-5 text-pink-500 hover:text-pink-600 transition-colors" />
            </Link>
          </div>
        </nav>

        {/* Menu mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5 text-pink-500" /> : <Menu className="h-5 w-5 text-pink-500" />}
        </Button>
      </div>

      {/* Mobile menu dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-pink-500">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="relative font-semibold text-pink-500 hover:opacity-80 transition-opacity"
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-pink-500 rounded-full" />
                )}
              </Link>
            ))}

            {/* Icônes sociales mobile */}
            <div className="flex items-center space-x-4 mt-2">
              <Link href="https://www.instagram.com/radiobeguin/" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-5 h-5 text-pink-500 hover:text-pink-600 transition-colors" />
              </Link>
              <Link href="mailto:lebeguin@radiobeguin.com">
                <Mail className="w-5 h-5 text-pink-500 hover:text-pink-600 transition-colors" />
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
