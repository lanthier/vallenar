// src/framework/component.ts
import { reactive, effect } from './reactive';
import { bindDirectives } from './compiler';
import { HookEmitter } from './lifecycle';

export abstract class Component<Props = {}> extends HookEmitter {
  protected state: any;
  protected container: HTMLElement;
  private isMounted = false;

  protected props: Props;

  /**
   * @param props    Initial props for this component
   * @param selector A CSS selector for the mount point (e.g. '#app')
   */
  constructor(props: Props, selector: string) {
    super();

    this.props = props;

    // 1) Resolve and store the container element once
    const el = document.querySelector(selector);
    if (!el) throw new Error(`Mount point "${selector}" not found`);
    this.container = el as HTMLElement;

    // 2) Initialize reactive state
    this.state = reactive(this.initState());

    // 3) onInit hooks run here
    this.emit('onInit');

    // 4) Set up a global effect that re-renders when *any* state changes,
    //    but only *after* mount() has been called
    effect(() => {
      if (this.isMounted) {
        this.update();
        this.emit('onUpdate');
      }
    });
  }

  /** Subclasses must define their initial state shape */
  protected abstract initState(): object;

  /** Subclasses return their HTML template as a string */
  protected abstract template(): string;

  /** Mount into the DOM (no args needed—container was set above) */
  mount() {
    // Initial render
    this.render();
    this.isMounted = true;
    this.emit('onMount');
  }

  /** Clean up & tear down */
  destroy() {
    this.emit('onDestroy');
    this.container.innerHTML = '';
    this.isMounted = false;
  }

  /** Full render pass: inject template → bind directives */
  private render() {
    // Convert string → DOM nodes
    const frag = document.createRange()
      .createContextualFragment(this.template());

    // Wire up v-text, v-model, {{ }} etc.
    bindDirectives(frag, this.state);

    // Replace container contents
    this.container.innerHTML = '';
    this.container.appendChild(frag);
  }

  /** Called automatically on state change (after mount) */
  private update() {
    this.render();
  }

  // Convenience methods to register lifecycle hooks
  onInit(fn: () => void)    { this.on('onInit', fn); }
  onMount(fn: () => void)   { this.on('onMount', fn); }
  onUpdate(fn: () => void)  { this.on('onUpdate', fn); }
  onDestroy(fn: () => void) { this.on('onDestroy', fn); }
}
