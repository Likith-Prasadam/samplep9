import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import type { PromptCategory, AccessLevel } from '@/types/workflow-types';

interface PromptFiltersProps {
  selectedCategories: PromptCategory[];
  onCategoriesChange: (categories: PromptCategory[]) => void;
  selectedAccessLevel?: AccessLevel;
  onAccessLevelChange: (level?: AccessLevel) => void;
}

const categories: { value: PromptCategory; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'user', label: 'User' },
  { value: 'events_list', label: 'Events List' },
];

const accessLevels: { value: AccessLevel; label: string }[] = [
  { value: 'public', label: 'Public' },
  { value: 'organization', label: 'Organization' },
  { value: 'private', label: 'Private' },
];

export function PromptFilters({
  selectedCategories,
  onCategoriesChange,
  selectedAccessLevel,
  onAccessLevelChange,
}: PromptFiltersProps) {
  const toggleCategory = (category: PromptCategory) => {
    if (selectedCategories.includes(category)) {
      onCategoriesChange(selectedCategories.filter((c) => c !== category));
    } else {
      onCategoriesChange([...selectedCategories, category]);
    }
  };

  const hasActiveFilters = selectedCategories.length > 0 || selectedAccessLevel;

  const clearFilters = () => {
    onCategoriesChange([]);
    onAccessLevelChange(undefined);
  };

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3">
      <span className="text-sm font-medium text-muted-foreground">
        Filters:
      </span>

      {/* Category Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Category:</span>
        {categories.map((cat) => (
          <Badge
            key={cat.value}
            variant={
              selectedCategories.includes(cat.value) ? 'default' : 'outline'
            }
            className="cursor-pointer"
            onClick={() => toggleCategory(cat.value)}
          >
            {cat.label}
          </Badge>
        ))}
      </div>

      {/* Access Level Filters */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Access:</span>
        {accessLevels.map((level) => (
          <Badge
            key={level.value}
            variant={
              selectedAccessLevel === level.value ? 'default' : 'outline'
            }
            className="cursor-pointer"
            onClick={() =>
              onAccessLevelChange(
                selectedAccessLevel === level.value ? undefined : level.value
              )
            }
          >
            {level.label}
          </Badge>
        ))}
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-7 px-2 text-xs"
        >
          <X className="h-3 w-3 mr-1" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
