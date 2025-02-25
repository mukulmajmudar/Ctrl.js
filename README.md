# Ctrl.js

A lightweight, declarative library for implementing control logic in the MVC (Model-View-Controller) paradigm. Ctrl.js manages DOM element lifecycles, provides sophisticated event delegation, and offers an intuitive API for creating event-driven web applications.

## Design Philosophy

In web-based user interfaces, the *view* is already modeled by the native JavaScript `HTMLElement` instance. Code that builds the view, maps data to/from it, and handles user interaction is functional *control logic* which operates on the `HTMLElement`. Ctrl.js gives you a way to define this control logic using simple callbacks and event listeners.

Unlike frameworks that introduce various abstraction layers over the DOM (virtual DOMs, component models, template compilers), Ctrl.js embraces the natural structure of web applications, providing a thin layer that organizes controller logic while leveraging the browser's native view system. This approach leads to minimal overhead and a programming model that aligns with how the web platform actually works.

Many popular frameworks create an abstraction layer that sits between developers and the web platform, introducing proprietary component models, template languages, and state management systems. This approach often leads to framework lock-in, where applications become deeply dependent on the framework's ecosystem, making migrations difficult and tying the application's lifespan to the framework's continued support and popularity.

Ctrl.js takes a fundamentally different approach by enhancing rather than replacing the web platform. It works directly with standard DOM elements and events, keeping your code closer to the platform and reducing dependency on external abstractions. This makes your application more portable, future-proof, and aligned with web standards evolution.

## Features

- **Declarative Element Creation**: Simple API to create and configure DOM elements
- **Automatic Lifecycle Management**: `show` and `hide` hooks for when elements are added to or removed from the DOM
- **Advanced Event Delegation**: Event bubbling and delegation across nested elements
- **Compact Footprint**: Lightweight solution with no dependencies

## Installation

```html
<script src="path/to/Ctrl.js"></script>
```

Or using AMD/RequireJS:

```javascript
define(['path/to/Ctrl'], function(Ctrl) {
  // Your code here
});
```

## Basic Usage

```javascript
// Import or require the library
const { el } = Ctrl;

// Create a button element with lifecycle hooks
const button = el({
  tag: 'button',
  id: 'my-button',
  classList: ['btn', 'btn-primary'],
  props: { counter: 0 },
  show: (element) => {
    // Render view based on current props
    element.textContent = `Clicked ${element.props.counter} times`;
  },
  hide: (element) => {
    console.log('Button removed from DOM');
  },
  eventListeners: {
    click: {
      '': (el, event) => {
        // Update the data
        el.props.counter++;
        // Call show to update the view
        show(el);
      }
    }
  }
});

// Add the button to the DOM
document.body.appendChild(button);
```

## API Documentation

### `el(options)`

Creates and configures a DOM element with lifecycle hooks and event handlers.

#### Parameters

| Option | Type | Description |
|--------|------|-------------|
| `tag` | String | The HTML tag name (default: 'div') |
| `id` | String | The element's ID attribute |
| `classList` | Array | List of CSS classes to add |
| `el` | Element | Existing element to configure (optional) |
| `props` | Object | Custom properties to attach to the element |
| `show` | Function | Callback when element is added to the DOM |
| `hide` | Function | Callback when element is removed from the DOM |
| `showOnResume` | Boolean | Whether to show the element when 'resume' event fires |
| `eventListeners` | Object | Event configuration (see below) |

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

## Event Propagation

Ctrl.js implements custom event propagation to support proper delegation. Both `event.stopPropagation()` and `event.stopImmediatePropagation()` work as expected within the delegation system.

## Examples

### Creating a Toggle Component

```javascript
const toggle = el({
  classList: ['toggle-container'],
  props: { active: false },
  show: (element) => {
    // Render based on current props
    element.innerHTML = `
      <div class="toggle-switch ${element.props.active ? 'active' : ''}"></div>
      <div class="toggle-label">Toggle me</div>
    `;
  },
  eventListeners: {
    click: {
      '': (el, event) => {
        // Update data
        el.props.active = !el.props.active;
        // Call show to re-render with updated props
        show(el);
      }
    }
  }
});

document.querySelector('#app').appendChild(toggle);
```

### Modal with Event Delegation

