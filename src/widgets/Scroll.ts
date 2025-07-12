import { gsap } from 'gsap';
import textAnimation from '@/animations/textAnimation';

// interface Refs {
//   view: HTMLDivElement;
//   text: HTMLElement;
//   gallery: HTMLElement;
// }

interface AnimationItem {
  el: HTMLImageElement | Element;
  start: number;
  y: number;
  height: number;
  ease: string | null;
  delay: number | null;
  timing: number | null;
  count: string | null;
  measure: string | null;
  type?: string;
  origin?: string;
  children?: string;
  done: boolean;
}

interface SplittingItem {
  el: HTMLImageElement | Element;
  start: number;
  y: number;
  height: number;
  done: boolean;
  stagger: number | null;
  result: Splitting.Result;
}

interface ParallaxItem {
  el: HTMLImageElement | Element;
  start: number;
  y: number;
  height: number;
  horizontal: boolean;
  type: string | null;
  shift: number | string | null;
  done: boolean;
}

interface Cache {
  animations?: AnimationItem[];
  parallaxes?: ParallaxItem[];
  splittings?: SplittingItem[];
}

// interface Dataset {
//   animation: string;
//   ease?: string;
//   delay?: string;
//   timing?: string;
//   count?: string;
//   measure?: string;
//   origin?: string;
// }

export default class Scroller {
  view: HTMLElement;

  cache: Cache;

  storePosition: number;

  splitAnim:
    | null
    | readonly [Splitting.Result[], (targetIndex?: number, stagger?: number) => void] = null;

  isScrollAnimating: boolean;

  ignoreCache?: boolean;

  constructor(view: HTMLElement) {
    this.view = view;
    this.cache = {};
    this.storePosition = 0;
    this.isScrollAnimating = false;
    // this.onScrollTextBound = this.onScrollText.bind(this);
  }

  updateView = (newView: HTMLElement) => {
    this.view = newView;
    this.splitAnim = textAnimation();
  };

  storeCache() {
    const container = this.view || global.document;
    const animations: AnimationItem[] = [];
    const parallaxes: ParallaxItem[] = [];
    const splittings: SplittingItem[] = [];
    const animationElements = container.querySelectorAll<HTMLElement>('[data-animation]');
    const parallaxElements = container.querySelectorAll<HTMLElement>('[data-parallax]');
    const splittingElements = this.splitAnim ? this.splitAnim[0] : [];

    // const bodyRect = document.body.getBoundingClientRect();

    for (let index = 0; index < animationElements.length; index++) {
      const element = animationElements[index];
      const { dataset = {} } = element;

      animations.push({
        el: element,
        start: 0.1,
        y: element.getBoundingClientRect().top + window.scrollY,
        height: element.clientHeight,
        // done: element.classList.contains('is-passed'),
        done: element.classList.contains('is-passed'),
        ease: dataset.ease || null,
        delay: dataset.delay ? Number(dataset.delay) : null,
        timing: dataset.timing ? Number(dataset.timing) : null,
        count: dataset.count || null,
        measure: dataset.measure || '',
        type: dataset.animation,
        origin: dataset.origin,
      });
    }

    for (let index = 0; index < splittingElements.length; index++) {
      const element = splittingElements[index];
      const domElement = element.el as HTMLElement;
      const { dataset = {} } = domElement;

      splittings.push({
        el: domElement,
        start: 0.1,
        y: domElement.getBoundingClientRect().top + window.scrollY,
        height: domElement.clientHeight,
        done: domElement.classList.contains('is-passed'),
        result: element,
        stagger: dataset.stagger ? Number(dataset.stagger) : null,
      });
    }

    for (let index = 0; index < parallaxElements.length; index++) {
      const element = parallaxElements[index];
      const { dataset = {} } = element;
      let { parallax } = element.dataset as { parallax: string | number };
      const { horizontal, start } = dataset;
      const parallaxNumber = Number(parallax);
      const offset = element.getBoundingClientRect();

      parallax = isNaN(parallaxNumber) ? parallax : parallaxNumber;

      parallaxes.push({
        el: element,
        start: start ? Number(start) : 0,
        y: offset.top + window.scrollY - element.offsetHeight,
        height: element.offsetHeight,
        horizontal: !!horizontal,
        // height: element.clientHeight,
        type: typeof parallax === 'string' ? parallax : null,
        shift: typeof parallax === 'number' ? parallax : null,
        done: false,
      });
    }

    this.cache.animations = animations;
    this.cache.parallaxes = parallaxes;
    this.cache.splittings = splittings;
  }

