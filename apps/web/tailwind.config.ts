import type { Config } from "tailwindcss";
export default { darkMode:"class", content:["./src/**/*.{ts,tsx}"], theme:{ extend:{ colors:{ primary:{ DEFAULT:"#6366f1", foreground:"#fff" } } } }, plugins:[] } satisfies Config;
