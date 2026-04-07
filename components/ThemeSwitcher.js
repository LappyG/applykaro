"use client";
import { useTheme } from "./ThemeProvider";

const themes = [
  { id: "light", label: "Light", icon: "☀️" },
  { id: "dark", label: "Dark", icon: "🌙" },
  { id: "calm", label: "Calm", icon: "🍵" },
];

export default function ThemeSwitcher() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex gap-1 p-1 rounded-xl theme-switcher-bg">
      {themes.map((t) => (
        <button
          key={t.id}
          onClick={() => setTheme(t.id)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all duration-200"
          style={{
            background: theme === t.id ? "var(--accent)" : "transparent",
            color: theme === t.id ? "#fff" : "var(--text-muted)",
            fontFamily: "inherit",
          }}
          title={t.label}
        >
          {t.icon} {t.label}
        </button>
      ))}
    </div>
  );
}
