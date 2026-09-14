import React from 'react';
import { ASSETS, AssetType } from '../../constants/images';

interface ImageProps {
  src?: string;
  alt: string;
  type: AssetType;
  className?: string;
}

export const Image: React.FC<ImageProps> = ({ src, alt, type, className }) => {
  const defaultSrc = typeof ASSETS[type] === 'string' 
    ? ASSETS[type] as string
    : (ASSETS[type] as Record<string, string>).default;

  return (
    <img
      src={src || defaultSrc}
      alt={alt}
      className={className}
      loading="lazy"
      onError={(e) => {
        const target = e.target as HTMLImageElement;
        target.src = defaultSrc;
        target.onerror = null;
      }}
    />
  );
};