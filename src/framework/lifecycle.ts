export interface Lifecycle {
    onInit?(): void;
    onMount?(): void;
    onUpdate?(): void;
    onDestroy?(): void;
  }

export type Hook = 'onInit' | 'onMount' | 'onUpdate' | 'onDestroy';

export class HookEmitter {
  private hooks = new Map<Hook, Array<() => void>>();

  on(hook: Hook, fn: () => void) {
    if (!this.hooks.has(hook)) this.hooks.set(hook, []);
    this.hooks.get(hook)!.push(fn);
  }

  protected emit(hook: Hook) {
    (this.hooks.get(hook) || []).forEach(fn => {
      try { fn(); }
      catch (err) { console.error(`Error in ${hook}:`, err); }
    });
  }
}