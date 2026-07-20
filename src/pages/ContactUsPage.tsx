import { useState } from 'react';
import { Mail, MapPin, Send } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch('/api/contact/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        let errorMessage = 'Failed to submit form. Please try again.';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          // Response body was not JSON — use default message
        }
        throw new Error(errorMessage);
      }

      toast.success('Thank you! We\'ve received your message and will get back to you soon.');
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch (err: any) {
      console.error('Contact form error:', err);
      toast.error(err.message || 'Error submitting form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-[calc(100vh-60px)] bg-background-cream py-16">
        <div className="container max-w-5xl">
          {/* Header */}
          <div className="mb-16 text-center">
            <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-4">Get in Touch</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Have questions or feedback? We'd love to hear from you. Our team typically responds within 24-48 hours.
            </p>
          </div>

          {/* Contact Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
            <div className="bg-card border border-border p-8 text-center rounded-sm shadow-mega">
              <Mail className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-medium text-foreground mb-2">Email</h3>
              <a href="mailto:support@grazel.com" className="text-sm text-primary hover:underline">
                support@grazel.com
              </a>
              <p className="text-xs text-muted-foreground mt-2">Response time: 24-48 hours</p>
            </div>

            <div className="bg-card border border-border p-8 text-center rounded-sm shadow-mega">
              <MapPin className="h-8 w-8 mx-auto mb-4 text-primary" />
              <h3 className="font-medium text-foreground mb-2">Address</h3>
              <p className="text-sm text-muted-foreground">
                Grazel Atelier<br />
                Tiruppur,<br />
                Tamil Nadu,<br />
                India
              </p>
            </div>
          </div>

          {/* Contact Form */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-card border border-border p-8 shadow-mega rounded-sm">
              <h2 className="font-serif text-xl text-foreground mb-6">Send us a Message</h2>

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                    placeholder="+91 9876 543 210"
                  />
                </div>

                <div>
                  <label htmlFor="subject" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Subject *
                  </label>
                  <select
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
                  >
                    <option value="">Select a subject...</option>
                    <option value="Product Inquiry">Product Inquiry</option>
                    <option value="Order Issue">Order Issue</option>
                    <option value="Shipping & Delivery">Shipping & Delivery</option>
                    <option value="Return & Refund">Return & Refund</option>
                    <option value="Payment Problem">Payment Problem</option>
                    <option value="Customization Request">Customization Request</option>
                    <option value="General Feedback">General Feedback</option>
                    <option value="Partnership Inquiry">Partnership Inquiry</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="message" className="block text-xs uppercase tracking-[0.15em] text-muted-foreground font-medium mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-border bg-background-cream text-foreground focus:outline-none focus:border-primary text-sm rounded-none resize-none"
                    placeholder="Please share your message, inquiry, or feedback..."
                  />
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 text-xs uppercase tracking-[0.2em] font-medium flex items-center justify-center gap-2"
                >
                  <Send className="h-4 w-4" />
                  {submitting ? 'Sending...' : 'Send Message'}
                </Button>
              </div>
            </form>

            {/* Info */}
            <div className="space-y-8">
              <div className="bg-primary/10 border border-primary/20 p-8 rounded-sm">
                <h3 className="font-serif text-xl text-foreground mb-4">Why Contact Us?</h3>
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Get answers to your questions quickly</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Report issues with your orders</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Request custom products or designs</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Share your feedback and suggestions</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-primary font-bold">•</span>
                    <span>Discuss partnership opportunities</span>
                  </li>
                </ul>
              </div>

              <div className="bg-card border border-border p-8 rounded-sm">
                <h3 className="font-serif text-xl text-foreground mb-4">Response Time</h3>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>
                    <strong>Email:</strong> 24-48 hours
                  </p>
                  <p>
                    <strong>Phone:</strong> Mon-Fri, 10 AM - 6 PM IST
                  </p>
                  <p>
                    <strong>Live Chat:</strong> During business hours
                  </p>
                </div>
              </div>

              <div className="bg-card border border-border p-8 rounded-sm">
                <h3 className="font-serif text-xl text-foreground mb-4">Follow Us</h3>
                <div className="flex gap-4">
                  <a
                    href="https://www.instagram.com/grazelapparel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    Instagram
                  </a>
                  <a
                    href="https://www.facebook.com/grazelapparel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    Facebook
                  </a>
                  <a
                    href="https://twitter.com/grazelapparel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    Twitter/X
                  </a>
                  <a
                    href="https://www.linkedin.com/company/grazelapparel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    LinkedIn
                  </a>
                  <a
                    href="https://www.youtube.com/@grazelapparel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:opacity-80 transition-opacity text-sm font-medium"
                  >
                    YouTube
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
