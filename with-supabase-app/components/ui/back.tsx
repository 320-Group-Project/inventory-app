"use client"
import Link from "next/link"

interface BackProps {
  href?: string;
  onClick?: () => void;
}

const baseClass =
  "inline-flex items-center justify-center p-2 rounded-md text-base-content transition-all hover:text-primary hover:-translate-x-0.5 cursor-pointer";

const Back = ({ href, onClick }: BackProps) => {
  const Icon = (
    <svg width="28" height="28" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.88 108.06" aria-hidden>
      <title>Back</title>
      <path
        fill="currentColor"
        d="M63.94,24.28a14.28,14.28,0,0,0-20.36-20L4.1,44.42a14.27,14.27,0,0,0,0,20l38.69,39.35a14.27,14.27,0,0,0,20.35-20L48.06,68.41l60.66-.29a14.27,14.27,0,1,0-.23-28.54l-59.85.28,15.3-15.58Z"
      />
    </svg>
  );

  if (href) return <Link href={href} className={baseClass} aria-label="Back">{Icon}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={baseClass} aria-label="Back">{Icon}</button>;
  return <span className={baseClass}>{Icon}</span>;
};

export default Back
