/**
 * Polyfills for socket.io-client compatibility with React Native
 */

// Polyfill for setPrototypeOf (needed for socket.io error handling)
if (!Object.setPrototypeOf) {
  Object.setPrototypeOf = function (obj: any, proto: any) {
    obj.__proto__ = proto;
    return obj;
  };
}

// Declare global types for React Native environment
declare global {
  var global: typeof globalThis;
  // @ts-ignore - Avoid conflict with @types/node process declaration
  var process: any;
}

// Ensure global is defined
if (typeof (globalThis as any).global === 'undefined') {
  (globalThis as any).global = globalThis;
}

// Polyfill process.nextTick for socket.io
if (typeof (globalThis as any).process === 'undefined') {
  (globalThis as any).process = { nextTick: setImmediate };
} else if (!(globalThis as any).process.nextTick) {
  (globalThis as any).process.nextTick = setImmediate;
}

export {};
