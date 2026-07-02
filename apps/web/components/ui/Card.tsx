import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`rounded-2xl border border-ink-100 bg-white shadow-sm ${className}`} {...props} />;
}

export function CardHeader({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`border-b border-ink-100 px-5 py-4 ${className}`} {...props} />;
}

export function CardBody({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-5 py-4 ${className}`} {...props} />;
}
