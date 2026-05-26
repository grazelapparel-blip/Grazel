export interface NavItem {
  label: string;
  href: string;
}

export interface MegaMenuColumn {
  title: string;
  items: NavItem[];
}

export interface MegaMenuData {
  columns: MegaMenuColumn[];
  featured?: {
    title: string;
    image: string;
    href: string;
  };
}

export const mainNavItems: NavItem[] = [
  { label: 'Men', href: '/men' },
  { label: 'Women', href: '/women' },
  { label: 'Essentials', href: '/essentials' },
  { label: 'New In', href: '/new' },
  { label: 'Collections', href: '/collections' },
  { label: 'E-Boutique', href: '/e-boutique' },
];

export const utilityNavItems: NavItem[] = [
  { label: 'Help', href: '/help' },
  { label: 'Orders & Returns', href: '/orders' },
];

export const megaMenuData: Record<string, MegaMenuData> = {
  men: {
    columns: [
      {
        title: 'Categories',
        items: [
          { label: 'View All', href: '/men' },
          { label: 'New Arrivals', href: '/men?filter=new' },
          { label: 'Bestsellers', href: '/men?filter=bestsellers' },
        ],
      },
      {
        title: 'Clothing',
        items: [
          { label: 'Blazers & Jackets', href: '/men/blazers' },
          { label: 'Shirts', href: '/men/shirts' },
          { label: 'Knitwear', href: '/men/knitwear' },
          { label: 'Trousers', href: '/men/trousers' },
          { label: 'Outerwear', href: '/men/outerwear' },
          { label: 'T-Shirts & Polos', href: '/men/tshirts' },
        ],
      },
      {
        title: 'Fabric & Fit',
        items: [
          { label: 'Wool', href: '/men?fabric=wool' },
          { label: 'Cashmere', href: '/men?fabric=cashmere' },
          { label: 'Cotton', href: '/men?fabric=cotton' },
          { label: 'Linen', href: '/men?fabric=linen' },
          { label: 'Slim Fit', href: '/men?fit=slim' },
          { label: 'Regular Fit', href: '/men?fit=regular' },
        ],
      },
      {
        title: 'Occasion',
        items: [
          { label: 'Business', href: '/men/business' },
          { label: 'Casual', href: '/men/casual' },
          { label: 'Evening', href: '/men/evening' },
          { label: 'Weekend', href: '/men/weekend' },
        ],
      },
    ],
    featured: {
      title: 'The Wool Edit',
      image: '/placeholder.svg',
      href: '/collections/wool',
    },
  },
  women: {
    columns: [
      {
        title: 'Categories',
        items: [
          { label: 'View All', href: '/women' },
          { label: 'New Arrivals', href: '/women?filter=new' },
          { label: 'Bestsellers', href: '/women?filter=bestsellers' },
        ],
      },
      {
        title: 'Clothing',
        items: [
          { label: 'Dresses', href: '/women/dresses' },
          { label: 'Blouses & Shirts', href: '/women/shirts' },
          { label: 'Knitwear', href: '/women/knitwear' },
          { label: 'Trousers', href: '/women/trousers' },
          { label: 'Skirts', href: '/women/skirts' },
          { label: 'Outerwear', href: '/women/outerwear' },
        ],
      },
      {
        title: 'Fabric & Fit',
        items: [
          { label: 'Silk', href: '/women?fabric=silk' },
          { label: 'Cashmere', href: '/women?fabric=cashmere' },
          { label: 'Cotton', href: '/women?fabric=cotton' },
          { label: 'Linen', href: '/women?fabric=linen' },
          { label: 'Wide Fit', href: '/women?fit=wide' },
          { label: 'Relaxed Fit', href: '/women?fit=relaxed' },
        ],
      },
      {
        title: 'Occasion',
        items: [
          { label: 'Workwear', href: '/women/workwear' },
          { label: 'Casual', href: '/women/casual' },
          { label: 'Evening', href: '/women/evening' },
          { label: 'Weekend', href: '/women/weekend' },
        ],
      },
    ],
    featured: {
      title: 'The Silk Collection',
      image: '/placeholder.svg',
      href: '/collections/silk',
    },
  },
  essentials: {
    columns: [
      {
        title: 'Categories',
        items: [
          { label: 'View All', href: '/essentials' },
          { label: 'New Arrivals', href: '/essentials?filter=new' },
          { label: 'Gifts', href: '/essentials/gifts' },
        ],
      },
      {
        title: 'Accessories',
        items: [
          { label: 'Belts', href: '/essentials/belts' },
          { label: 'Scarves', href: '/essentials/scarves' },
          { label: 'Gloves', href: '/essentials/gloves' },
          { label: 'Wallets', href: '/essentials/wallets' },
        ],
      },
      {
        title: 'Bags',
        items: [
          { label: 'Totes', href: '/essentials/totes' },
          { label: 'Crossbody', href: '/essentials/crossbody' },
          { label: 'Briefcases', href: '/essentials/briefcases' },
          { label: 'Travel', href: '/essentials/travel' },
        ],
      },
    ],
  },
};
