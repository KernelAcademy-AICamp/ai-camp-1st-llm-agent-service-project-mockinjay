import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "./utils";

/**
 * Textarea Component - Design System v2.0
 *
 * Multi-line text input component with consistent styling.
 */
const textareaVariants = cva(
  // Base styles
  [
    "flex w-full rounded-input px-4 py-3",
    "border-2 bg-white text-sm transition-all duration-200 ease-smooth",
    "placeholder:text-text-tertiary",
    "resize-y min-h-20",
    "selection:bg-primary selection:text-white",
    // Focus state
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20",
    "focus-visible:border-primary focus-visible:shadow-sm",
    // Disabled state
    "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
    // Error state
    "aria-invalid:border-error aria-invalid:focus:border-error aria-invalid:focus:ring-error/20",
    // Dark mode
    "dark:bg-input/30 dark:border-border",
  ].join(" "),
  {
    variants: {
      variant: {
        default: "border-border-medium hover:border-border-strong",
        filled: "border-0 bg-gray-100 hover:bg-gray-200/70 focus:bg-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

type TextareaProps = React.ComponentProps<"textarea"> &
  VariantProps<typeof textareaVariants> & {
    /** Error state */
    error?: boolean;
    /** Error message */
    errorMessage?: string;
    /** Character count */
    showCharCount?: boolean;
    /** Max characters (for char count display) */
    maxLength?: number;
  };

function Textarea({
  className,
  variant,
  error,
  errorMessage,
  showCharCount,
  maxLength,
  value,
  defaultValue,
  ...props
}: TextareaProps) {
  const [charCount, setCharCount] = React.useState(
    () => String(value || defaultValue || "").length
  );

  // Update char count when value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setCharCount(String(value).length);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    props.onChange?.(e);
  };

  return (
    <div className="w-full">
      <textarea
        data-slot="textarea"
        aria-invalid={error || undefined}
        className={cn(textareaVariants({ variant }), className)}
        value={value}
        defaultValue={defaultValue}
        maxLength={maxLength}
        onChange={handleChange}
        {...props}
      />
      <div className="flex justify-between items-center mt-1.5">
        {error && errorMessage && (
          <p className="text-sm text-error">{errorMessage}</p>
        )}
        {showCharCount && maxLength && (
          <p
            className={cn(
              "text-xs text-text-tertiary ml-auto",
              charCount >= maxLength && "text-error"
            )}
          >
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
}

export { Textarea, textareaVariants };
