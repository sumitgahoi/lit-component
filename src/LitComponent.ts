import { render } from 'lit-html';

export abstract class LitComponent<P = any, S = any> extends HTMLElement {
  private readonly renderRoot: Element | DocumentFragment;
  private _props: P = {} as any;
  private _state: S = {} as any;
  private hasRequestedUpdate = false;

  constructor() {
    super();
    this.renderRoot = this.createRenderRoot();
  }

  createRenderRoot() {
    return this.attachShadow({ mode: 'open' });
  }

  get props() {
    return this._props;
  }

  set props(newProps: P) {
    this._props = newProps;
    this.requestUpdate();
  }

  get state() {
    return this._state;
  }

  set state(newState: S) {
    this._state = newState;
    this.requestUpdate();
  }

  connectedCallback() {
    this.upgradeProps();
    this.componentDidMount();
    this.requestUpdate();
  }

  /** See https://developers.google.com/web/fundamentals/web-components/best-practices#lazy-properties */
  private upgradeProps() {
    const value = this._props;
    delete this._props;
    this._props = value;
  }

  disconnectedCallback() {
    this.componentDidUnmount();
  }

  protected componentDidMount() {
    // empty
  }

  protected componentDidUnmount() {
    // empty
  }

  protected abstract template(): unknown;

  protected async prepareTemplate(): Promise<unknown> {
    return this.template();
  }

  protected renderTemplate(template: unknown) {
    render(template, this.renderRoot, { eventContext: this });
  }

  protected async requestUpdate() {
    this.hasRequestedUpdate = true;
    queueMicrotask(() => {
      if (this.hasRequestedUpdate) {
        this.hasRequestedUpdate = false;
        this.prepareTemplate().then(template => this.renderTemplate(template));
      }
    });
  }
}
