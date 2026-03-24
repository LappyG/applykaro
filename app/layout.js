import "./globals.css";

export const metadata = {
  title: "ApplyKaro — AI-Powered ATS Resume Scorer for Indian Job Seekers",
  description:
    "Upload your resume and job description to get an instant ATS match score. AI-powered analysis with skill matching, keyword gaps, and rewrite suggestions. Built for Indian job seekers.",
  keywords: [
    "ATS score checker",
    "resume scanner India",
    "Naukri resume checker",
    "ATS resume score",
    "job application India",
    "resume keyword checker",
    "AI resume analyzer",
    "ApplyKaro",
  ],
  openGraph: {
    title: "ApplyKaro — AI Resume Scorer",
    description: "Check your ATS score before you apply. Free for Indian job seekers.",
    type: "website",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;700;800&display=swap"
          rel="stylesheet"
        />
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js" defer />
      </head>
      <body>{children}</body>
    </html>
  );
}
