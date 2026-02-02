import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors",
  {
    variants: {
      variant: {
        default: "bg-slate-800 text-slate-300",
        primary: "bg-primary-900/50 text-primary-300",
        secondary: "bg-slate-800 text-slate-400",
        success: "bg-emerald-900/50 text-emerald-400",
        warning: "bg-amber-900/50 text-amber-400",
        danger: "bg-red-900/50 text-red-400",
        outline: "border border-slate-700 text-slate-400 bg-slate-900",
        purple: "bg-purple-900/50 text-purple-400",
        blue: "bg-blue-900/50 text-blue-400",
        green: "bg-green-900/50 text-green-400",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
