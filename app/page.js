"use client";
import { useState, useEffect } from "react";
import Hero from "../components/Hero";
import ATSScorer from "../components/ATSScorer";
import Footer from "../components/Footer";

export default function Home() {
  const [pdfReady, setPdfReady] = useState(false);

  useEffect(() => {
    // Initialize pdf.js worker
    const check = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
        setPdfReady(true);
      } else {
        setTimeout(check, 200);
      }
    };
    check();
  }, []);

  return (
    <main className="min-h-screen">
      <Hero />
      <ATSScorer pdfReady={pdfReady} />
      <Footer />
    </main>
  );
}
