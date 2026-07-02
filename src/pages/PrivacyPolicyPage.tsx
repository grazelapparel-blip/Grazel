import { ShieldCheck } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export function PrivacyPolicyPage() {
  return (
    <Layout>
      <div className="min-h-[calc(100vh-60px)] bg-background-cream py-16">
        <div className="container max-w-4xl">
          <div className="mb-10 text-center">
            <div className="mb-4 flex justify-center">
              <ShieldCheck className="h-10 w-10 text-primary" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-foreground">Privacy Policy</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              We respect your privacy and handle your personal information responsibly.
            </p>
          </div>

          <div className="space-y-8 bg-card border border-border p-8 shadow-mega">
            <section>
              <h2 className="font-serif text-xl text-foreground mb-3">Information We Collect</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We collect information you provide during sign-up, checkout, and contact forms, including your name, email, phone number, shipping address, and order history. We also collect limited technical information such as device type and browsing activity to improve your experience.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-3">How We Use It</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Your data is used to process orders, provide customer support, personalize products and offers, manage subscriptions, and comply with legal obligations. We never sell your personal data to third parties.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-3">Cookies and Tracking</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use cookies and similar tools to remember preferences, improve site performance, and understand how visitors use our website. You can manage or disable optional cookies through our cookie preferences page.
              </p>
            </section>

            <section>
              <h2 className="font-serif text-xl text-foreground mb-3">Your Choices</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You may update your account information, unsubscribe from marketing emails, and request deletion of certain personal data by contacting our support team. Some information may need to remain for order and legal record-keeping.
              </p>
            </section>
          </div>
        </div>
      </div>
    </Layout>
  );
}
