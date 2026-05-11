import React from 'react';

interface TimelineSelectorProps {
  selectedTime: number | null;
  onTimeSelect: (time: number) => void;
}

const TimelineSelector: React.FC<TimelineSelectorProps> = ({
  selectedTime,
  onTimeSelect,
}) => {
  const hoursOptions = [0.5, 1, 1.5, 2];

  return (
    <div className="p-3 border-b bg-muted/50 flex items-center justify-between">
      <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
        Chat for Last:
      </span>
      <div className="flex space-x-2">
        {hoursOptions.map((hour) => (
          <button
            key={hour}
            onClick={() => onTimeSelect(hour)}
            className={`px-2 py-2 rounded text-xs transition-colors ${
              selectedTime === hour
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/50'
            }`}
          >
            {hour}h
          </button>
        ))}
      </div>
    </div>
  );
};

export default TimelineSelector;
