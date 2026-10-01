'use client';

import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import styles from './GalleryTransition.module.css';

gsap.registerPlugin(useGSAP);

export function GalleryTransition() {
  const root = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(track.current, { xPercent: 0 }, {
        xPercent: -50,
        duration: 32,
        repeat: -1,
        ease: 'none',
      });
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <div ref={root} className={styles.transition} aria-hidden="true">
      <div ref={track} className={styles.track}>
        {[0, 1].map((copy) => (
          <div key={copy} className={styles.phrase}>
            <span className={styles.court}>Da quadra</span>
            <span className={styles.memory}>pra memória.</span>
            <span className={styles.league}>Tamanda League 3x3</span>
          </div>
        ))}
      </div>
    </div>
  );
}
