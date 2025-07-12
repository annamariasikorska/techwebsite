import { v4 as uuidv4 } from 'uuid';

interface State {
  view: HTMLElement | null;
  mainImage: HTMLDivElement | null;
  distortMap: SVGFEDisplacementMapElement | null;
  turbulence: SVGFETurbulenceElement | null;
}

interface Watcher<T extends keyof State> {
  source: T | T[];
  id: string;
  callback: (value: Pick<State, T>) => void;
}

const watchers: Watcher<keyof State>[] = [];

const initialState: State = {
  view: null,
  mainImage: null,
  distortMap: null,
  turbulence: null,
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
    const currentValue = target[key as keyof typeof target];
    target[key as keyof typeof target] = value;

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
