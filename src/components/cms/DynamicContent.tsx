import { useContent } from '@/hooks/useContent';

/**
 * Example Component: Using CMS Content
 * This shows how to fetch and display content from the admin-managed CMS
 * 
 * Usage:
 * 1. Admin creates content with key "homepage_hero_title" in Admin Panel
 * 2. This component fetches and displays it automatically
 * 3. When admin updates content, it's reflected on the page immediately
 */

export function DynamicHeroSection() {
  const { content: heroTitle, loading } = useContent('homepage_hero_title');
  const { content: heroSubtitle } = useContent('homepage_hero_subtitle');

  if (loading) {
    return <div className="h-64 bg-background-cream animate-pulse" />;
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background-cream to-background">
      <div className="max-w-7xl mx-auto px-4 text-center">
        <h1 className="font-serif text-4xl lg:text-5xl text-foreground mb-4">
          {heroTitle?.content || 'Welcome to Grazel'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {heroSubtitle?.content || 'Discover our exclusive collections'}
        </p>
      </div>
    </section>
  );
}

export function DynamicPageContent({ page }: { page: string }) {
  const { contents, loading } = useContent(undefined, page);

  if (loading) {
    return <div className="space-y-4">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {contents.map((item) => (
        <div key={item.id} className="space-y-2">
          <h3 className="font-serif text-xl text-foreground">{item.title}</h3>
          <p className="text-foreground/80">
            {item.type === 'json' ? JSON.stringify(JSON.parse(item.content), null, 2) : item.content}
          </p>
        </div>
      ))}
    </div>
  );
}

export function DynamicFooter() {
  const { content: copyright } = useContent('footer_copyright');
  const { content: contactEmail } = useContent('footer_contact_email');
  const { content: address } = useContent('footer_address');

  return (
    <footer className="bg-background border-t border-border py-8">
      <div className="max-w-7xl mx-auto px-4 text-center text-sm text-muted-foreground space-y-4">
        <p>{copyright?.content || '2024 Grazel Atelier. All rights reserved.'}</p>
        {contactEmail && <p>Email: {contactEmail.content}</p>}
        {address && <p>{address.content}</p>}
      </div>
    </footer>
  );
}

/**
 * How to use this in your pages:
 * 
 * 1. In HomePage:
 *    <DynamicHeroSection />
 *    <DynamicPageContent page="home" />
 * 
 * 2. In AboutPage:
 *    <DynamicPageContent page="about" />
 * 
 * 3. In Layout/Footer:
 *    <DynamicFooter />
 * 
 * Admin only needs to create content in the admin panel with the right key/page,
 * and it will automatically appear on the website!
 */
