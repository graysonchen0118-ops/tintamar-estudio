'use client';

export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  if (src.startsWith('data:') || src.startsWith('/')) return src;
  const sep = src.includes('?') ? '&' : '?';
  return `${src}${sep}w=${width}&q=${quality || 72}&auto=format&fit=crop`;
}
