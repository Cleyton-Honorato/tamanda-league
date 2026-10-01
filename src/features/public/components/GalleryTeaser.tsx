'use client';

import { useRef } from 'react';
import { Camera, Images } from 'lucide-react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import styles from './GalleryTeaser.module.css';

gsap.registerPlugin(ScrollTrigger, useGSAP);

export function GalleryTeaser({ page = false }: { page?: boolean }) {
  const root = useRef<HTMLElement>(null);
  const Heading = page ? 'h1' : 'h2';

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const idle = gsap.timeline({ paused: true, repeat: -1, yoyo: true, defaults: { duration: 3.5, ease: 'sine.inOut' } })
        .to('[data-ball]', { y: -15, rotation: 5 }, 0)
        .to('[data-back-card]', { y: -8, rotationZ: -3 }, 0)
        .to('[data-front-card]', { y: 8, rotationZ: 2 }, 0);
      ScrollTrigger.create({ trigger: root.current, start: 'top bottom', end: 'bottom top', onToggle: self => self.isActive ? idle.play() : idle.pause() });
      gsap.fromTo('[data-scene]', { rotationY: -12, rotationX: 8, y: 28 }, {
        rotationY: 8, rotationX: -4, y: -25, ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1 },
      });
      gsap.fromTo('[data-ribbon]', { y: -24 }, { y: 24, ease: 'none', scrollTrigger: { trigger: root.current, start: 'top bottom', end: 'bottom top', scrub: 1.2 } });
    });
    return () => media.revert();
  }, { scope: root });

  return (
    <section ref={root} aria-label="Galeria" className={styles.section}>
      <div aria-hidden="true" data-ribbon className={styles.backdrop} />
      <div className={styles.layout}>
        <div className={styles.copy}>
          <Heading className={styles.eyebrow}><span /> Galeria do campeonato</Heading>
          <p className={styles.title}>O jogo passa.<br />A história <span>fica.</span></p>
          <p className={styles.description}>Da primeira bola ao último ponto. Um acervo de lances, encontros e conquistas da Tamanda League.</p>
          <div className={styles.status}><Camera size={18} aria-hidden="true" /><div><strong>Nosso acervo começa aqui</strong><span>Fotos e vídeos disponíveis após as rodadas.</span></div></div>
        </div>
        <div className={styles.perspective} aria-hidden="true">
          <div data-scene className={styles.scene}>
            <div data-back-card className={`${styles.card} ${styles.backCard}`}><span>COMUNIDADE</span><div className={styles.chevrons}>❯❯❯</div></div>
            <div className={`${styles.card} ${styles.mainCard}`}>
              <div className={styles.cardHeader}><span>TAMANDA LEAGUE</span><Images size={18} /></div>
              <svg className={styles.court} viewBox="0 0 360 400" fill="none"><path d="M30 380V25h300v355H30Zm0-180h300M125 25v110h110V25" /><circle cx="180" cy="200" r="52" /><path d="M60 25v25a120 120 0 0 0 240 0V25M160 52h40m-20 0v14" /><circle cx="180" cy="76" r="10" /></svg>
              <span className={styles.number}>3<span>×</span>3</span>
              <div data-ball className={styles.ball}>
                <svg viewBox="0 0 240 240"><circle cx="120" cy="120" r="112" fill="var(--orange-dark)" /><path d="M120 8a112 112 0 0 1 101 65c4 80-59 149-139 149A112 112 0 0 1 120 8Z" fill="var(--orange-muted)" /><path d="M120 8c39 0 73 20 93 50-5 69-62 119-130 119-21 0-40-4-59-13A112 112 0 0 1 120 8Z" fill="var(--orange)" /><g fill="none" stroke="var(--background)" strokeWidth="6"><circle cx="120" cy="120" r="112" /><path d="M25 61c58 33 118 70 190 115M65 218c28-71 65-139 112-194M16 152C71 85 123 65 214 61M72 19c-3 89 53 160 134 173" /></g></svg>
              </div>
              <div className={styles.cardFooter}><span>ARQUIVO DA QUADRA</span><span>FOTOS / VÍDEOS</span></div>
            </div>
            <div data-front-card className={`${styles.card} ${styles.frontCard}`}><span>FEITO NO BAIRRO.</span><strong>Guardado<br />na memória.</strong><div className={styles.frameMarks}>⌜ <Camera size={25} /> ⌟</div></div>
          </div>
        </div>
      </div>
    </section>
  );
}
