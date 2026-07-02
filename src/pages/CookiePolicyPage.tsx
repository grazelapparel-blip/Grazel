import { useState, useEffect } from 'react';
import { Cookie, Info } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function CookiePolicyPage() {
  const [showBanner, setShowBanner] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: false,
    marketing: false,
    preferences: false,
  });

  useEffect(() => {
    // Check if user has already consented
    const consentGiven = localStorage.getItem('grazel-cookie-consent');
    if (!consentGiven) {
      setShowBanner(true);
    }
  }, []);

  const handleAcceptAll = async () => {
    const newPreferences = {
      essential: true,
      analytics: true,
      marketing: true,
      preferences: true,
    };
    await saveCookieConsent(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    toast.success('Cookie preferences saved!');
  };

  const handleRejectAll = async () => {
    const newPreferences = {
      essential: true,
      analytics: false,
      marketing: false,
      preferences: false,
    };
    await saveCookieConsent(newPreferences);
    setPreferences(newPreferences);
    setShowBanner(false);
    toast.info('Only essential cookies enabled.');
  };

  const handleSavePreferences = async () => {
    await saveCookieConsent(preferences);
    setShowBanner(false);
    toast.success('Cookie preferences saved!');
  };

  const saveCookieConsent = async (consent: any) => {
    try {
      await fetch('/api/cookies/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: localStorage.getItem('grazel_session_id') || Date.now().toString(),
          ipAddress: 'client', // Will be set by server
          consent,
        }),
      });

      localStorage.setItem('grazel-cookie-consent', JSON.stringify(consent));
    } catch (err) {
      console.error('Error saving cookie consent:', err);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-60px)] bg-background-cream py-16">
        <div className="container max-w-3xl">
          {/* Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <Cookie className="h-8 w-8 text-primary" />
              <h1 className="font-serif text-3xl lg:text-4xl text-foreground">Cookie Policy</h1>
            </div>
            <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString('en-IN')}</p>
          </div>

          {/* Content */}
          <div className="bg-card border border-border p-8 space-y-8 shadow-mega mb-12">
            <section>
              <h2 className="font-serif text-xl text-foreground mb-4">What Are Cookies?</h2>
              <p className="text-muted-foreground leading-relaxed">
                Cookies are small text files that are placed on your device when you visit our website. They help us
                remember your preferences and understand how you use our site. Cookies are widely used to make websites
                work more efficiently and to provide information to site owners.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-4">Types of Cookies We Use</h2>
              <div className="space-y-4">
                <div className="border border-border-light p-4 bg-background-cream/40 rounded-sm">
                  <h3 className="font-medium text-foreground mb-2">1. Essential Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies are necessary for the website to function properly. They enable core functionality such
                    as security, network management, and accessibility. You cannot disable these cookies as they are
                    required for the site to work.
                  </p>
                </div>

                <div className="border border-border-light p-4 bg-background-cream/40 rounded-sm">
                  <h3 className="font-medium text-foreground mb-2">2. Analytics Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies help us understand how visitors interact with our website. They collect information
                    about pages visited, time spent on pages, and links clicked. This data helps us improve our website
                    and user experience.
                  </p>
                </div>

                <div className="border border-border-light p-4 bg-background-cream/40 rounded-sm">
                  <h3 className="font-medium text-foreground mb-2">3. Marketing Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies are used to deliver personalized advertisements based on your browsing history and
                    interests. They help us show you relevant products and promotions.
                  </p>
                </div>

                <div className="border border-border-light p-4 bg-background-cream/40 rounded-sm">
                  <h3 className="font-medium text-foreground mb-2">4. Preference Cookies</h3>
                  <p className="text-sm text-muted-foreground">
                    These cookies remember your preferences and settings, such as language preference, theme choice, and
                    saved items in your cart.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-4">Your Cookie Choices</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                You have the right to control whether cookies are set on your device. Essential cookies cannot be
                disabled, but you can manage other types of cookies:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>You can change your cookie settings at any time on this page</li>
                <li>You can delete cookies from your browser settings</li>
                <li>You can set your browser to warn you before accepting cookies</li>
                <li>You can disable cookies entirely (this may affect site functionality)</li>
              </ul>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-4">Third-Party Cookies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use third-party services such as Google Analytics and Razorpay that may set their own cookies on
                your device. These companies have their own privacy policies. We recommend reviewing their policies for
                more information about their cookie practices.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-4">Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We take data security seriously and use industry-standard encryption and security measures to protect
                your information. However, no method of transmission over the internet is completely secure.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-4">Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about our cookie policy or how we use cookies, please contact us at
                support@grazel.com or through our contact form.
              </p>
            </section>
          </div>

          {/* Cookie Preferences */}
          <div className="bg-card border border-border p-8 shadow-mega">
            <h2 className="font-serif text-xl text-foreground mb-6 pb-4 border-b border-border">
              Cookie Preferences
            </h2>
            <div className="space-y-4 mb-8">
              {[
                {
                  key: 'essential',
                  label: 'Essential Cookies',
                  description: 'Required for site functionality',
                  disabled: true,
                },
                {
                  key: 'analytics',
                  label: 'Analytics Cookies',
                  description: 'Help us improve the website',
                },
                {
                  key: 'marketing',
                  label: 'Marketing Cookies',
                  description: 'For personalized ads and promotions',
                },
                {
                  key: 'preferences',
                  label: 'Preference Cookies',
                  description: 'Remember your settings and preferences',
                },
              ].map((cookie) => (
                <label key={cookie.key} className="flex items-center gap-3 p-4 border border-border rounded-sm hover:bg-background-cream/40 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preferences[cookie.key as keyof typeof preferences]}
                    onChange={(e) =>
                      setPreferences({
                        ...preferences,
                        [cookie.key]: e.target.checked,
                      })
                    }
                    disabled={cookie.disabled}
                    className="h-4 w-4"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-sm text-foreground">{cookie.label}</p>
                    <p className="text-xs text-muted-foreground">{cookie.description}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-4">
              <Button onClick={handleRejectAll} variant="outline" className="flex-1">
                Reject All
              </Button>
              <Button onClick={handleSavePreferences} className="flex-1">
                Save Preferences
              </Button>
              <Button onClick={handleAcceptAll} className="flex-1">
                Accept All
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Cookie Banner */}
      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-foreground text-background-cream p-6 shadow-lg z-50 border-t border-border">
          <div className="container max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex gap-4 flex-1">
                <Cookie className="h-6 w-6 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-sm mb-1">We Use Cookies</h3>
                  <p className="text-xs opacity-90">
                    We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. By
                    continuing to use this site, you agree to our use of cookies.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <button
                  onClick={handleRejectAll}
                  className="px-4 py-2 text-xs font-medium border border-current rounded-sm hover:opacity-80 transition-opacity"
                >
                  Reject
                </button>
                <a
                  href="/cookies"
                  className="px-4 py-2 text-xs font-medium border border-current rounded-sm hover:opacity-80 transition-opacity"
                >
                  Customize
                </a>
                <button
                  onClick={handleAcceptAll}
                  className="px-4 py-2 text-xs font-medium bg-primary-foreground text-foreground rounded-sm hover:opacity-90 transition-opacity"
                >
                  Accept All
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
