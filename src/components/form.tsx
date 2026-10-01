"use client";

import { Children, cloneElement, isValidElement, useState } from "react";
import { cn } from "cn";

export function Field({
  label,
  required,
  error,
  hint,
  htmlFor,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-small font-medium">
        {label}
        {required && <span className="ml-0.5 text-destructive-light">*</span>}
      </label>
      <div className="mt-1">
        {Children.map(children, (child) =>
          isValidElement(child)
            ? cloneElement(child as React.ReactElement<{ "aria-invalid"?: boolean; "aria-describedby"?: string; className?: string }>, {
                "aria-invalid": !!error || undefined,
                "aria-describedby": error ? `${htmlFor}-error` : undefined,
                className: cn(child.props.className, error && "border-destructive-light/50 focus-visible:ring-destructive-light/30"),
              })
            : child
        )}
      </div>
      {error ? (
        <p id={`${htmlFor}-error`} className="mt-1 text-caption text-destructive-light" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-caption text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export type FormErrors<T> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, any>>({
  initial,
  validate,
  onSubmit,
}: {
  initial: T;
  validate: (values: T) => FormErrors<T>;
  onSubmit: (values: T) => void;
}) {
  const [values, setValues] = useState<T>(initial);
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof T>(key: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => (prev[key] ? { ...prev, [key]: undefined } : prev));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitted(true);
    if (Object.keys(nextErrors).length === 0) onSubmit(values);
  };

  return { values, errors, set, setErrors, handleSubmit, submitted };
}