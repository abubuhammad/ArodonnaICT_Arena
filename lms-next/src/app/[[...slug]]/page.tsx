"use client";

import dynamic from 'next/dynamic';

const LegacyClient = dynamic(() => import('../legacy-client'), { ssr: false });

export default function LegacyPage() {
  return <LegacyClient />;
}
