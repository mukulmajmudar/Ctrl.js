# Ctrl.js

A lightweight, declarative framework for organizing control logic in the MVC (Model-View-Controller) paradigm. Ctrl.js manages DOM element lifecycles, provides sophisticated event delegation, and offers an intuitive API for creating event-driven web applications.

## Design Philosophy

In web-based user interfaces, the *view* is already modeled by the native JavaScript `HTMLElement` instance. Code that builds the view, maps data to/from it, and handles user interaction is functional *control logic* which operates on the `HTMLElement`. Ctrl.js gives you a way to define this control logic using simple callbacks and event listeners.

Many popular frameworks create a thick layer of abstraction that sits between developers and the web platform, introducing complicated component models, template languages, and complex "magic" that completely alters the web programming model. Although it can seem initially appealing, this approach leads to framework lock-in and skill erosion. Applications become deeply dependent on the framework's ecosystem, popularity, and life span. Developers over time become siloed and entrenched within such frameworks and forget, or never even learn, the fundamentals of the web platform.

Ctrl.js takes a fundamentally different approach by embracing rather than hiding the web platform. It works directly with standard DOM elements and events, keeping your code closer to the platform and reducing dependency on external abstractions. This approach leads to minimal overhead and a programming model that aligns with how the web platform actually works. Applications built with Ctrl.js are simple, flexible, and future-proof.

## Features

- **Declarative Control Logic**: Simple API to define components and organize control logic.
- **Automatic Lifecycle Management**: `load`, `show`, and `hide` hooks for when elements are added to or removed from the DOM.
- **Advanced Event Delegation**: Event bubbling and delegation across nested elements.
- **Thin abstraction**: Facilitates the web platform model instead of hiding it.
- **Compact Footprint**: Lightweight approach with no dependencies.

## Installation

### Via npm

```bash
npm install --save ctrljs
```

## Basic Usage

Here is a simple counter component in Ctrl.js.

```javascript
// Counter.js
import Ctrl from 'ctrljs';

// Create an HTMLElement for the counter and define callbacks and events.
export function Counter() {
  return Ctrl.el({
    id: 'counter',
    classList: ['counter-container'],
    props: { count: 0 },
    show,
    hide,
    eventListeners: getEventListeners()
  });
}

// Callback for when the element is added to the DOM.
async function show(el) {
  el.innerHTML = `
    <button class="decrement">-</button>
    <span class="count">${el.props.count}</span>
    <button class="increment">+</button>
  `;
}

// Callback for when the element is removed from the DOM.
function hide(el) {
  console.log('Counter removed from DOM');
  // Cleanup if needed
}

// Declare event listeners
function getEventListeners() {
  return {
    click: {
      '.increment': handleIncrement,
      '.decrement': handleDecrement
    }
  };
}

function handleIncrement(el, event) {
  el.props.count++;
  Ctrl.show(el);
}

function handleDecrement(el, event) {
  el.props.count--;
  Ctrl.show(el);
}
```

To use the component:

```javascript
// App.js
import { Counter } from './Counter.js';

// Create and add the counter to the page
const counterEl = Counter();
document.body.appendChild(counterEl);   // show(counterEl) will be called automatically
```

## API Documentation

### `el(options)`

Creates and configures a DOM element with lifecycle hooks and event handlers.

#### Parameters

| Option | Type | Description |
|--------|------|-------------|
| `classList` | Array | List of CSS classes to add |
| `el` | Element | Existing element to configure (optional) |
| `eventListeners` | Object | Event configuration (see below) |
| `hide` | Function | Callback when element is removed from the DOM (can be async) |
| `id` | String | The element's ID attribute |
| `load` | Function | Callback for loading the component, called before `show()` (can be async) |
| `props` | Object | Custom properties to attach to the element |
| `show` | Function | Callback when element is added to the DOM (can be async) |
| `showOnResume` | Boolean | Whether to show the element when 'resume' event fires |
| `style` | Object | CSS styles to apply to the element |
| `tag` | String | The HTML tag name (default: 'div') |

#### Event Listeners

The `eventListeners` object supports advanced event delegation:

