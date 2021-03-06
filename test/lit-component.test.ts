import { assert, expect, fixture, html } from '@open-wc/testing';
import sinon from 'sinon';
import { LitComponent } from '../src/LitComponent.js';
import './hello-world.element';

describe('LitComponent', () => {
  it('renders without props or state', async () => {
    customElements.define(
      'lit-0',
      class extends LitComponent {
        protected template(): unknown {
          return html`<h2>Hello, Lit!</h2>`;
        }
      }
    );
    const el: LitComponent = await fixture(html` <lit-0></lit-0> `);
    expect(el.props).to.be.empty;
    expect(el.state).to.be.empty;

    await new Promise(resolve => {
      setTimeout(() => {
        assert.ok(el.shadowRoot);
        expect(el.shadowRoot!.querySelector('h2')?.innerText).to.equal(
          'Hello, Lit!'
        );
        resolve();
      });
    });
  });

  it('renders with props and without state', async () => {
    customElements.define(
      'lit-1',
      class extends LitComponent {
        protected template(): unknown {
          return html`<h2>${this.props.title}</h2>`;
        }
      }
    );
    const el: LitComponent = await fixture(
      html` <lit-1 .props=${{ title: 'Hey, there!' }}></lit-1> `
    );
    expect(el.props.title).to.equal('Hey, there!');
    expect(el.state).to.be.empty;

    await new Promise(resolve => {
      setTimeout(() => {
        assert.ok(el.shadowRoot);
        expect(el.shadowRoot!.querySelector('h2')?.innerText).to.equal(
          'Hey, there!'
        );

        resolve();
      });
    });
  });

  it('renders with state and no props ', async () => {
    const el: LitComponent = await fixture(html` <hello-world></hello-world> `);
    expect(el.props).to.be.empty;
    expect(el.state.counter).to.equal(0);

    await new Promise(resolve => {
      setTimeout(() => {
        assert.ok(el.shadowRoot);
        expect(el.shadowRoot!.querySelector('h2')?.innerText).to.equal(
          'Nr. 0!'
        );
        expect(el.shadowRoot!.querySelector('button')?.innerText).to.equal(
          'increment'
        );
        resolve();
      });
    });
  });

  it('renders with both props and state set', async () => {
    const el: LitComponent = await fixture(
      html` <hello-world .props=${{ title: 'Hey, there!' }}></hello-world> `
    );
    expect(el.props.title).to.equal('Hey, there!');
    expect(el.state.counter).to.equal(0);

    await new Promise(resolve => {
      setTimeout(() => {
        assert.ok(el.shadowRoot);
        expect(el.shadowRoot!.querySelector('h2')?.innerText).to.equal(
          'Hey, there! Nr. 0!'
        );
        expect(el.shadowRoot!.querySelector('button')?.innerText).to.equal(
          'increment'
        );
        resolve();
      });
    });
  });

  it('renders only once', async () => {
    const sandbox = sinon.createSandbox();
    const el: LitComponent = await fixture(
      html` <hello-world .props=${{ title: 'Hey, there!' }}></hello-world> `
    );
    (sandbox.spy as any)(el, 'renderTemplate');
    (sandbox.spy as any)(el, 'connectedCallback');
    expect(el.props.title).to.equal('Hey, there!');
    expect(el.state.counter).to.equal(0);

    el.state = { counter: 1 };
    el.state = { counter: 2 };
    el.state = { counter: 3 };

    await new Promise(resolve => {
      setTimeout(() => {
        assert.ok(el.shadowRoot);
        expect(el.shadowRoot!.querySelector('h2')?.innerText).to.equal(
          'Hey, there! Nr. 3!'
        );
        expect(el.shadowRoot!.querySelector('button')?.innerText).to.equal(
          'increment'
        );
        expect(
          (el as any).renderTemplate.callCount,
          'LitComponent should batch all updates and render only once'
        ).to.equal(1);
        expect(
          (el as any).connectedCallback.callCount,
          'in text fixture, element is not mounted'
        ).to.equal(0);
        resolve();
      });
    });

    sandbox.restore();
  });

  it('requestUpdate should return the same promise', async () => {
    const sandbox = sinon.createSandbox();
    const el: LitComponent = await fixture(html` <hello-world></hello-world> `);
    (sandbox.spy as any)(el, 'performUpdate');

    const p1 = el.requestUpdate();
    const p2 = el.requestUpdate();
    const p3 = el.requestUpdate();
    expect(p1).to.equal(p2);
    expect(p2).to.equal(p3);
    expect(
      (el as any).performUpdate.callCount,
      'LitComponent should render only in next tick'
    ).to.equal(0);
    await p1;

    expect(
      (el as any).performUpdate.callCount,
      'LitComponent should batch all updates and render only once'
    ).to.equal(1);
    sandbox.restore();
  });

  it('requestUpdate in a different execution frame should return a different promise', async () => {
    const sandbox = sinon.createSandbox();
    const el: LitComponent = await fixture(html` <hello-world></hello-world> `);
    (sandbox.spy as any)(el, 'performUpdate');

    const p1 = el.requestUpdate();
    await p1;
    const p4 = el.requestUpdate();
    expect(p1).to.not.equal(p4);
    await p4;
    expect(
      (el as any).performUpdate.callCount,
      'LitComponent should only batch all updates in a single execution frame'
    ).to.equal(2);
    sandbox.restore();
  });

  it('componentDidMount must be called from connectedCallback', async () => {
    const sandbox = sinon.createSandbox();
    const el: LitComponent = await fixture(html` <hello-world></hello-world> `);
    (sandbox.spy as any)(el, 'componentDidMount');

    expect(
      (el as any).componentDidMount.callCount,
      'componentDidMount must be not be called if connectedCallback is not called.'
    ).to.equal(0);

    await el.connectedCallback();

    expect(
      (el as any).componentDidMount.callCount,
      'componentDidMount must be called from connectedCallback'
    ).to.equal(1);

    sandbox.restore();
  });

  it('componentDidMount must be called after first render', async () => {
    const sandbox = sinon.createSandbox();
    const el: LitComponent = await fixture(html` <hello-world></hello-world> `);
    (sandbox.spy as any)(el, 'componentDidMount');

    el.connectedCallback();
    const p = el.requestUpdate();

    expect(
      (el as any).componentDidMount.callCount,
      'componentDidMount must not be called before render is complete'
    ).to.equal(0);

    await p;

    expect(
      (el as any).componentDidMount.callCount,
      'componentDidMount must be called after first render'
    ).to.equal(1);

    sandbox.restore();
  });

  it('increases the counter on button click', async () => {
    const el: LitComponent = await fixture(
      html` <hello-world .props=${{ title: 'Hey, there!' }}></hello-world> `
    );
    el.shadowRoot!.querySelector('button')!.click();
    expect(el.state.counter).to.equal(1);

    await new Promise(resolve => {
      setTimeout(() => {
        expect(el.shadowRoot!.querySelector('h2')?.innerText).to.equal(
          'Hey, there! Nr. 1!'
        );
        resolve();
      });
    });
  });

  it('passes the a11y audit', async () => {
    const el: LitComponent = await fixture(html` <hello-world></hello-world> `);
    expect(el).shadowDom.to.be.accessible();
  });
});
