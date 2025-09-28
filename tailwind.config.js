/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Figtree', 'ui-sans-serif', 'system-ui'],
        title: ['Zilla Slab', 'serif'],
      },
      colors: {
        primary: 'var(--primary)',
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        border: 'var(--border)',
        muted: 'var(--muted)',
      },
      cursor: {
        heart: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Cpath fill='%23ff0080' d='M23.6 4a7.5 7.5 0 0 0-11.6 0L12 4.5l-.1-.1a7.5 7.5 0 0 0-11.5 10.3L12 28l11.6-13.3A7.5 7.5 0 0 0 23.6 4z'/%3E%3C/svg%3E\") 16 16, pointer"
      },
    },
  },
  plugins: [],
};
