// A reactive effect is simply a function with no arguments
// that we can track and re-run when dependencies change.
type Effect = () => void;

// The “bucket” stores, for each target object, a map from each
// property key to the set of effects that depend on that key.
// We use a WeakMap so unused targets can be garbage-collected.
const bucket = new WeakMap<object, Map<string | symbol, Set<Effect>>>();

// Holds the currently running effect (if any) so getters know
// which effect to subscribe to when a property is read.
let activeEffect: Effect | null = null;

/**
 * Registers a reactive effect.
 * 1. Sets `activeEffect` so any property reads inside `fn()`
 *    will track this effect.
 * 2. Immediately runs the effect once to collect dependencies.
 * 3. Clears `activeEffect` so unrelated code doesn’t accidentally track.
 */
export function effect(fn: Effect) {
  activeEffect = fn;
  fn();               // run once to “record” dependencies via getters
  activeEffect = null;
}

/**
 * Wraps an object in a Proxy to make it reactive.
 * `get`: track dependencies if inside an active effect
 * `set`: trigger all effects that depend on the changed property
 */
export function reactive<T extends object>(obj: T): T {
  return new Proxy(obj, {
    get(target, key) {
      // Only track if there’s an effect currently running
      if (activeEffect) {
        // Get or create the deps map for this target
        let depsMap = bucket.get(target);
        if (!depsMap) {
          depsMap = new Map<string | symbol, Set<Effect>>();
          bucket.set(target, depsMap);
        }
        // Get or create the effect set for this particular key
        let deps = depsMap.get(key);
        if (!deps) {
          deps = new Set<Effect>();
          depsMap.set(key, deps);
        }
        // Subscribe the current effect to this key
        deps.add(activeEffect);
      }
      // Return the actual property value
      return Reflect.get(target, key);
    },

    set(target, key, val) {
      // Perform the actual property update
      const result = Reflect.set(target, key, val);

      // Look up effects that depend on this target/key
      const depsMap = bucket.get(target);
      const effectsToRun = depsMap?.get(key);

      // Re-run each effect to reflect the change
      if (effectsToRun) {
        effectsToRun.forEach(effectFn => effectFn());
      }

      return result;
    }
  });
}
