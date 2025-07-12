import Splitting from 'splitting';
import { gsap } from 'gsap';

export default function textAnimation() {
  // Splitting.js
  // Calling the Splitting function to split the text into individual words/characters,
  const splittingOutput = Splitting({
    target: '[data-splitting]',
  });

  // Check if there's an animation in progress
  // const isAnimating = false;

  // switch between texts
  const switchTexts = (targetIndex = 0, stagger = 0.03) => {
    // if (isAnimating) return false;
    // isAnimating = true;

    // All current text words
    const currentWords = splittingOutput[targetIndex]?.chars;

    if (currentWords) {
      gsap
        .timeline({
          defaults: {
            duration: 0.05,
            ease: 'expo',
          },
          onComplete: () => {
            // Update currentTextPos
            // currentTextPos = upcomingTextPos;
            // isAnimating = false;
          },
        })
        .fromTo(
          currentWords,
          {
            opacity: 0,
          },
          {
            opacity: 1,
            delay: 0.3,
            stagger: {
              each: stagger,
              from: 'random',
            },
          },
        );
    }
  };

  return [splittingOutput, switchTexts] as const;
}
