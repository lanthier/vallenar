import { effect } from './reactive';
import { Parser } from 'expr-eval';

const parser = new Parser();
const exprCache = new Map<string, ReturnType<Parser['parse']>>();

function evalIn(state: any, exp: string): any {
  const userFns = state.methods ?? {};

  let expr = exprCache.get(exp);
  if (!expr) {
    expr = parser.parse(exp);
    exprCache.set(exp, expr);
  }

  try {
    return expr.evaluate({
      ...state,
      ...userFns
    });
  } catch (e) {
    console.warn(`Failed to evaluate expression "${exp}":`, e);
    return '';
  }
}
/**
 * Walks the DOM tree under `root`, looking for:
 *  1. Text nodes containing {{ ... }} interpolations
 *  2. Elements with supported attributes
 *
 * For each binding found, registers a reactive `effect` so the DOM updates
 * automatically whenever the corresponding `state` properties change.
 */
export function bindDirectives(
  root: DocumentFragment | HTMLElement,
  state: any
) {
  // Create a TreeWalker to traverse both element and text nodes
  const walker = document.createTreeWalker(
    root,
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null
  );

  let node: Node | null;
  // Iterate through every node in document order
  while ((node = walker.nextNode())) {
    // #region Interpolation
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node as Text;
      // Regex to find {{ expression }} patterns
      const mustacheRE = /\{\{\s*(.+?)\s*\}\}/g;

      // If the text contains at least one {{ … }} binding
      if (mustacheRE.test(txt.textContent || '')) {
        // Preserve the original template text (with the {{ }} intact)
        const original = txt.textContent || '';

        // Wrap in an effect so it re-runs on any dependent state change
        effect(() => {
          // Replace each {{ expr }} with its evaluated value
          txt.textContent = original.replace(mustacheRE, (_, expr) =>
            String(evalIn(state, expr))
          );
        });
      }
    }
    // #endregion

    // region Element Directives
    if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as HTMLElement;

      // Iterate over a snapshot of attributes, since we may remove some
      for (const { name, value } of Array.from(el.attributes)) {
        // v-text: bind element’s textContent to a state expression
        if (name === 'v-text') {
          effect(() => {
            // Evaluate the expression and set textContent
            el.textContent = String(evalIn(state, value));
          });
          // Remove the directive attribute so it doesn't show up in the DOM
          el.removeAttribute(name);
        }

        // v-model: two-way bind an <input> element’s value to state[key]
        if (name === 'v-model' && el instanceof HTMLInputElement) {
          // 1) model → view: update input.value when state changes
          effect(() => {
            el.value = String(evalIn(state, value));
          });

          // 2) view → model: listen for user input and write back to state
          el.addEventListener('input', e => {
            const v = (e.target as HTMLInputElement).value;
            // Directly assign to state property matching the directive value
            state[value] = v;
          });

          // Remove the directive attribute for cleanliness
          el.removeAttribute(name);
        }

        // Event handlers
        if (name.startsWith('v-on:')) {
          const eventName = name.slice(5);
          el.addEventListener(eventName, e => {
            evalIn(state, value);
          });
          el.removeAttribute(name);
        }
      }
    }
    // #endregion
  }
}
