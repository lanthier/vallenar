// src/main.ts
import { Component } from '../framework/component';

class Counter extends Component<{ initial: number }> {
  protected initState() {
    return { 
      count: this.props.initial, 
      methods: {
        greet: () => { alert('hi'); }
      }
    };
  }

  protected template() {
    return `
      <div style="font-family:sans-serif; text-align:center; margin-top:2rem;">
        <h2>Count: <span v-text="count"></span></h2>
        <button id="dec">–</button>
        <button id="inc" v-on:click="greet()">+</button>
        <p>
          <label>Set directly:
            <input type="range" min="0" max="100" v-model="count" />
          </label>
        </p>
        <p>Double: {{ count * 2 }}</p>
      </div>
    `;
  }

  mount() {
    super.mount();
    // wire up our buttons
    this.container.querySelector('#inc')!
      .addEventListener('click', () => this.state.count++);
    this.container.querySelector('#dec')!
      .addEventListener('click', () => this.state.count--);
  }
}

// bootstrap on DOM ready
document.addEventListener('DOMContentLoaded', () => {
  new Counter({ initial: 10 }, '#app').mount();
});
