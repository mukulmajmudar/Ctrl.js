let observedElements = [];
let observer;

function init() {
  observer = new MutationObserver(processMutations);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function processMutations() {
  // Filter garbage collected elements from observed list
  observedElements = observedElements.filter(([elementRef]) =>
    elementRef.deref(),
  );

  // Call show() for newly added nodes
  observedElements
    .filter(([elementRef, _show, _hide]) => {
      let el = elementRef.deref();
      return document.body.contains(el) && el.props?.shown === false;
    })
    .forEach(([elementRef, show, _hide]) => show(elementRef.deref()));

  // Call hide() for newly removed nodes
  observedElements
    .filter(([elementRef, _show, _hide]) => {
      let el = elementRef.deref();
      return !document.body.contains(el) && el.props?.shown;
    })
    .forEach(([elementRef, _show, hide]) => hide(elementRef.deref()));
}

function cleanup() {
  if (observer) {
    let mutations = observer.takeRecords();
    if (mutations.length > 0) processMutations();
    observer.disconnect();
  }
}

function mutationsContainElement(mutations, mutationProperty, element) {
  let allNodes = mutations.flatMap((mutation) =>
    Array.from(mutation[mutationProperty]),
  );

  // Check if any added node matches the element,
  // or if any descendant of any of the added nodes matches.
  // Descendants have to be checked because only direct
  // node additions are considered mutations. Even
  // if the node is not the element itself, it
  // might have a descendant that is the element but
  // for which the mutation will never occur.
  return (
    allNodes.some((node) => node === element) ||
    allNodes
      .filter((node) => node.querySelectorAll)
      .flatMap((node) => node.querySelectorAll("*"))
      .some((nodeDescendant) => nodeDescendant === element)
  );
}

function el({
  classList = [],
  el,
  eventListeners = {},
  hide = () => {},
  id,
  loadingSpinner = {
    show: () => {},
    hide: () => {},
  },
  props = {},
  load = async (_el) => Promise.resolve(),
  show,
  showOnResume = false,
  style = {},
  tag = "div",
  unload = async (_el) => Promise.resolve(),
}) {
  el = element(el, id, tag);
  el.props = props = {
    ...props,
    loaded: false,
    loading: false,
    shown: false,
    showPending: false,
    hidePending: false,
  };
  for (let cls of classList) el.classList.add(cls);
  el.load = makeLoad(load, loadingSpinner);
  el.show = makeShow(show, el.load);
  eventListeners = {
    ...eventListeners,
  };
  addEventListeners(el, eventListeners);
  observedElements.push([
    new WeakRef(el),
    el.show,
    makeHide(hide, unload, loadingSpinner),
  ]);
  if (document.body.contains(el)) {
    el.show(el);
  } else {
    el.props.shown = false;
  }
  setupShowOnResume(el, showOnResume, el.show);
  Object.assign(el.style, style);
  return el;
}

function makeLoad(load, loadingSpinner) {
  return async function (el, options) {
    if (el.props.loading) return;
    loadingSpinner.show();
    try {
      if (!el.props.loaded || options?.reload) {
        el.props.loading = true;
        try {
          el.dispatchEvent(new CustomEvent("loading"));
          await load(el);
          el.props.loaded = true;
          el.dispatchEvent(new CustomEvent("loaded"));
        } finally {
          el.props.loading = false;
        }
      }
    } catch (e) {
      el.dispatchEvent(new CustomEvent("loadError", { detail: e }));
      throw e;
    } finally {
      loadingSpinner.hide();
    }
  };
}

function makeShow(show, load) {
  return async function (el, options) {
    if (el.props.showPending) return;
    el.props.showPending = true;
    el.dispatchEvent(new CustomEvent("showing"));
    try {
      await load(el, options);
      await show(el);
      el.props.shown = true;
      el.props.showPending = false;
      el.dispatchEvent(new CustomEvent("shown"));
    } catch (e) {
      el.dispatchEvent(new CustomEvent("showError", { detail: e }));
      throw e;
    }
  };
}

function element(el, id, tag) {
  if (!el) {
    el = document.createElement(tag);
  }
  if (id) {
    el.id = id;
  }
  return el;
}

function addEventListeners(el, eventListeners) {
  for (let [eventName, actualListener] of Object.entries(
    actualEventListeners(el, eventListeners),
  )) {
    el.addEventListener(eventName, actualListener);
  }
}

function actualEventListeners(el, eventListeners) {
  return Object.fromEntries(
    Object.entries(eventListeners).map(([eventName, eventListenerGroup]) => [
      eventName,
      actualEventListener(el, eventListenerGroup),
    ]),
  );
}

function actualEventListener(el, eventListeners) {
  return async function (event) {
    // Make a list of non-empty selectors to process:
    // To support event delegation with potentially nested delegators
    // we have to process in order of innermost to outermost.
    let selectors = Object.keys(eventListeners);
    let processViewElEvent = selectors.includes("");
    selectors = selectors.filter((s) => s !== "");

    // Store references to the original stop propagation functions
    let origStopPropagation = event.stopPropagation.bind(event);
    let origStopImmPropagation = event.stopImmediatePropagation.bind(event);

    let stopProcessing = false;

    // Overwrite stop propagation methods: since we are handling
    // the bubbling manually, these methods have to be customized.
    Object.assign(event, {
      stopPropagation: function () {
        // Call original stopPropagation()
        origStopPropagation();

        // Stop processing all other selectors
        stopProcessing = true;
      },
      stopImmediatePropagation: function () {
        // Call original stopImmediatePropagation()
        origStopImmPropagation();

        // Stop processing all other selectors
        stopProcessing = true;
      },
    });

    // 1. Map selectors to closest corresponding ancestors from event target element.
    // 2. Filter non-null elements (remove non-ancestors).
    // 3. Sort by distance from event target element.
    let selectorsAndDelegatorTargets = selectors
      .map((selector) => [selector, event.target.closest(selector)])
      .filter(([_selector, element]) => element !== null)
      .toSorted(
        ([_selectorA, elementA], [_selectorB, elementB]) =>
          distance(event.target, elementA) - distance(event.target, elementB),
      );

    if (processViewElEvent) selectorsAndDelegatorTargets.push(["", el]);

    for (let [selector, delegatorTarget] of selectorsAndDelegatorTargets) {
      if (stopProcessing) break; // Stop propagation method called by some event listener
      event.delegatorTarget = delegatorTarget;
      await eventListeners[selector](el, event);
    }
  };
}

function distance(element, ancestor, d = 0) {
  return element === ancestor
    ? d
    : distance(element.parentElement, ancestor, d + 1);
}

function setupShowOnResume(el, showOnResume) {
  if (showOnResume) {
    removeOnResumeListener(el);
    let onResume = (el.props._ctrlOnResume = () => show(el));
    document.addEventListener("resume", onResume, false);
  }
}

function removeOnResumeListener(el) {
  if (el.props._ctrlOnResume) {
    document.removeEventListener("resume", el.props._ctrlOnResume, false);
  }
}

function makeHide(hide, unload, loadingSpinner) {
  return async function (el) {
    if (!el.props.shown) return;
    if (el.props.hidePending) return;
    el.props.hidePending = true;
    loadingSpinner.show();
    try {
      await unload();
      Promise.resolve(hide(el)).then(() => {
        el.props.shown = false;
        el.props.hidePending = false;
        el.dispatchEvent(new CustomEvent("hidden"));
      });
      removeOnResumeListener(el);
    } catch (e) {
      el.dispatchEvent(new CustomEvent("hideError", { detail: e }));
      throw e;
    } finally {
      loadingSpinner.hide();
    }
  };
}

function load(el, { reload = false } = { reload: false }) {
  el.load(el, { reload });
}

function show(el, { reload = false } = { reload: false }) {
  // We queue the show() operation so that this can be called from event handlers
  // where other delegated event handlers also exist. Otherwise, there
  // can be the case where Ctrl.show() from within an event handler removes
  // the event.target from the DOM and then delegated event handlers are not called.
  setTimeout(() => el.show(el, { reload }), 0);
}

export default {
  init,
  cleanup,
  el,
  load,
  show,
};