  onScroll = () => {
    this.onScrollAnim();
    this.onScrollParallax();
  };

  onScrollAnim = async () => {
    const h = window.innerHeight;
    const doc = document.documentElement;
    const st = (window.scrollY || doc.scrollTop) - (doc.clientTop || 0);

    if (this.cache.animations && this.cache.animations.length > 0) {
      const { animations } = this.cache;

      for (let i = 0; i < animations.length; i += 1) {
        const item = animations[i];
        const itemY = this.ignoreCache
          ? item.el.getBoundingClientRect().top + window.scrollY
          : item.y;
        const yBottom = st + (1 - item.start) * h;
        const itemHeight = this.ignoreCache ? item.el.clientHeight : item.height;

        if (!item.done && itemY <= yBottom && itemY + itemHeight >= st) {
          item.done = true;
          this.animation(item);
        }
      }
    }

    if (this.cache.splittings && this.cache.splittings.length > 0 && this.splitAnim) {
      const { splittings } = this.cache;
      const [, anim] = this.splitAnim;
      for (let i = 0; i < splittings.length; i += 1) {
        const item = splittings[i];
        const itemY = this.ignoreCache
          ? item.el.getBoundingClientRect().top + window.scrollY
          : item.y;
        const yBottom = st + (1 - item.start) * h;
        const itemHeight = this.ignoreCache ? item.el.clientHeight : item.height;

        if (!item.done && itemY <= yBottom && itemY + itemHeight >= st) {
          anim(i, item.stagger || 0.008);
          item.el.classList.add('is-passed');
          item.done = true;
        }
      }
    }
  };

  onScrollParallax = () => {
    const h = window.innerHeight;
    const doc = document.documentElement;
    const st = (window.scrollY || doc.scrollTop) - (doc.clientTop || 0);

    if (this.cache.parallaxes && this.cache.parallaxes.length > 0) {
      const { parallaxes } = this.cache;
      for (let i = 0; i < parallaxes.length; i += 1) {
        this.parallax(parallaxes[i], st, h);
      }
    }
  };

