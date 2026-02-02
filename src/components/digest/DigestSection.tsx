"use client";

import { ReactNode } from "react";

interface DigestSectionProps {
  title: string;
  children: ReactNode;
  icon?: ReactNode;
}

export function DigestSection({ title, children, icon }: DigestSectionProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex items-center gap-2">
        {icon}
        {title}
      </h4>
      <div className="border-t border-slate-700 pt-3">{children}</div>
    </div>
  );
}
