import { useState } from 'react';
import { ChevronDown, Search, HelpCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

interface FAQ {
  id: string;
  category: string;
  question: string;
  answer: string;
}

const faqs: FAQ[] = [
  {
    id: '1',
    category: 'How to Order',
    question: 'How do I place an order on Grazel?',
    answer:
      'Simply browse our products, add items to your cart, proceed to checkout, fill in your shipping details, choose your payment method, and complete your purchase. You can track your order in real-time using your order number.',
  },
  {
    id: '2',
    category: 'How to Order',
    question: 'Can I modify my order after placing it?',
    answer:
      'Once an order is placed and payment is confirmed, we cannot modify it. However, if your order hasn\'t been shipped yet, please contact our support team immediately.',
  },
  {
    id: '3',
    category: 'How to Order',
    question: 'Do you offer gift wrapping or special packaging?',
    answer:
      'Yes! We offer multiple packaging options including gift packaging and eco-friendly packaging. You can select your preferred packaging during checkout.',
  },
  {
    id: '4',
    category: 'Shipping & Delivery',
    question: 'What are your shipping rates?',
    answer:
      'Shipping costs vary by state. You can see the exact shipping cost during checkout after entering your location. Free shipping is available on orders above ₹1500.',
  },
  {
    id: '5',
    category: 'Shipping & Delivery',
    question: 'How long does delivery take?',
    answer:
      'Delivery usually takes 3-7 business days depending on your location. Metro cities typically receive deliveries in 1-3 days. You can track your order for real-time updates.',
  },
  {
    id: '6',
    category: 'Shipping & Delivery',
    question: 'Do you ship internationally?',
    answer:
      'Currently, we only ship within India. We offer delivery to all states and union territories. International shipping may be available soon.',
  },
  {
    id: '7',
    category: 'Returns & Refunds',
    question: 'What is your return policy?',
    answer:
      'We offer a 7-day return policy for regular products. Customized or made-to-order products cannot be returned. To initiate a return, contact our support team within 7 days of delivery.',
  },
  {
    id: '8',
    category: 'Returns & Refunds',
    question: 'How do I return a product?',
    answer:
      'Contact our support team with your order number to initiate a return. We\'ll provide you with a prepaid return label. Once we receive and inspect the product, we\'ll process your refund within 5-7 business days.',
  },
  {
    id: '9',
    category: 'Returns & Refunds',
    question: 'What about refunds on discounted items?',
    answer:
      'Refunds are processed based on the amount you paid. If you applied a discount code or coupon, the refund will be for the discounted price.',
  },
  {
    id: '10',
    category: 'Payment Methods',
    question: 'What payment methods do you accept?',
    answer:
      'We accept UPI, Credit Cards, Debit Cards, Net Banking, Digital Wallets (Paytm, Amazon Pay, etc.), and Cash on Delivery (COD).',
  },
  {
    id: '11',
    category: 'Payment Methods',
    question: 'Is my payment information secure?',
    answer:
      'Yes, all transactions are encrypted with SSL security. We use Razorpay, a trusted payment gateway, to process payments securely.',
  },
  {
    id: '12',
    category: 'Payment Methods',
    question: 'Can I pay by check or bank transfer?',
    answer:
      'We currently don\'t accept checks or direct bank transfers. Please use one of our available payment methods.',
  },
  {
    id: '13',
    category: 'Account Management',
    question: 'How do I create an account?',
    answer:
      'Click on "Login" and select "Sign Up". You can register with your email or Google account. Once registered, you can save addresses and track orders.',
  },
  {
    id: '14',
    category: 'Account Management',
    question: 'How do I reset my password?',
    answer:
      'Click "Forgot Password" on the login page. Enter your email, and we\'ll send you a password reset link. Follow the instructions to create a new password.',
  },
  {
    id: '15',
    category: 'Account Management',
    question: 'Can I use multiple email addresses?',
    answer:
      'Each email address must be associated with only one account. If you wish to create a new account, use a different email address.',
  },
  {
    id: '16',
    category: 'Product Customization',
    question: 'What customization options are available?',
    answer:
      'We offer customization on select products. You can choose options during checkout. Customized products have a 48-72 hour processing time before shipping.',
  },
  {
    id: '17',
    category: 'Product Customization',
    question: 'Can I request custom designs or sizes?',
    answer:
      'We offer limited customization. For special requests, please contact our support team with details. We\'ll let you know if it\'s possible and provide pricing.',
  },
  {
    id: '18',
    category: 'Product Customization',
    question: 'Are customized products returnable?',
    answer:
      'No, customized or made-to-order products cannot be returned as they are made specifically for you.',
  },
  {
    id: '19',
    category: 'Size & Fit',
    question: 'How do I find my correct size?',
    answer:
      'Use our "Curate My Fit" feature to get personalized size recommendations based on your measurements. You can also check our detailed size guides for each product.',
  },
  {
    id: '20',
    category: 'Size & Fit',
    question: 'What if the item doesn\'t fit me?',
    answer:
      'We accept returns for items that don\'t fit. Please initiate a return within 7 days of delivery. Make sure the item is unused and in original condition.',
  },
];

export function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedFAQ, setExpandedFAQ] = useState<string | null>(null);

  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));

  const filteredFAQs = faqs.filter((faq) => {
    const query = searchQuery.toLowerCase();
    return (
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      faq.category.toLowerCase().includes(query)
    );
  });

  const groupedFAQs = categories.reduce((acc: Record<string, FAQ[]>, category) => {
    acc[category] = filteredFAQs.filter((faq) => faq.category === category);
    return acc;
  }, {});

  return (
    <Layout>
      <div className="min-h-[calc(100vh-60px)] bg-background-cream py-16">
        <div className="container max-w-4xl">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="flex justify-center mb-4">
              <HelpCircle className="h-12 w-12 text-primary" />
            </div>
            <h1 className="font-serif text-3xl lg:text-4xl text-foreground mb-4">Help Center</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to frequently asked questions about orders, shipping, returns, and more.
            </p>
          </div>

          {/* Search */}
          <div className="mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for answers..."
                className="w-full pl-12 pr-4 py-3 border border-border bg-card text-foreground focus:outline-none focus:border-primary text-sm rounded-none"
              />
            </div>
          </div>

          {/* FAQs */}
          <div className="space-y-8">
            {Object.entries(groupedFAQs).map(([category, categoryFAQs]) => {
              if (categoryFAQs.length === 0) return null;

              return (
                <div key={category}>
                  <h2 className="font-serif text-2xl text-foreground mb-6 pb-3 border-b border-border">
                    {category}
                  </h2>
                  <div className="space-y-3">
                    {categoryFAQs.map((faq) => (
                      <div
                        key={faq.id}
                        className="bg-card border border-border rounded-sm overflow-hidden hover:shadow-md transition-shadow"
                      >
                        <button
                          onClick={() => setExpandedFAQ(expandedFAQ === faq.id ? null : faq.id)}
                          className="w-full px-6 py-4 flex items-center justify-between hover:bg-background-cream/40 transition-colors"
                        >
                          <h3 className="text-sm font-medium text-foreground text-left">{faq.question}</h3>
                          <ChevronDown
                            className={`h-5 w-5 text-muted-foreground flex-shrink-0 transition-transform ${
                              expandedFAQ === faq.id ? 'rotate-180' : ''
                            }`}
                          />
                        </button>
                        {expandedFAQ === faq.id && (
                          <div className="px-6 py-4 bg-background-cream/40 border-t border-border">
                            <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredFAQs.length === 0 && (
              <div className="text-center py-12">
                <HelpCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-40" />
                <p className="text-muted-foreground">No results found for your search.</p>
              </div>
            )}
          </div>

          {/* Contact Support */}
          <div className="mt-16 bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-8 rounded-sm text-center">
            <h3 className="font-serif text-xl text-foreground mb-2">Didn't find what you're looking for?</h3>
            <p className="text-muted-foreground mb-6">
              Our support team is here to help. Get in touch with us for any questions or concerns.
            </p>
            <a
              href="/contact"
              className="inline-block px-8 py-2 bg-primary text-primary-foreground font-medium text-xs uppercase tracking-[0.2em] hover:opacity-90 transition-opacity"
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </Layout>
  );
}
