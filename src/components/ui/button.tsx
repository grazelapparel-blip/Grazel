import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary-hover rounded-sm",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-sm",
        outline: "border border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background rounded-sm",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-foreground underline-offset-4 hover:underline",
        // Grazel Custom Variants
        hero: "bg-primary text-primary-foreground px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-primary-hover rounded-none",
        "hero-outline": "border border-primary-foreground bg-transparent text-primary-foreground px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-primary-foreground/10 rounded-none",
        "hero-dark": "bg-foreground text-background px-8 py-4 text-sm tracking-widest uppercase font-medium hover:bg-foreground/90 rounded-none",
        nav: "text-foreground text-sm font-normal tracking-wide hover:text-primary transition-colors bg-transparent h-auto p-0",
        utility: "text-muted-foreground text-xs font-normal hover:text-foreground transition-colors bg-transparent h-auto p-0",
        icon: "text-foreground hover:text-primary transition-colors bg-transparent",
        chip: "px-4 py-2 text-xs border border-border rounded-sm hover:border-primary hover:text-primary bg-transparent h-auto",
        "chip-active": "px-4 py-2 text-xs border border-primary text-primary bg-primary/5 rounded-sm h-auto",
        add: "bg-primary text-primary-foreground w-full py-4 text-sm tracking-widest uppercase font-medium hover:bg-primary-hover rounded-none",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        auto: "h-auto",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
