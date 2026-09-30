'use client';

import { useEffect, useRef, type ReactNode } from 'react';

export function LoginMotion({ children }: { children: ReactNode }) {
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return;
    const compactScreen = window.matchMedia('(max-width: 639px)').matches;

    let active = true;
    const animations: Animation[] = [];
    const animate = (selector: string, frames: Keyframe[], options: KeyframeAnimationOptions) => {
      const element = root.querySelector<HTMLElement>(selector);
      if (!element) return null;
      const animation = element.animate(frames, { fill: 'backwards', ...options });
      animations.push(animation);
      return animation;
    };

    const ease = 'cubic-bezier(.22, 1, .36, 1)';

    animate('[data-login-background]', [
      { opacity: 0.65, transform: 'scale(1.035)' },
      { opacity: 1, transform: 'scale(1)' },
    ], { duration: compactScreen ? 1100 : 1800, easing: ease });

    animate('[data-login-aura]', [
      { opacity: 0, transform: 'scale(.75)' },
      { opacity: 1, transform: 'scale(1)' },
    ], { duration: compactScreen ? 800 : 1100, delay: 180, easing: ease });

    const playerEntrance = animate('[data-login-player]', [
      { opacity: 0, transform: 'translateY(65px) scale(.94)' },
      { opacity: 1, transform: 'translateY(0) scale(1)' },
    ], { duration: compactScreen ? 850 : 1150, delay: 120, easing: ease });

    animate('[data-login-card]', [
      { opacity: 0, transform: 'translateY(30px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ], { duration: compactScreen ? 650 : 850, delay: compactScreen ? 220 : 360, easing: ease });

    root.querySelectorAll<HTMLElement>('[data-login-step]').forEach((element, index) => {
      animations.push(element.animate([
        { opacity: 0, transform: 'translateY(12px)' },
        { opacity: 1, transform: 'translateY(0)' },
      ], { duration: compactScreen ? 500 : 650, delay: (compactScreen ? 330 + index * 55 : 520 + index * 90), easing: ease, fill: 'backwards' }));
    });

    animate('[data-login-line]', [
      { opacity: 0, transform: 'scaleX(0)' },
      { opacity: 1, transform: 'scaleX(1)' },
    ], { duration: 900, delay: compactScreen ? 300 : 620, easing: ease });

    let idle: Animation | null = null;
    void playerEntrance?.finished.then(() => {
      if (!active || compactScreen || reducedMotion.matches || !root.isConnected) return;
      const player = root.querySelector<HTMLElement>('[data-login-player]');
      idle = player?.animate([
        { transform: 'translateY(0)' },
        { transform: 'translateY(-8px)' },
        { transform: 'translateY(0)' },
      ], { duration: 6200, iterations: Infinity, easing: 'ease-in-out' }) ?? null;
      if (idle) {
        animations.push(idle);
        if (document.hidden) idle.pause();
      }
    }).catch(() => {});

    const onVisibilityChange = () => {
      if (document.hidden) idle?.pause();
      else idle?.play();
    };
    const onMotionChange = () => {
      if (reducedMotion.matches) animations.forEach((animation) => animation.cancel());
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    reducedMotion.addEventListener('change', onMotionChange);

    return () => {
      active = false;
      document.removeEventListener('visibilitychange', onVisibilityChange);
      reducedMotion.removeEventListener('change', onMotionChange);
      animations.forEach((animation) => animation.cancel());
    };
  }, []);

  return <main ref={rootRef} className="login-scene relative isolate flex min-h-dvh flex-col overflow-hidden bg-background">{children}</main>;
}
