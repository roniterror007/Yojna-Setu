'use client';

// eslint-disable-next-line no-unused-vars
export default function AshokaEmblem({ size = 32, className = '', color }) {
  return (
    <img
      src="/emblem.png"
      alt="Indian National Emblem"
      width={size}
      height={size}
      className={className}
      style={{ objectFit: 'contain', display: 'block' }}
    />
  );
}
