import { useId } from "react";

interface StolosLogoProps {
  label: string;
  className?: string;
}

/**
 * PLACEHOLDER (plan ASSUME-9): vector approximation of the 3D Stolos mark from Figma,
 * to be replaced by the exported asset in `public/brand/` during the fidelity pass.
 */
export const StolosLogo = ({ label, className }: StolosLogoProps) => {
  const gradientId = useId();

  return (
    <svg role="img" aria-label={label} viewBox="0 0 120 120" fill="none" className={className}>
      <defs>
        <linearGradient id={gradientId} x1="20" y1="10" x2="100" y2="110" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#B9B2E6" />
        </linearGradient>
      </defs>
      <path
        d="M78 14C54 10 24 26 20 56c-4 30 20 54 50 52 22-2 36-16 40-30-8 16-28 24-46 20C42 94 30 74 34 54 38 32 58 18 78 14Z"
        fill={`url(#${gradientId})`}
      />
      <path
        d="M70 30c-18 2-32 18-30 36 2 16 18 28 36 26-14-4-24-16-24-30 0-14 8-26 18-32Z"
        fill={`url(#${gradientId})`}
        opacity="0.75"
      />
      <circle cx="80" cy="16" r="7" fill={`url(#${gradientId})`} />
      <circle cx="104" cy="74" r="7" fill={`url(#${gradientId})`} />
    </svg>
  );
};
