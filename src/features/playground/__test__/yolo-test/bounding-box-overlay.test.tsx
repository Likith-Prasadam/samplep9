import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import type { NormalizedDetection } from '../../utils/bounding-box-normalizer';

vi.mock('react-konva', async () => {
  const React = await import('react');

  const createMock =
    (name: string) =>
    ({ children, ...props }: { children?: ReactNode }) =>
      React.createElement(
        'div',
        {
          'data-testid': name,
          'data-props': JSON.stringify(props),
        },
        children
      );

  return {
    Stage: createMock('Stage'),
    Layer: createMock('Layer'),
    Group: createMock('Group'),
    Rect: createMock('Rect'),
    Text: createMock('Text'),
  };
});

import { BoundingBoxOverlay } from '../../components/bounding-box-overlay';

const setThemeVars = () => {
  const style = document.documentElement.style;

  style.setProperty('--primary', 'rgb(14, 165, 233)');
  style.setProperty('--chart-1', 'rgb(34, 197, 94)');
  style.setProperty('--chart-2', 'rgb(59, 130, 246)');
  style.setProperty('--chart-3', 'rgb(148, 163, 184)');
  style.setProperty('--chart-5', 'rgb(120, 113, 108)');
  style.setProperty('--success', 'rgb(22, 163, 74)');
  style.setProperty('--destructive', 'rgb(239, 68, 68)');
  style.setProperty('--popover-foreground', 'rgb(255, 255, 255)');
};

const palette = [
  'rgb(14, 165, 233)',
  'rgb(59, 130, 246)',
  'rgb(34, 197, 94)',
  'rgb(148, 163, 184)',
  'rgb(120, 113, 108)',
  'rgb(22, 163, 74)',
  'rgb(239, 68, 68)',
];

const colorForClass = (className: string) => {
  let hash = 0;

  for (let index = 0; index < className.length; index += 1) {
    hash = className.charCodeAt(index) + ((hash << 5) - hash);
  }

  return palette[Math.abs(hash) % palette.length];
};

const parseProps = (element: HTMLElement) =>
  JSON.parse(element.getAttribute('data-props') ?? '{}') as Record<
    string,
    unknown
  >;

describe('BoundingBoxOverlay', () => {
  beforeEach(() => {
    setThemeVars();
  });

  afterEach(() => {
    cleanup();
    document.documentElement.style.cssText = '';
    vi.clearAllMocks();
  });

  it('renders nothing when the render dimensions are invalid', () => {
    const { container } = render(
      <BoundingBoxOverlay
        renderWidth={0}
        renderHeight={0}
        offsetX={0}
        offsetY={0}
        detections={[]}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('renders a theme-colored bounding box with vertically stacked PPE labels', () => {
    const detection: NormalizedDetection = {
      id: 'frame-0-0-person-42',
      frameId: 0,
      timestampMs: 0,
      className: 'person',
      confidence: 0.96,
      trackId: '42',
      displayLabel: 'Helmet: yes, Vest: no',
      ppeStatus: {
        helmet: true,
        vest: false,
      },
      bbox: {
        x: 0.25,
        y: 0.25,
        width: 0.5,
        height: 0.5,
      },
    };

    render(
      <BoundingBoxOverlay
        renderWidth={400}
        renderHeight={200}
        offsetX={10}
        offsetY={12}
        detections={[detection]}
      />
    );

    const rects = screen.getAllByTestId('Rect');
    expect(rects).toHaveLength(2);

    const bboxRect = parseProps(rects[0]);
    const labelRect = parseProps(rects[1]);
    const expectedStroke = colorForClass('person');

    expect(bboxRect).toMatchObject({
      x: 100,
      y: 50,
      width: 200,
      height: 100,
      fillEnabled: false,
      stroke: expectedStroke,
      strokeWidth: 2,
    });
    expect(labelRect).toMatchObject({
      x: 100,
      fill: expectedStroke,
      opacity: 0.45,
    });

    const texts = screen.getAllByTestId('Text');
    expect(texts).toHaveLength(2);

    const [firstLine, secondLine] = texts.map(parseProps);
    expect(firstLine).toMatchObject({
      text: 'Helmet: yes',
      fill: 'rgb(22, 163, 74)',
      x: 106,
    });
    expect(secondLine).toMatchObject({
      text: 'Vest: no',
      fill: 'rgb(239, 68, 68)',
      x: 106,
    });
    expect((secondLine.y as number) > (firstLine.y as number)).toBe(true);
  });

  it('uses the label background transparency without dimming the bbox stroke', () => {
    const detection: NormalizedDetection = {
      id: 'frame-0-0-vehicle-1',
      frameId: 0,
      timestampMs: 0,
      className: 'vehicle',
      confidence: 0.8,
      trackId: '1',
      bbox: {
        x: 0.1,
        y: 0.1,
        width: 0.2,
        height: 0.2,
      },
    };

    render(
      <BoundingBoxOverlay
        renderWidth={500}
        renderHeight={300}
        offsetX={0}
        offsetY={0}
        detections={[detection]}
      />
    );

    const rects = screen.getAllByTestId('Rect');
    const bboxRect = parseProps(rects[0]);
    const labelRect = parseProps(rects[1]);

    expect(bboxRect.opacity).toBe(0.95);
    expect(labelRect.opacity).toBe(0.45);
    expect(bboxRect.stroke).toBe(colorForClass('vehicle'));
    expect(labelRect.fill).toBe(colorForClass('vehicle'));
  });
});
