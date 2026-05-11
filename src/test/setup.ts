import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Mock ResizeObserver as a constructable class (Floating UI expects `new ResizeObserver()`)
class ResizeObserverMock {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(callback?: any) {
    this.callback = callback;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  callback: any;

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const globalWithResize = globalThis as unknown as {
  ResizeObserver?: typeof ResizeObserver;
};

if (!globalWithResize.ResizeObserver) {
  globalWithResize.ResizeObserver =
    ResizeObserverMock as unknown as typeof ResizeObserver;
  (
    window as typeof globalThis & { ResizeObserver?: typeof ResizeObserver }
  ).ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver;
}

const elementProto = Element.prototype as unknown as {
  hasPointerCapture?: (pointerId: number) => boolean;
  setPointerCapture?: (pointerId: number) => void;
  releasePointerCapture?: (pointerId: number) => void;
  scrollIntoView?: () => void;
};

// Polyfill pointer capture APIs used by Radix Select
if (!elementProto.hasPointerCapture) {
  elementProto.hasPointerCapture = vi.fn(() => false);
}
if (!elementProto.setPointerCapture) {
  elementProto.setPointerCapture = vi.fn();
}
if (!elementProto.releasePointerCapture) {
  elementProto.releasePointerCapture = vi.fn();
}

// Provide PointerEvent for userEvent pointer interactions
if (
  !(window as typeof globalThis & { PointerEvent?: typeof PointerEvent })
    .PointerEvent
) {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    width: number;
    height: number;
    pressure: number;
    tangentialPressure: number;
    tiltX: number;
    tiltY: number;
    twist: number;
    pointerType: string;
    isPrimary: boolean;
    altitudeAngle: number;
    azimuthAngle: number;

    constructor(type: string, eventInitDict: PointerEventInit = {}) {
      super(type, eventInitDict);
      this.pointerId = eventInitDict.pointerId ?? 0;
      this.width = eventInitDict.width ?? 0;
      this.height = eventInitDict.height ?? 0;
      this.pressure = eventInitDict.pressure ?? 0;
      this.tangentialPressure = eventInitDict.tangentialPressure ?? 0;
      this.tiltX = eventInitDict.tiltX ?? 0;
      this.tiltY = eventInitDict.tiltY ?? 0;
      this.twist = eventInitDict.twist ?? 0;
      this.pointerType = eventInitDict.pointerType ?? 'mouse';
      this.isPrimary = eventInitDict.isPrimary ?? true;
      this.altitudeAngle = 0;
      this.azimuthAngle = 0;
    }
  }

  (
    window as typeof globalThis & { PointerEvent?: typeof PointerEvent }
  ).PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

// Polyfill scrollIntoView used by Radix floating lists
if (!elementProto.scrollIntoView) {
  elementProto.scrollIntoView = vi.fn();
}

afterEach(() => {
  cleanup();
});
