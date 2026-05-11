import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { DetectionFilters } from '../../components/detection-filters';

vi.mock('@/components/ui/slider', () => ({
  Slider: ({
    value,
    onValueChange,
  }: {
    value: number[];
    onValueChange: (value: number[]) => void;
  }) => (
    <input
      aria-label="Confidence Threshold Slider"
      type="range"
      min={0}
      max={100}
      value={value[0] ?? 0}
      onChange={(event) => onValueChange([Number(event.target.value)])}
    />
  ),
}));

vi.mock('@/components/ui/switch', () => ({
  Switch: ({
    checked,
    onCheckedChange,
    id,
  }: {
    checked: boolean;
    onCheckedChange?: (checked: boolean) => void;
    id?: string;
  }) => (
    <input
      id={id}
      aria-label="Show Track IDs"
      role="switch"
      type="checkbox"
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
    />
  ),
}));

describe('DetectionFilters', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders the confidence slider, class chips, and track-id toggle', () => {
    render(
      <DetectionFilters
        classes={['person', 'hard_hat']}
        selectedClasses={['person']}
        confidenceThreshold={0.6}
        showTrackIds
        onChangeClasses={vi.fn()}
        onChangeConfidence={vi.fn()}
        onChangeShowTrackIds={vi.fn()}
      />
    );

    expect(screen.getByText('Confidence Threshold')).toBeInTheDocument();
    expect(screen.getByText('60%')).toBeInTheDocument();
    expect(screen.getByText('Show Object IDs')).toBeInTheDocument();
    expect(screen.getByText('person')).toBeInTheDocument();
    expect(screen.getByText('hard hat')).toBeInTheDocument();
  });

  it('toggles selected classes through the class chips', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [selectedClasses, setSelectedClasses] = React.useState<string[]>([
        'person',
      ]);
      return (
        <DetectionFilters
          classes={['person', 'helmet']}
          selectedClasses={selectedClasses}
          confidenceThreshold={0.5}
          onChangeClasses={setSelectedClasses}
          onChangeConfidence={vi.fn()}
        />
      );
    }

    render(<Harness />);

    await user.click(screen.getByText('helmet'));
    expect(
      screen.getByRole('button', { name: /Hide helmet detections/ })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Hide person detections/ })
    );
    expect(
      screen.getByRole('button', { name: /Show person detections/ })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Hide helmet detections/ })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: /Hide helmet detections/ })
    );
    expect(
      screen.getByRole('button', { name: /Show helmet detections/ })
    ).toBeInTheDocument();
  });

  it('calls confidence and track-id callbacks when the controls change', async () => {
    const user = userEvent.setup();
    const onChangeConfidence = vi.fn();
    const onChangeShowTrackIds = vi.fn();

    render(
      <DetectionFilters
        classes={['person']}
        selectedClasses={['person']}
        confidenceThreshold={0.5}
        showTrackIds={false}
        onChangeClasses={vi.fn()}
        onChangeConfidence={onChangeConfidence}
        onChangeShowTrackIds={onChangeShowTrackIds}
      />
    );

    const slider = screen.getByRole('slider');
    fireEvent.change(slider, { target: { value: '55' } });
    expect(onChangeConfidence).toHaveBeenLastCalledWith(0.55);

    await user.click(screen.getByLabelText('Show Track IDs'));
    expect(onChangeShowTrackIds).toHaveBeenCalledWith(true);
  });
});
