'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Menu, X, Instagram, Mail, Moon, Sun, Search } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [isLogoWizzing, setIsLogoWizzing] = useState(false);
  const logoTimeoutRef = useRef<number | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { label: 'Radio', href: '/' },
    { label: 'Shows', href: '/shows' },
    { label: 'Infos', href: '/about' },
  ];

  const isActive = (href: string) => pathname === href || (href !== '/' && pathname.startsWith(href));

  const headerTone = useMemo(
    () =>
      theme === 'dark'
        ? 'bg-[var(--background)]/85 border-white/10 text-[var(--foreground)] shadow-[0_1px_0_rgba(255,255,255,0.05)]'
        : 'bg-white/90 border-black/10 text-[var(--foreground)] shadow-sm',
    [theme]
  );

  const linkTone = 'text-[var(--foreground)] hover:text-[var(--foreground)]';
  const iconTone = theme === 'dark' ? 'text-[var(--foreground)]/70 hover:text-[var(--foreground)]' : 'text-[var(--foreground)]/80 hover:text-[var(--foreground)]';

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    router.push(`/shows?query=${encodeURIComponent(trimmed)}`);
    setQuery('');
    setIsMobileMenuOpen(false);
  };

  useEffect(() => {
    return () => {
      if (logoTimeoutRef.current) {
        window.clearTimeout(logoTimeoutRef.current);
        logoTimeoutRef.current = null;
      }
    };
  }, []);

  const handleLogoClick = () => {
    if (logoTimeoutRef.current) {
      window.clearTimeout(logoTimeoutRef.current);
    }
    setIsLogoWizzing(true);
    logoTimeoutRef.current = window.setTimeout(() => {
      setIsLogoWizzing(false);
      logoTimeoutRef.current = null;
    }, 600);
  };

  return (
    <header className={`sticky top-0 z-50 border-b backdrop-blur transition-colors ${headerTone}`}>
      <div className="container mx-auto px-4 h-14 flex items-center justify-between gap-2">
        <Link
          href="/"
          className="flex items-center overflow-hidden h-12 shrink-0"
          onClick={handleLogoClick}
        >
          <img
            src="/logo.svg"
            alt="Radio Béguin"
            className={`h-14 w-auto transition duration-500 ${isLogoWizzing ? 'animate-bounce-once' : ''}`}
            style={{
              filter:
                theme === 'dark'
                  ? 'brightness(0) saturate(100%) invert(1)'
                  : 'brightness(0) saturate(100%)',
            }}
          />
        </Link>

        {/* --- MOBILE SEARCH --- */}
        <div className="md:hidden flex-1 flex justify-center px-3 min-w-0">
          <form
            onSubmit={handleSearchSubmit}
            autoComplete="off"
            className="flex w-full max-w-[11rem] items-center gap-1.5 rounded-full border border-black px-2.5 py-0.5 shadow-sm transition bg-[var(--accent)]/60 min-w-0"
          >
            <button
              type="submit"
              aria-label="Rechercher"
              className="appearance-none bg-transparent border-0 p-0 m-0 flex items-center justify-center"
            >
              <Search className="h-3.5 w-3.5 stroke-[2.5]" />
            </button>
            <input
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              aria-label="Rechercher un contenu"
              className="flex-1 bg-transparent text-[16px] sm:text-[11px] outline-none placeholder:text-[var(--foreground)]/40 border-none focus:outline-none min-w-0"
              placeholder=""
            />
          </form>
        </div>

        {/* --- DESKTOP NAVIGATION --- */}
        <nav className="hidden md:flex items-center space-x-6 flex-1 justify-end">
          {menuItems.map(item => (
            <Link
              key={item.href}
              href={item.href}
              className={`relative text-sm font-sans uppercase tracking-[0.2em] transition-colors ${linkTone}`}
            >
              {item.label}
              {isActive(item.href) && (
                <span className="absolute -bottom-1 left-0 w-full h-[2px] bg-[var(--primary)] rounded-full" />
              )}
            </Link>
          ))}

          {/* --- DESKTOP SEARCH --- */}
          <form
            onSubmit={handleSearchSubmit}
            autoComplete="off"
            className={`hidden lg:flex items-center gap-2 rounded-full border border-black px-2 py-0.5 transition shadow-sm w-40 bg-[var(--accent)]/40`}
          >
            <button
              type="submit"
              aria-label="Rechercher"
              className="appearance-none bg-transparent border-0 p-0 m-0 flex items-center justify-center"
            >
              <Search className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
            </button>
            <input
              type="search"
              enterKeyHint="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              aria-label="Rechercher un contenu"
              className="flex-1 bg-transparent text-[16px] sm:text-[11px] outline-none placeholder:text-[var(--foreground)]/40 border-none focus:outline-none"
              placeholder=""
            />
          </form>

          <div className="flex items-center space-x-4 ml-6">
            <Link href="https://www.instagram.com/radiobeguin/" target="_blank" rel="noopener noreferrer">
              <Instagram className={`w-5 h-5 transition-colors ${iconTone}`} />
            </Link>
            <Link href="mailto:lebeguin@radiobeguin.com">
              <Mail className={`w-5 h-5 transition-colors ${iconTone}`} />
            </Link>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
              className={`transition-colors ${iconTone} hover:text-[var(--primary)]`}
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
          className={`md:hidden transition-colors ${iconTone}`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div className={`md:hidden border-t backdrop-blur ${theme === 'dark' ? 'bg-[var(--background)]/90 border-white/10' : 'bg-white/95 border-primary/20'}`}>
          <nav className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            {menuItems.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={`relative text-xs font-sans uppercase tracking-[0.2em] transition-colors ${linkTone}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
                {isActive(item.href) && (
                  <span className="absolute -bottom-1 left-0 w-full h-[3px] bg-[var(--primary)] rounded-full" />
                )}
              </Link>
            ))}

            <div className="flex items-center space-x-4 mt-2">
              <Link href="https://www.instagram.com/radiobeguin/" target="_blank" rel="noopener noreferrer">
                <Instagram className={`w-5 h-5 transition-colors ${iconTone}`} />
              </Link>
              <Link href="mailto:lebeguin@radiobeguin.com">
                <Mail className={`w-5 h-5 transition-colors ${iconTone}`} />
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                aria-label={theme === 'dark' ? 'Activer le mode clair' : 'Activer le mode sombre'}
                className={`transition-colors ${iconTone} hover:text-[var(--primary)]`}
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
