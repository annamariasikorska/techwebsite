import { v4 as uuidv4 } from 'uuid';
import { sizes } from '@/constants';

interface State {
  // isMobile: boolean;
  isMenuVisible: boolean;
  headerStatus: 'visible' | 'hidden';
  screen: 'phone' | 'tablet' | 'desktop' | 'largeScreen';
  theme: 'dark' | 'light';
}

interface Watcher<T extends keyof State> {
  source: T | T[];
  id: string;
  callback: (value: Pick<State, T>) => void;
}

const darkThemeMq = window.matchMedia('(prefers-color-scheme: dark)');

export function getScreen() {
  const w = window.innerWidth;

  if (w >= sizes.desktop) {
    return 'largeScreen';
  }

  if (w >= sizes.tablet) {
    return 'desktop';
  }

  if (w > sizes.phone) {
    return 'tablet';
  }

  return 'phone';
}

function getTheme() {
  if (window) {
    const storedTheme = window.localStorage.getItem('theme');

    if (storedTheme === 'dark' || storedTheme === 'light') {
      return storedTheme;
    }
  }

  return darkThemeMq.matches ? 'dark' : 'light';
}

const watchers: Watcher<keyof State>[] = [];

const initialState: State = {
  // isMobile: browserDetect().mobile,
  screen: 'desktop',
  headerStatus: 'visible',
  theme: getTheme(),
  isMenuVisible: false,
};

const cresteState = () => {
  return initialState;
};

export function watch<T extends keyof State>(
  source: T | T[],
  callback: (value: Pick<State, T>) => void,
  // options?: WatchOptions
) {
  const id = uuidv4();

  watchers.push({
    source,
    callback,
    id,
  });

  return id;
}

export const state = new Proxy(cresteState(), {
  // get(target, prop) {
  //   return target;
  // },
  set(target, key, value) {
    const typedKey = key as keyof State;
    const currentValue = target[typedKey];
    const typedValue = value as typeof currentValue;
    Reflect.set(target, typedKey, typedValue);

    if (watchers.length && currentValue !== value) {
      const filteredWatcher = watchers.filter(w => {
        if (Array.isArray(w.source)) {
          return !!w.source.find(s => s === key);
        }

        return w.source === key;
      });

      for (let index = 0; index < filteredWatcher.length; index += 1) {
        const watcher = filteredWatcher[index];

        if (watcher && typeof watcher.callback === 'function') {
          watcher.callback(value);
        }
      }
    }

    return true;
  },
});