  animation = async (item: AnimationItem) => {
    const timing = item.timing || 0.6;
    const delay = item.delay || 0.1;
    const ease = item.ease || 'power2.out';

    switch (item.type) {
      case 'fadeIn':
        gsap.killTweensOf(item.el, { opacity: true });

        await gsap.fromTo(
          item.el,
          {
            duration: timing,
            opacity: 0,
          },
          {
            duration: timing,
            opacity: 1,
            ease: 'circ.inOut',
            delay,
          },
        );

        break;

      case 'fadeUp':
        gsap.killTweensOf(item.el, { opacity: true, y: true });

        await gsap.fromTo(
          item.el,
          {
            duration: timing,
            opacity: 0,
            y: 40,
          },
          {
            duration: timing,
            opacity: 1,
            y: 0,
            ease,
            delay,
          },
        );

        break;

      case 'fadeDown':
        gsap.killTweensOf(item.el, { opacity: true, y: true });

        await gsap.fromTo(
          item.el,
          {
            duation: timing,
            opacity: 0,
            y: -40,
          },
          {
            duation: timing,
            opacity: 1,
            y: 0,
            ease,
            delay,
          },
        );

        break;

      case 'fadeRight':
        gsap.killTweensOf(item.el, { opacity: true, x: true });

        await gsap.fromTo(
          item.el,
          {
            duration: timing,
            opacity: 0,
            x: 40,
          },
          {
            duration: timing,
            opacity: 1,
            x: 0,
            ease,
            delay,
          },
        );

        break;

      case 'fadeLeft':
        gsap.killTweensOf(item.el, { opacity: true, x: true });

        await gsap.fromTo(
          item.el,
          {
            duration: timing,
            opacity: 0,
            x: -40,
          },
          {
            duration: timing,
            opacity: 1,
            x: 0,
            ease,
            delay,
          },
        );

        break;

      case 'scale':
        gsap.killTweensOf(item.el, { opacity: true, y: true });

        if (item.origin) {
          gsap.set(item.el, { transformOrigin: item.origin });
        }

        await gsap.fromTo(
          item.el,
          {
            duration: timing,
            scale: 0,
            opacity: 0,
          },
          {
            duration: timing,
            scale: 1,
            opacity: 1,
            ease: item.ease || 'back.out(1.4)',
            delay,
          },
        );

        break;

      case 'scaleY':
        gsap.killTweensOf(item.el, { opacity: true, scaleY: true });
        gsap.set(item.el, { transformOrigin: item.origin || 'top' });
        await gsap.fromTo(
          item.el,
          {
            duration: timing,
            scaleY: 0,
            opacity: 0,
          },
          {
            duration: timing,
            scaleY: 1,
            opacity: 1,
            ease: 'back.out(1.7)',
            delay,
          },
        );

        break;

      case 'scaleX':
        gsap.killTweensOf(item.el, { opacity: true, scaleX: true });
        gsap.set(item.el, { transformOrigin: item.origin || 'left' });

        await gsap.fromTo(
          item.el,
          {
            duration: timing,
            x: 40,
            opacity: 0,
            scaleX: 0,
          },
          {
            duration: timing,
            x: 0,
            opacity: 1,
            scaleX: 1,
            ease,
            delay,
          },
        );

        break;

      case 'distort':
        // eslint-disable-next-line no-case-declarations
        const distortMap = item.el.querySelector('feDisplacementMap');
        // eslint-disable-next-line no-case-declarations
        const image = item.el.querySelector('image');
        if (!distortMap || !image) break;

        gsap.killTweensOf(item.el, { opacity: true, y: true });
        await gsap.fromTo(
          [item.el, image],
          {
            duration: timing,
            opacity: 0,
            y: 40,
          },
          {
            duration: timing,
            opacity: 1,
            y: 0,
            ease: 'circ.inOut',
            delay,
          },
        );

        gsap.fromTo(
          distortMap.scale,
          { baseVal: 200 },
          {
            duration: timing,
            baseVal: 0,
            ease: 'circ.inOut',
            delay,
          },
        );

        break;

      default:
        console.warn(`animation type "${item.type}"" does not exist`);
        break;
    }

    item.el.classList.add('is-passed');
  };

  parallax = (item: ParallaxItem, sT: number, windowHeight: number) => {
    const { el, shift, type, start, height, done, horizontal } = item;

    let { y } = item;
    const pyBottom = sT + (1 - start);
    const pyTop = sT - height;

    if (y >= pyTop && y <= pyBottom) {
      if (shift) {
        const amount = y - sT + height;
        const extra = 1 - start;
        const postion = windowHeight + height;
        const percent = (amount / extra / postion) * 100;
        const property = horizontal ? 'x' : 'y';
        y = Math.round(percent * Number(shift));

        const time = !done ? 0 : 0.5;

        item.done = true;

        gsap.killTweensOf(el);

        gsap.to(el, {
          duration: time,
          [property]: y,
          roundProps: [property],
          // ease: Circ.easeOut,
        });
      } else if (type) {
        switch (type) {
          // case 'shape':
          //   gsap.set($el, {
          //     y: !browserDetect().mobile ? sT * 0.5 : 0,
          //   })
          //   break

          case 'rotate':
            gsap.set(el, {
              rotation: sT * 0.5,
              transformOrigin: '50px 52px',
            });
            break;

          default:
            console.warn(`parallax type "${item.type}" does not exist`);
            break;
        }
      }
    }
  };

  init() {
    this.storeCache();
    this.onScroll();
  }

  events() {
    window.addEventListener('scroll', this.onScroll);
  }

  destroy() {
    this.cache.animations = undefined;
    this.cache.parallaxes = undefined;
    window.removeEventListener('scroll', this.onScroll);
  }

  activate() {
    this.init();
    this.events();
  }
}
