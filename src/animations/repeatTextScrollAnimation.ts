import { gsap } from 'gsap';

interface Dom {
  el: HTMLElement | null;
  words: HTMLSpanElement[] | null;
}

interface Options {
  numberOfRepeat?: number;
}

const getHeight = (el: HTMLElement) => {
  const computedStyle = getComputedStyle(el);

  let elementHeight = el.clientHeight; // height with padding
  elementHeight -= parseFloat(computedStyle.paddingTop) + parseFloat(computedStyle.paddingBottom);
  return elementHeight;
};

/**
 * Class representing an element with multiple text child elements that translate up/down when scrolling
 */
export default class RepeatTextScrollAnimation {
  // DOM elements
  DOM: Dom = {
    // main element ([data-text-rep])
    el: null,
    // all text spans except the last one (this will be the centered one and doesn't translate
    words: null,
  };
  totalWords = 9;
  tyIncrement = 14;
  delayIncrement = 0.08;
  scrollTimeline: gsap.core.Timeline | null = null;
  observer: IntersectionObserver | null = null;
  isLoaded = false;
  progressTween: null | (() => void) = null;

  /**
   * Constructor.
   * @param {NodeList} Dom_el - main element ([data-text-rep])
   */
  constructor(view: HTMLElement, options?: Options) {
    this.DOM.el = view;

    if (options?.numberOfRepeat) {
      this.totalWords = options.numberOfRepeat;
    }
  }
  /**
   * Creates the text spans inside the main element
   */
  layout() {
    if (!this.DOM.el) {
      return;
    }

    const halfWordsCount = Math.floor(this.totalWords / 2);
    let innerHTML = '';

    for (let i = 0; i < this.totalWords; ++i) {
      let ty;
      let delay;

      if (i === this.totalWords - 1) {
        ty = 0;
        delay = 0;
      } else if (i < halfWordsCount) {
        ty = halfWordsCount * this.tyIncrement - this.tyIncrement * i;
        delay = this.delayIncrement * (halfWordsCount - i) - this.delayIncrement;
      } else {
        ty = -1 * (halfWordsCount * this.tyIncrement - (i - halfWordsCount) * this.tyIncrement);
        delay = this.delayIncrement * (halfWordsCount - (i - halfWordsCount)) - this.delayIncrement;
      }

      innerHTML += `<span data-delay="${delay}" data-ty="${ty}">${this.DOM.el.innerHTML}</span>`;
    }

    this.DOM.el.innerHTML = innerHTML;
    this.DOM.el.classList.add('text-rep');
    this.DOM.words = [...this.DOM.el.querySelectorAll('span')].slice(0, -1);
  }
  /**
   * sets the padding bottom and margin top given the amount that the words will translate up/down
   */
  setBoundaries = () => {
    if (this.DOM.el) {
      // Set up the margin top and padding bottom values
      const paddingBottomMarginTop =
        (getHeight(this.DOM.el) * Math.floor(this.totalWords / 2) * this.tyIncrement) / 100;
      gsap.set(this.DOM.el, {
        marginTop: paddingBottomMarginTop,
        paddingBottom: paddingBottomMarginTop,
      });
    }
  };
  /**
   * gsap animation timeline
   * translates the text spans when the element enters the viewport
   */
  createScrollTimeline() {
    this.scrollTimeline = gsap
      .timeline({ paused: true })

      .to(
        this.DOM.words,
        {
          duration: 1,
          ease: 'none',
          startAt: { opacity: 0 },
          opacity: 1,
          yPercent: (_, target) => target.dataset.ty,
          delay: (_, target) => target.dataset.delay,
        },
        0,
      )
      .to(this.DOM.words, {
        duration: 1,
        ease: 'none',
        opacity: 0,
        yPercent: 0,
        delay: (_, target) => target.dataset.delay,
      });
  }
  /**
   * Intersection Observer
   * Updates the timeline progress when the element is in the viewport
   */
  createObserver() {
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px',
      threshold: 0,
    };

    // credits: from https://medium.com/elegant-seagulls/parallax-and-scroll-triggered-animations-with-the-intersection-observer-api-and-gsap3-53b58c80b2fa
    this.observer = new IntersectionObserver(entry => {
      if (entry[0].intersectionRatio > 0) {
        if (!this.isLoaded) {
          this.isLoaded = true;
        }

        if (this.progressTween) {
          gsap.ticker.add(this.progressTween);
        }
      } else {
        if (this.progressTween) {
          if (this.isLoaded) {
            gsap.ticker.remove(this.progressTween);
          } else {
            this.isLoaded = true;
            // add and remove immediately
            gsap.ticker.add(this.progressTween, true);
          }
        }
      }
    }, observerOptions);

    this.progressTween = () => {
      if (this.DOM.el && this.scrollTimeline) {
        // Get scroll distance to bottom of viewport.
        const scrollPosition = window.scrollY + window.innerHeight;
        // Get element's position relative to bottom of viewport.
        const elPosition = scrollPosition - this.DOM.el.offsetTop;
        // Set desired duration.
        const durationDistance = window.innerHeight + this.DOM.el.offsetHeight;
        // Calculate tween progresss.
        const currentProgress = elPosition / durationDistance;
        // Set progress of gsap timeline.
        this.scrollTimeline.progress(currentProgress);
      }
    };

    if (this.DOM.el) {
      this.observer.observe(this.DOM.el);
    }
  }

  init() {
    this.layout();
    this.setBoundaries();
    this.createScrollTimeline();
    this.createObserver();
    window.addEventListener('resize', this.setBoundaries);
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    this.DOM = {
      el: null,
      words: null,
    };

    window.removeEventListener('resize', this.setBoundaries);
  }
}
