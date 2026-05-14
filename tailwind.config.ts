import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  // Hard-lock: never respond to OS light/dark preference
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        tight: ['var(--font-inter-tight)', 'Inter Tight', 'sans-serif'],
        mono:  ['var(--font-geist-mono)', 'ui-monospace', 'monospace'],
      },
    },
  },
  plugins: [],
};
export default config;