```javascript
const modal = el({
  classList: ['modal'],
  show: (element) => {
    element.innerHTML = `
      <div class="modal-backdrop"></div>
      <div class="modal-content">
        <button class="close-btn">×</button>
        <h2>Modal Title</h2>
        <p>Modal content goes here...</p>
        <button class="confirm-btn">Confirm</button>
      </div>
    `;
  },
  eventListeners: {
    click: {
      '.close-btn': (el, event) => {
        document.body.removeChild(el);
      },
      '.confirm-btn': (el, event) => {
        console.log('Confirmed!');
        document.body.removeChild(el);
      },
      '.modal-backdrop': (el, event) => {
        document.body.removeChild(el);
      }
    }
  }
});

document.body.appendChild(modal);
```

## Comparison with Popular Frontend Frameworks

Ctrl.js takes a different approach compared to comprehensive frontend frameworks like React, Vue, and Svelte:

### Ctrl.js vs. React/Vue/Svelte

| Feature | Ctrl.js | React/Vue/Svelte |
|---------|---------|------------------|
| **Purpose** | Lightweight controller logic | Complete UI rendering framework |
| **Size** | Tiny footprint (~2KB) | Larger runtime (35KB-100KB+) |
| **Learning Curve** | Minimal, works with standard DOM | Steeper, framework-specific concepts |
| **State Management** | Manual / integrable with external libraries | Built-in reactive state management |
| **Rendering Model** | Direct DOM manipulation | Virtual DOM or compilation-based |
| **Component Model** | Function-based element factories | Component classes/functions with templates |
| **Build Requirements** | None, works with plain JS | Often requires build tools |
| **Architecture** | Composable with specialized libraries | Opinionated, all-in-one solutions |

### Composable Architecture

One of Ctrl.js's key advantages is its ability to function as part of a composable frontend architecture. Unlike monolithic frameworks that provide opinions on every aspect of application development, Ctrl.js focuses exclusively on DOM manipulation and event handling, allowing you to:

- Pair it with specialized state management libraries (Redux, MobX, Zustand)
- Use dedicated routing solutions (page.js, navigo)
- Add form validation, data fetching, or other utilities as needed

This "pick the best tool for each job" approach can lead to more flexible, maintainable applications where each part of the system excels at its specific task. It also enables incremental adoption and easier migration paths compared to all-or-nothing framework decisions.

### Integration Example with State Management

```javascript
// Component that integrates with a state management library
const counterComponent = el({
  tag: 'div',
  classList: ['counter-container'],
  props: { count: 0 },
  show: (element) => {
    // Render based on current props
    element.innerHTML = `
      <button class="decrement">-</button>
      <span class="count">${element.props.count}</span>
      <button class="increment">+</button>
    `;
  },
  hide: (element) => {
    // Clean up subscription when element is removed
    if (element.props.unsubscribe) {
      element.props.unsubscribe();
    }
  },
  eventListeners: {
    click: {
      '.increment': (el, event) => {
        store.dispatch({ type: 'INCREMENT' });
      },
      '.decrement': (el, event) => {
        store.dispatch({ type: 'DECREMENT' });
      }
    }
  }
});

// Set up store subscription after creating the component
const unsubscribe = store.subscribe(() => {
  const state = store.getState();
  // Update component props from store
  counterComponent.props.count = state.count;
  // Call show to re-render with updated props
  show(counterComponent);
});

// Store unsubscribe function for cleanup
counterComponent.props.unsubscribe = unsubscribe;

document.querySelector('#app').appendChild(counterComponent);
```

### When to Choose Ctrl.js

- **New applications** that benefit from a lightweight, standards-based approach
- **Composable architectures** that combine Ctrl.js for DOM interaction with specialized libraries for state management, routing, and other concerns
- **Large-scale applications** that benefit from a modular approach with clear separation of concerns
- **Performance-sensitive contexts** where minimal bundle size and runtime overhead are critical
- **Projects valuing web standards** and avoiding framework-specific abstractions
- **Applications requiring longevity** that might outlive current framework trends
- **Enhancing existing web applications** without rewriting everything
- **Server-rendered applications** needing progressive enhancement
- **Environments with limited resources** like embedded systems or legacy browsers

### When to Choose React/Vue/Svelte

- Projects requiring **an integrated, all-in-one solution** with a consistent programming model
- Teams preferring **standardized patterns** across all aspects of frontend development
- Applications needing **extensive ecosystem support** with pre-built solutions for common problems
- UIs with **frequent updates** that benefit from optimized rendering
- Projects where the **benefits of framework conventions** outweigh the flexibility of choosing specialized tools
- Teams already invested in the **ecosystem** of these frameworks
- Scenarios where **developer experience features** like hot reloading, time-travel debugging, etc. are high priorities

Ctrl.js can be a good choice when you want to add controlled interactivity without the overhead and complexity of a full frontend framework. It follows the principle of "use only what you need" and can be particularly valuable for incremental enhancement of existing sites.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE)
