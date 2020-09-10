import { html } from 'lit-html';
import { LitComponent } from '../src/LitComponent';

export class HelloWorld extends LitComponent {
  constructor() {
    super();
    this.state = { counter: 0 };
  }
  __increment() {
    this.state = { counter: this.state.counter + 1 };
  }
  protected template(): unknown {
    return html`
      <h2>${this.props.title} Nr. ${this.state.counter}!</h2>
      <button @click=${this.__increment}>increment</button>
    `;
  }
}

customElements.define('hello-world', HelloWorld);
