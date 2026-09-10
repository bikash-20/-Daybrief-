"use client";

import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: ReactNode;
  children: ReactNode;
};

/**
 * One row of the Settings sheet. Header + body. Stacks vertically with
 * consistent spacing.
 */
export function SettingsSection({ title, description, children }: Props) {
  return (
    <section className="space-y-2">
      <div className="text-[12px] font-semibold text-ink">{title}</div>
      {description && (
        <div className="text-[11px] text-ink-soft">{description}</div>
      )}
      {children}
    </section>
  );
}

type FieldRowProps = {
  input: ReactNode;
  button: ReactNode;
};

/**
 * Input + save button pair. Used by Name, Calendar URL, and City rows.
 * On mobile the button auto-shrinks to fit; input flexes to fill.
 */
export function FieldRow({ input, button }: FieldRowProps) {
  return <div className="flex gap-2">{input}{button}</div>;
}
