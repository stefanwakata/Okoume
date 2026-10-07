import Link from "next/link";
import type { ReactNode } from "react";

// The text-roll button from the design (label duplicated for the hover roll; the copy is hidden from screen readers).
export function Btn({ href, children, variant, size, type = "button", disabled, name, value, form }:
  { href?: string; children: ReactNode; variant?: "line" | "ghost"; size?: "sm"; type?: "button" | "submit"; disabled?: boolean; name?: string; value?: string; form?: string }) {
  const cls = ["btn", variant, size].filter(Boolean).join(" ");
  const inner = (<><span className="r">{children}</span><span className="r" aria-hidden="true">{children}</span></>);
  if (href) return <Link className={cls} href={href}>{inner}</Link>;
  return <button className={cls} type={type} disabled={disabled} name={name} value={value} form={form}>{inner}</button>;
}