```javascript
eventListeners: {
  'click': {
    '': (el, event) => { /* Handle click on the element itself */ },
    '.child-selector': (el, event) => { /* Handle click on child elements matching selector */ }
  },
  'input': {
    'input[type="text"]': (el, event) => { /* Handle input events on text inputs */ }
  }
}
```

Event handlers receive:

- `el`: The element created via `el()`
- `event`: The DOM event with an additional `delegatorTarget` property that references the element matching the selector

### Lifecycle Events

Elements created with Ctrl.js emit the following custom events during their lifecycle:

- `loading`: Dispatched when the element begins to load
- `loaded`: Dispatched after the element is loaded
- `loadError`: Dispatched if an error occurs during load
- `showing`: Dispatched when the element begins to show
- `shown`: Dispatched after the element is fully shown
- `showError`: Dispatched if an error occurs during show
- `hidden`: Dispatched after the element is hidden

## Composing Components

```javascript
// File: Parent.js
import Ctrl from "ctrljs";

import Child1 from "Child1.js";
import Child2 from "Child2.js";

function el({ props: { x, y }}) {
  return Ctrl.el({
    load,
    props: { x, y },
    show,
  });
}

async function load(el) {
  const [ shared ] = await Promise.all([
    fetch(`https://example.com/shared?x=${x}&y=${y}`),
    // Load more props as needed
  ]);

  // Define children components after loading initial data so we can
  // provide the appropriate data to the children.
  el.props = {
    ...el.props,
    child1: Child1.el({ shared: el.props.shared }),
    child2: Child2.el({ shared: el.props.shared }),
    html: `
      <div id="child1"></div>
      <div id="child2"></div>
    `,
    shared
  });

  // Load children components
  await Promise.all([
    Child1.load(el.props.child1),
    Child2.load(el.props.child2),
  ]);
}

function show(el) {
  let props = el.props;
  el.innerHTML = Mustache.render(props.html, props);
  el.querySelector("#child1").replaceWith(el.props.child1);
  el.querySelector("#child2").replaceWith(el.props.child2);
}

export default { el };
```

## Comparison with Popular Frontend Frameworks

Ctrl.js takes a different approach compared to comprehensive frontend frameworks like React, Vue, and Svelte:

### Ctrl.js vs. React/Vue/Svelte

| Feature | Ctrl.js | React/Vue/Svelte |
|---------|---------|------------------|
| **Purpose** | Intuitive control logic organization | Comprehensive UI application framework |
| **Size** | Tiny footprint (~2KB) | Larger runtime (35KB-100KB+) |
| **Learning Curve** | Minimal, works with standard DOM | Steeper, framework-specific concepts |
| **State Management** | Manual / integrable with external libraries | Built-in reactive state management |
| **Rendering Model** | Direct DOM manipulation, integrable with template libraries | Virtual DOM or compilation-based |
| **Component Model** | Function based with lifecycle hooks and events | Component classes/functions with templates |
| **Build Requirements** | None, works with plain JS | Often requires build tools |
| **Architecture** | Composable with other specialized libraries | Opinionated, all-in-one solutions |

### Composable Architecture

Ctrl.js functions as part of a composable frontend architecture. Unlike monolithic frameworks that provide opinions on every aspect of application development, Ctrl.js focuses exclusively on component lifecycle management and event handling, allowing you to:

- Pair it with specialized state management libraries
- Use dedicated routing solutions
- Add form validation, data fetching, or other utilities as needed

This "pick the best tool for each job" approach can lead to more flexible, maintainable applications where each part of the system excels at its specific task. It also enables incremental adoption and easier migration paths compared to all-or-nothing framework decisions.

## Reasons to Choose Ctrl.js

- You are disillusioned with framework abstractions, complexities, and lock-in.
- You are building an application that might outlive current framework trends.
- You are looking for a lightweight, declarative method of managing your control logic.

## Reasons Not to Choose Ctrl.js

- You want an all-in-one, batteries-included framework.
- You need to use libraries or tools only available in a specific framework's ecosystem.
- Your team's skills are limited to a specific framework.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
