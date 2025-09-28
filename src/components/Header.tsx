'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Menu, X, Instagram, Mail, Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { label: 'Home', href: '/' },
    { label: 'Podcasts', href: '/shows' },
    { label: 'À propos', href: '/about' },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  return (
    <header className="bg-transparent sticky top-0 z-50 border-b border-[rgba(149,157,255,0.35)]">
      <div className="container mx-auto px-4 h-[70px] flex items-center justify-between">
        <Link href="/" className="flex items-center overflow-hidden h-12">
          <img src="/logo.svg" alt="Radio Béguin" className="h-20 w-auto" />
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          {menuItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className="relative font-heading text-foreground/80 hover:text-foreground transition-opacity"
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary rounded-full" />
              )}
            </Link>
          ))}

          <div className="flex items-center space-x-4 ml-6">
            <Link href="https://www.instagram.com/radiobeguin/" target="_blank" rel="noopener noreferrer">
              <Instagram className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
            </Link>
            <Link href="mailto:lebeguin@radiobeguin.com">
              <Mail className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
              className="text-foreground hover:text-primary"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden bg-[rgba(15,23,99,0.85)] border-t border-[rgba(149,157,255,0.35)]">
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="relative font-heading text-foreground/80 hover:text-foreground transition-opacity"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-1 left-0 w-full h-1 bg-primary rounded-full" />
                )}
              </Link>
            ))}

            <div className="flex items-center space-x-4 mt-2">
              <Link href="https://www.instagram.com/radiobeguin/" target="_blank" rel="noopener noreferrer">
                <Instagram className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
              </Link>
              <Link href="mailto:lebeguin@radiobeguin.com">
                <Mail className="w-5 h-5 text-foreground hover:text-primary transition-colors" />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                className="text-foreground hover:text-primary"
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
