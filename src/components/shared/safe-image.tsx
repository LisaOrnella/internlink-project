'use client';
import { useState } from 'react';
import Image from 'next/image';
import { FALLBACK_IMAGES } from '@/lib/constants';

/** Remote image with a guaranteed fallback so a broken URL never breaks the layout. */
export function SafeImage({ src, alt, fallback = FALLBACK_IMAGES.office, className, priority, sizes }: {
  src?: string | null; alt: string; fallback?: string; className?: string; priority?: boolean; sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Image
      src={failed || !src ? fallback : src}
      alt={alt}
      fill
      sizes={sizes ?? '(max-width: 768px) 100vw, 50vw'}
      priority={priority}
      className={className}
      onError={() => setFailed(true)}
    />
  );
}
