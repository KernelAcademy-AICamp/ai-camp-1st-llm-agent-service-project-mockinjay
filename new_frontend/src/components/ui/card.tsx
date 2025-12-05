import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Card Component - Design System v2.0
 *
 * Card is a container component for grouping related content.
 * It supports multiple variants for different use cases:
 *
 * Variants:
 * - default: Standard card with subtle shadow
 * - elevated: More prominent shadow for hierarchy
 * - outlined: Border-only, minimal depth
 * - interactive: Hover effects for clickable cards
 * - glass: Glassmorphism effect
 */
const cardVariants = cva(
  // Base styles
  [
    "flex flex-col rounded-card overflow-hidden",
    "bg-white text-card-foreground",
    "transition-all duration-300 ease-smooth",
  ].join(" "),
  {
    variants: {
      variant: {
        // Default - Standard card
        default: "border border-border-light shadow-card",

        // Elevated - More prominent
        elevated: "border border-border-light shadow-medium",

        // Outlined - Border only
        outlined: "border-2 border-border-medium shadow-none",

        // Interactive - Clickable cards
        interactive: [
          "border border-border-light shadow-card cursor-pointer",
          "hover:shadow-card-hover hover:-translate-y-1 hover:border-primary/20",
          "active:translate-y-0 active:shadow-card",
        ].join(" "),

        // Glass - Glassmorphism
        glass: [
          "glass-card",
          "bg-white/80 backdrop-blur-md border border-white/30",
        ].join(" "),

        // Ghost - Minimal, no visible container
        ghost: "border-0 shadow-none bg-transparent",
      },
      padding: {
        none: "",
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
    },
    defaultVariants: {
      variant: "default",
      padding: "none",
    },
  }
);

type CardProps = React.ComponentProps<"div"> & VariantProps<typeof cardVariants>;

function Card({ className, variant, padding, ...props }: CardProps) {
  return (
    <div
      data-slot="card"
      className={cn(cardVariants({ variant, padding }), className)}
      {...props}
    />
  );
}

// Specialized Interactive Card
function InteractiveCard({
  className,
  ...props
}: Omit<CardProps, "variant">) {
  return (
    <Card
      variant="interactive"
      className={className}
      {...props}
    />
  );
}

// Card Header
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        [
          "@container/card-header",
          "grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5",
          "px-6 pt-6",
          "has-data-[slot=card-action]:grid-cols-[1fr_auto]",
          "[.border-b]:pb-6",
        ].join(" "),
        className
      )}
      {...props}
    />
  );
}

// Card Title
function CardTitle({ className, ...props }: React.ComponentProps<"h4">) {
  return (
    <h4
      data-slot="card-title"
      className={cn("text-lg font-semibold leading-tight text-foreground", className)}
      {...props}
    />
  );
}

// Card Description
function CardDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

// Card Action (for header actions like buttons, menus)
function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className
      )}
      {...props}
    />
  );
}

// Card Content
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 flex-1 [&:last-child]:pb-6", className)}
      {...props}
    />
  );
}

// Card Footer
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn(
        "flex items-center gap-3 px-6 pb-6 [.border-t]:pt-6",
        className
      )}
      {...props}
    />
  );
}

// Card Image (for media cards)
function CardImage({
  className,
  alt = "",
  ...props
}: React.ComponentProps<"img">) {
  return (
    <img
      data-slot="card-image"
      alt={alt}
      className={cn("w-full h-auto object-cover", className)}
      {...props}
    />
  );
}

export {
  Card,
  InteractiveCard,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
  CardImage,
  cardVariants,
};
