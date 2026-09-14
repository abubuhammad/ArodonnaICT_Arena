// src/constants/images.ts

export const ASSETS = {
  course: {
    default: '/images/course-default.jpg',
    placeholder: '/images/course-placeholder.jpg'
  },
  logo: '/images/arodonna-logo.png',
  hero: '/images/hero-banner.jpg',
  avatar: '/images/default-avatar.jpg'
} as const;

export type AssetType = keyof typeof ASSETS;

// Base URL for backend
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';