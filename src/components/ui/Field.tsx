import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

const CONTROL = cn(
  'h-11 w-full rounded-[var(--radius-md)] border border-border bg-elevated px-3',
  'text-foreground placeholder:text-muted-foreground/60',
  'focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary',
  'disabled:opacity-50',
);

export function Label({
  htmlFor,
  children,
}: {
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-1.5 block font-display text-sm uppercase tracking-widest text-muted-foreground"
    >
      {children}
    </label>
  );
}

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-accent">{children}</p>;
}

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className, id, ...props }: InputProps) {
  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <input
        id={id}
        className={cn(CONTROL, error && 'border-accent', className)}
        {...props}
      />
      <FieldError>{error}</FieldError>
    </div>
  );
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

export function Select({
  label,
  error,
  className,
  id,
  children,
  ...props
}: SelectProps) {
  return (
    <div>
      {label && <Label htmlFor={id}>{label}</Label>}
      <select
        id={id}
        className={cn(CONTROL, 'appearance-none pr-8', error && 'border-accent', className)}
        {...props}
      >
        {children}
      </select>
      <FieldError>{error}</FieldError>
    </div>
  );
}
