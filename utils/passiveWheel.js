// Make 'wheel' listeners on window/document passive by default to avoid scroll-blocking warnings.
// This does NOT touch element-level listeners to reduce risk of breaking component behavior.
// Ref: https://www.chromestatus.com/feature/5745543795965952

function normalizeOptions(options) {
  // boolean -> { capture: boolean, passive: true }
  if (typeof options === 'boolean') {
    return { capture: options, passive: true };
  }
  // object -> add passive if not provided
  if (options == null) {
    return { passive: true };
  }
  if (!Object.prototype.hasOwnProperty.call(options, 'passive')) {
    return { ...options, passive: true };
  }
  return options;
}

function patchTargetAddEventListener(target) {
  if (!target || !target.addEventListener) return;
  const original = target.addEventListener.bind(target);
  target.addEventListener = function (type, listener, options) {
    try {
      if (type === 'wheel') {
        options = normalizeOptions(options);
      }
    } catch (_) {
      // keep original options in case of any errors
    }
    return original(type, listener, options);
  };
}

// Only patch browser environments
if (typeof window !== 'undefined') {
  patchTargetAddEventListener(window);
}
if (typeof document !== 'undefined') {
  patchTargetAddEventListener(document);
}

export {}; // ensure module scope