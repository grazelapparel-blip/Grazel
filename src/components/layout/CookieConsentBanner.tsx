import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Cookie, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConsentPreferences {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
  preferences: boolean;
}

const defaultPreferences: ConsentPreferences = {
  essential: true,
  analytics: false,
  marketing: false,
  preferences: false,
};

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>(defaultPreferences);

  useEffect(() => {
    const stored = localStorage.getItem('grazel-cookie-consent');
    if (!stored) {
      setVisible(true);
      return;
    }

    try {
      const parsed = JSON.parse(stored);
      setPreferences({ ...defaultPreferences, ...parsed });
    } catch {
      setPreferences(defaultPreferences);
    }
  }, []);

  const saveConsent = async (consent: ConsentPreferences) => {
    localStorage.setItem('grazel-cookie-consent', JSON.stringify(consent));
    try {
      await fetch('/api/cookies/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent }),
      });
    } catch {
      // Fallback: ignore if the endpoint is unavailable.
    }
    setVisible(false);
  };

  const togglePreference = (key: keyof ConsentPreferences) => {
    setPreferences((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          className="fixed inset-x-0 bottom-0 z-[80] px-4 py-4 sm:px-6"
        >
          <div className="mx-auto max-w-6xl rounded-none border border-border bg-card/95 p-4 shadow-mega backdrop-blur sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Cookie className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-serif text-lg text-foreground">We use cookies to improve your shopping experience</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Essential cookies keep the site secure, while optional analytics and preferences help us personalize the experience.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowDetails((prev) => !prev)}>
                  <SlidersHorizontal className="mr-2 h-4 w-4" /> Manage Preferences
                </Button>
                <Button variant="outline" size="sm" onClick={() => saveConsent({ ...defaultPreferences, essential: true })}>
                  Reject Optional
                </Button>
                <Button size="sm" onClick={() => saveConsent({ ...preferences, essential: true, analytics: true, marketing: true, preferences: true })}>
                  <ShieldCheck className="mr-2 h-4 w-4" /> Accept All
                </Button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-5 grid gap-3 rounded-none border border-border bg-background-cream/70 p-4 text-sm text-muted-foreground sm:grid-cols-2">
                    <label className="flex items-center justify-between gap-4 rounded-none border border-border bg-card/80 px-3 py-3">
                      <span className="font-medium text-foreground">Essential</span>
                      <input type="checkbox" checked={preferences.essential} readOnly className="h-4 w-4" />
                    </label>
                    <label className="flex items-center justify-between gap-4 rounded-none border border-border bg-card/80 px-3 py-3">
                      <span className="font-medium text-foreground">Analytics</span>
                      <input type="checkbox" checked={preferences.analytics} onChange={() => togglePreference('analytics')} className="h-4 w-4" />
                    </label>
                    <label className="flex items-center justify-between gap-4 rounded-none border border-border bg-card/80 px-3 py-3">
                      <span className="font-medium text-foreground">Marketing</span>
                      <input type="checkbox" checked={preferences.marketing} onChange={() => togglePreference('marketing')} className="h-4 w-4" />
                    </label>
                    <label className="flex items-center justify-between gap-4 rounded-none border border-border bg-card/80 px-3 py-3">
                      <span className="font-medium text-foreground">Preferences</span>
                      <input type="checkbox" checked={preferences.preferences} onChange={() => togglePreference('preferences')} className="h-4 w-4" />
                    </label>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <Button size="sm" onClick={() => saveConsent(preferences)}>Save Preferences</Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
