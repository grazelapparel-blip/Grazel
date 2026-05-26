import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, MessageCircle, User, Phone, CalendarDays } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

const boutiqueEmail = import.meta.env.VITE_BOUTIQUE_EMAIL || 'admin@grazel.com';
const boutiqueWhatsapp = import.meta.env.VITE_BOUTIQUE_WHATSAPP_NUMBER || '';

export function EBoutiquePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occasion, setOccasion] = useState('');
  const [timeline, setTimeline] = useState('');
  const [description, setDescription] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      toast.error('Please sign in to access E-Boutique.');
      navigate('/auth', { replace: true, state: { from: { pathname: '/e-boutique' } } });
    }
  }, [loading, navigate, user]);

  useEffect(() => {
    if (user) {
      setFullName(user.name || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const message = useMemo(() => {
    return [
      'New E-Boutique request',
      '',
      `Name: ${fullName}`,
      `Email: ${email}`,
      `Phone/WhatsApp: ${phone}`,
      `Occasion: ${occasion || 'Not specified'}`,
      `Timeline: ${timeline || 'Not specified'}`,
      '',
      'Description:',
      description,
    ].join('\n');
  }, [description, email, fullName, occasion, phone, timeline]);

  const emailHref = `mailto:${boutiqueEmail}?subject=${encodeURIComponent('New E-Boutique Request')}&body=${encodeURIComponent(message)}`;
  const whatsappHref = boutiqueWhatsapp
    ? `https://wa.me/${boutiqueWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`
    : `https://wa.me/?text=${encodeURIComponent(message)}`;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (!fullName || !email || !phone || !description) {
      toast.error('Please fill in name, email, phone, and description.');
      return;
    }

    setSubmitted(true);
    toast.success('E-Boutique request prepared.');
    window.open(whatsappHref, '_blank', 'noopener,noreferrer');
    window.location.href = emailHref;
  };

  if (loading || !user) {
    return (
      <Layout>
        <div className="min-h-[60vh] bg-background-cream flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <main className="bg-background-cream min-h-[calc(100vh-100px)]">
        <section className="container py-14 lg:py-20">
          <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="space-y-5">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Private Styling</p>
              <h1 className="font-serif text-4xl lg:text-5xl text-foreground tracking-tight">E-Boutique</h1>
              <p className="text-sm leading-7 text-muted-foreground max-w-md">
                Share your garment idea, styling need, or occasion brief with the Grazel team.
              </p>

              {submitted && (
                <div className="border border-border bg-card p-5 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">Request prepared</p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button asChild variant="outline" className="rounded-none">
                      <a href={emailHref}>
                        <Mail className="mr-2 h-4 w-4" />
                        Email
                      </a>
                    </Button>
                    <Button asChild className="rounded-none">
                      <a href={whatsappHref} target="_blank" rel="noreferrer">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        WhatsApp
                      </a>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="bg-card border border-border p-6 sm:p-8 space-y-6">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="boutique-name" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="boutique-name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="w-full border border-border bg-background-cream py-3 pl-10 pr-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="boutique-email" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="boutique-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="w-full border border-border bg-background-cream py-3 pl-10 pr-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="boutique-phone" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Phone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="boutique-phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      className="w-full border border-border bg-background-cream py-3 pl-10 pr-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="boutique-timeline" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Timeline
                  </label>
                  <div className="relative">
                    <CalendarDays className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="boutique-timeline"
                      value={timeline}
                      onChange={(event) => setTimeline(event.target.value)}
                      placeholder="Example: 2 weeks"
                      className="w-full border border-border bg-background-cream py-3 pl-10 pr-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="boutique-occasion" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                  Occasion
                </label>
                <input
                  id="boutique-occasion"
                  value={occasion}
                  onChange={(event) => setOccasion(event.target.value)}
                  placeholder="Example: wedding, office wear, vacation"
                  className="w-full border border-border bg-background-cream px-3 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="boutique-description" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                  Description
                </label>
                <textarea
                  id="boutique-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={7}
                  placeholder="Tell us what you are looking for..."
                  className="w-full resize-none border border-border bg-background-cream px-3 py-3 text-sm outline-none focus:border-primary"
                />
              </div>

              <Button type="submit" className="w-full rounded-none py-3.5 text-xs uppercase tracking-[0.2em]">
                Send Request
              </Button>
            </form>
          </div>
        </section>
      </main>
    </Layout>
  );
}
