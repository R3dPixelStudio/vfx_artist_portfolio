'use client';
import { useEffect, useRef } from 'react';
import { motionEnabled, useStudio } from '@/lib/store';
import type { AnimationItem } from 'lottie-web';

const animationData = {
  v: '5.12.2', fr: 30, ip: 0, op: 60, w: 24, h: 24, nm: 'Live signal', ddd: 0, assets: [],
  layers: [{ ddd: 0, ind: 1, ty: 4, nm: 'Signal', sr: 1,
    ks: { o: { a: 1, k: [{ t: 0, s: [35], e: [100], i: { x: [0.7], y: [1] }, o: { x: [0.3], y: [0] } }, { t: 30, s: [100], e: [35], i: { x: [0.7], y: [1] }, o: { x: [0.3], y: [0] } }, { t: 60, s: [35] }] },
      r: { a: 0, k: 0 }, p: { a: 0, k: [12, 12, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } },
    shapes: [{ ty: 'el', p: { a: 0, k: [0, 0] }, s: { a: 0, k: [7, 7] }, nm: 'Dot' },
      { ty: 'fl', c: { a: 0, k: [0.2, 0.2, 0.19, 1] }, o: { a: 0, k: 100 }, r: 1 }],
    ip: 0, op: 60, st: 0, bm: 0 }],
};

export function LiveMark() {
  const element = useRef<HTMLSpanElement>(null);
  const paused = useStudio((s) => !motionEnabled(s) || s.overlayOpen);
  useEffect(() => {
    let disposed = false;
    let animation: AnimationItem | undefined;
    let visible = true;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => {
      if (document.hidden || !visible || paused) animation?.pause();
      else animation?.play();
    };
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    if (element.current) observer.observe(element.current);
    import('lottie-web').then(({ default: lottie }) => {
      if (disposed || !element.current) return;
      animation = lottie.loadAnimation({ container: element.current, renderer: 'svg', loop: true, autoplay: false, animationData });
      sync();
    }).catch(() => { /* The CSS dot remains visible if the optional animation cannot load. */ });
    reduced.addEventListener('change', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      disposed = true; animation?.destroy(); observer.disconnect();
      reduced.removeEventListener('change', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [paused]);
  return <span className="live-mark" ref={element} aria-hidden="true" />;
}
