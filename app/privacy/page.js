export default function PrivacyPage() {
  return (
    <main className="min-h-screen px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <a
          href="/"
          className="inline-flex items-center gap-1 text-sm mb-8 no-underline transition-colors"
          style={{ color: "var(--text-muted)" }}
        >
          ← Back to ApplyKaro
        </a>

        <h1 className="text-3xl font-extrabold tracking-tight mb-2" style={{ color: "var(--text-secondary)" }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-10" style={{ color: "var(--text-faint)" }}>
          Last updated: April 7, 2025
        </p>

        {[
          {
            title: "Overview",
            body: "ApplyKaro Autofill is a Chrome extension that helps users fill job application forms automatically using AI. We are committed to protecting your privacy. This policy explains what data we collect, how we use it, and what stays on your device.",
          },
          {
            title: "Data stored locally on your device",
            body: "The following data is stored only in your browser using chrome.storage.local and never sent to our servers:\n\n• Your profile (name, email, phone, education, experience, skills)\n• Resume text extracted from your PDF\n• Your credit count\n• Your anonymous user ID\n• Your Anthropic API key (if you choose to provide one)",
          },
          {
            title: "Data sent to our servers",
            body: "When you use the AI autofill or resume parsing features (without your own API key), your resume text and job form field names are sent to our API endpoint at applykaro-nine.vercel.app. This data is used only to generate autofill suggestions and is not stored or logged on our servers.",
          },
          {
            title: "Bring your own API key",
            body: "If you provide your own Anthropic API key in the extension settings, all AI requests are made directly from your browser to Anthropic's API. Your key is stored locally in your browser only and is never sent to our servers.",
          },
          {
            title: "Payments",
            body: "Payments are processed by Gumroad. When you purchase credits, Gumroad sends us your anonymous user ID (which you provide at checkout) and payment confirmation. We do not receive or store your credit card details. See Gumroad's privacy policy at gumroad.com/privacy.",
          },
          {
            title: "Permissions used",
            body: "• activeTab — to read form fields on the current job application page\n• storage — to save your profile and credits locally in your browser\n• scripting — to inject the autofill UI on job application pages\n• tabs — to open the Gumroad checkout page when purchasing credits",
          },
          {
            title: "No tracking or analytics",
            body: "We do not use any analytics, tracking pixels, or third-party monitoring tools. We do not sell your data to anyone.",
          },
          {
            title: "Children's privacy",
            body: "ApplyKaro is not directed at children under 13. We do not knowingly collect data from children.",
          },
          {
            title: "Contact",
            body: "For privacy questions or data deletion requests, contact us at: applykaro@proton.me",
          },
        ].map((section) => (
          <div key={section.title} className="mb-8">
            <h2 className="text-base font-bold mb-2" style={{ color: "var(--text-secondary)" }}>
              {section.title}
            </h2>
            <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--text-muted)" }}>
              {section.body}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
