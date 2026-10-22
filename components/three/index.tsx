'use client';

import dynamic from 'next/dynamic';

export const HeroScene = dynamic(() => import('./HeroScene'), { ssr: false });
export const Backdrop = dynamic(() => import('./Backdrop'), { ssr: false });
export const BodyPicker = dynamic(() => import('./BodyPicker'), { ssr: false });
export const RouletteWheel = dynamic(() => import('./RouletteWheel'), { ssr: false });
export const WeekBoard = dynamic(() => import('./WeekBoard'), { ssr: false });
