interface XevraliqIconProps {
  size?: number;
}

export function XevraliqIcon({ size = 32 }: XevraliqIconProps) {
  const id = `xgrad-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00C8FF" />
          <stop offset="50%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#8B5CF6" />
        </linearGradient>
      </defs>
      <path
        d="M5,4 L14.5,15 L5,26 L8,26 L16,17.5 L24,26 L27,26 L18,15 L27,4 L24,4 L16,12.5 L8,4 Z"
        fill={`url(#${id})`}
      />
    </svg>
  );
}
