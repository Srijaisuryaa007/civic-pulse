import React, { useState, useEffect } from 'react';
import { IconDeviceMobile, IconX, IconDownload } from '@tabler/icons-react';

export default function PwaInstallPrompt() {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwa_prompt_dismissed') === 'true');
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  if (dismissed) return null;

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDismissed(true);
      }
    } else {
      alert("To install CivicPulse: tap Share / Menu in your browser and select 'Add to Home Screen'.");
      setDismissed(true);
      localStorage.setItem('pwa_prompt_dismissed', 'true');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_prompt_dismissed', 'true');
  };

  return (
    <div className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:w-96 z-50 bg-[#1A1A1A] dark:bg-[#111613] border border-[#D4AF37]/40 p-4 rounded-2xl shadow-soft-xl text-white flex items-start gap-3 animate-slideUp">
      <div className="p-2.5 bg-[#D4AF37]/20 rounded-xl text-[#D4AF37] shrink-0">
        <IconDeviceMobile size={22} />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-serif text-sm font-bold text-white tracking-tight">Install CivicPulse App</h4>
        <p className="text-xs text-white/70 mt-0.5 font-sans leading-relaxed">
          Add CivicPulse to your home screen for instant civic camera audits and real-time municipal alerts.
        </p>
        <div className="flex items-center gap-3 mt-3">
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#D4AF37] text-[#1A1A1A] text-xs font-mono uppercase font-bold rounded-lg hover:bg-white transition-colors"
          >
            <IconDownload size={14} /> Install Now
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs text-white/60 hover:text-white font-sans underline"
          >
            Maybe Later
          </button>
        </div>
      </div>
      <button
        onClick={handleDismiss}
        className="text-white/40 hover:text-white transition-colors p-1"
      >
        <IconX size={16} />
      </button>
    </div>
  );
}
