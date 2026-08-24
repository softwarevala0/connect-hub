import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "btn3d btn3d-hover relative inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-xl text-[13.5px] font-bold cursor-pointer transition-[color,background-color,border-color,box-shadow,transform] duration-150 active:scale-[0.98] focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed aria-busy:cursor-progress [&_svg]:pointer-events-none [&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "[--tone:oklch(0.63_0.205_260)]",
        destructive: "[--tone:oklch(0.66_0.20_20)]",
        outline: "[--tone:oklch(0.75_0.14_205)]",
        secondary: "[--tone:oklch(0.66_0.20_300)]",
        ghost: "[--tone:oklch(0.70_0.16_158)]",
        link: "!bg-none !border-0 !shadow-none text-[oklch(0.85_0.13_240)] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-3.5 py-1.5",
        sm: "h-8 rounded-lg px-2.5 text-[13px]",
        lg: "h-10 rounded-xl px-5 text-[14.5px]",
        icon: "h-9 w-9 min-h-9 min-w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  /** Shows a spinner, disables interaction and marks the control busy. */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, disabled, children, type, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        // Buttons default to type="button" so they never submit a surrounding form by accident.
        type={asChild ? undefined : (type ?? "button")}
        disabled={asChild ? undefined : disabled || loading}
        aria-busy={loading || undefined}
        aria-disabled={disabled || loading || undefined}
        {...props}
      >
        {asChild ? (
          children
        ) : (
          <>
            {loading && <Loader2 className="animate-spin" aria-hidden />}
            {children}
          </>
        )}
      </Comp>
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
