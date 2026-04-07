import "./globals.css";
import ThemeProvider from "../components/ThemeProvider";
import ThemeSwitcher from "../components/ThemeSwitcher";

export const metadata = {
  title: "ApplyKaro — AI-Powered ATS Resume Scorer",
  description:
    "Upload your resume and job description to get an instant ATS match score. AI-powered analysis with skill matching, keyword gaps, and rewrite suggestions. Powered by Claude.",
  keywords: [
    "ATS score checker",
    "resume scanner",
    "ATS resume score",
    "resume keyword checker",
    "AI resume analyzer",
    "ApplyKaro",
    "Claude AI",
  ],
  openGraph: {
    title: "ApplyKaro — AI Resume Scorer",
    description: "Check your ATS score before you apply. Powered by Claude.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" defer />
      </head>
      <body>
        <ThemeProvider>
          <nav style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "14px 24px",
            borderBottom: "1px solid var(--card-border)",
            background: "var(--bg-primary)",
            position: "sticky",
            top: 0,
            zIndex: 100,
          }}>
            <a href="/" style={{ fontWeight: 800, fontSize: "18px", color: "var(--text-secondary)", textDecoration: "none", letterSpacing: "-0.5px" }}>
              ⚡ ApplyKaro
            </a>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <a href="/" style={{ fontSize: "13px", color: "var(--text-muted)", textDecoration: "none", padding: "6px 12px", borderRadius: "8px" }}>
                ATS Scorer
              </a>
              <a href="/extension" style={{
                fontSize: "13px",
                fontWeight: 700,
                color: "#fff",
                textDecoration: "none",
                padding: "7px 16px",
                borderRadius: "10px",
                background: "linear-gradient(135deg, var(--accent-secondary), var(--accent))",
              }}>
                Chrome Extension
              </a>
              <ThemeSwitcher />
            </div>
          </nav>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
