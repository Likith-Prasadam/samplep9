import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDown, Loader2, Search } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  fetchAccessiblePromptsByTypes,
  setAccessiblePromptsPage,
  setAccessiblePromptsItemsPerPage,
} from '@/store/slices/prompt-configuration-slice';
import type { SystemPrompt } from '@/store/slices/prompt-configuration-slice';
import type { AppDispatch, RootState } from '@/store';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PromptTypeSelectorProps {
  onSelectPrompt?: (prompt: SystemPrompt) => void;
  className?: string;
}

export const PromptTypeSelector: React.FC<PromptTypeSelectorProps> = ({
  onSelectPrompt,
  className = '',
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [open, setOpen] = useState(false);
  const [promptTypesInput, setPromptTypesInput] = useState('');
  const [itemsPerPageValue, setItemsPerPageValue] = useState('10');

  const { accessiblePrompts } = useSelector(
    (state: RootState) => state.promptConfiguration
  );

  const { prompts, loading, error, currentPage, itemsPerPage, total } =
    accessiblePrompts;

  const totalPages = Math.ceil(total / itemsPerPage);

  // Handle prompt types search
  const handleSearch = () => {
    if (promptTypesInput.trim()) {
      dispatch(
        fetchAccessiblePromptsByTypes({
          promptTypes: promptTypesInput,
          page: 1,
          itemsPerPage: Number(itemsPerPageValue),
        })
      );
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    if (currentPage < (totalPages || 1)) {
      const nextPage = currentPage + 1;
      dispatch(setAccessiblePromptsPage(nextPage));
      dispatch(
        fetchAccessiblePromptsByTypes({
          promptTypes: promptTypesInput,
          page: nextPage,
          itemsPerPage: Number(itemsPerPageValue),
        })
      );
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      dispatch(setAccessiblePromptsPage(prevPage));
      dispatch(
        fetchAccessiblePromptsByTypes({
          promptTypes: promptTypesInput,
          page: prevPage,
          itemsPerPage: Number(itemsPerPageValue),
        })
      );
    }
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPageValue(value);
    dispatch(setAccessiblePromptsItemsPerPage(Number(value)));
    dispatch(setAccessiblePromptsPage(1));
    dispatch(
      fetchAccessiblePromptsByTypes({
        promptTypes: promptTypesInput,
        page: 1,
        itemsPerPage: Number(value),
      })
    );
  };

  const handleSelectPrompt = (prompt: SystemPrompt) => {
    if (onSelectPrompt) {
      onSelectPrompt(prompt);
    }
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`bg-muted/25 group text-muted-foreground hover:bg-accent relative h-8 w-full flex-1 justify-start rounded-md text-sm font-normal shadow-none sm:w-40 sm:pe-12 md:flex-none lg:w-52 xl:w-64 ${className}`}
        >
          <Search
            aria-hidden="true"
            className="absolute start-1.5 top-1/2 -translate-y-1/2"
            size={16}
          />
          <span className="ms-4">Search prompts by type...</span>
          <ChevronDown
            className="bg-muted group-hover:bg-accent pointer-events-none absolute end-[0.3rem] top-1/2 -translate-y-1/2 h-4 w-4"
            aria-hidden="true"
          />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-150 p-0" align="start">
        <div className="flex flex-col p-4">
          {/* Search Input */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder="e.g., event_detection/_/system,event_detection/_/user"
              value={promptTypesInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPromptTypesInput(e.target.value)
              }
              onKeyDown={handleKeyDown}
              className="flex-1 text-sm"
            />
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={!promptTypesInput.trim() || loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Search'
              )}
            </Button>
          </div>

          {/* Items Per Page Selector */}
          <div className="mb-4 flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">
              Items per page:
            </span>
            <Select
              value={itemsPerPageValue}
              onValueChange={handleItemsPerPageChange}
            >
              <SelectTrigger className="w-20 h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Prompts List */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : prompts.length === 0 && promptTypesInput ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No prompts found for the given types.
            </div>
          ) : (
            <ScrollArea className="h-75 border rounded-md">
              <div className="p-4 space-y-2">
                {prompts.map((prompt: SystemPrompt) => (
                  <div
                    key={prompt.promptHash}
                    onClick={() => handleSelectPrompt(prompt)}
                    className="p-3 rounded-lg border cursor-pointer hover:bg-accent hover:border-primary transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {prompt.promptName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {prompt.promptType}
                        </p>
                        {prompt.promptDescription && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {prompt.promptDescription}
                          </p>
                        )}
                      </div>
                      <div className="shrink-0">
                        <Badge variant="secondary" className="text-xs">
                          {prompt.accessLevel}
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Pagination Controls */}
          {prompts.length > 0 && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t">
              <div className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages || 1}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={currentPage <= 1 || loading}
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleNextPage}
                  disabled={currentPage >= (totalPages || 1) || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default PromptTypeSelector;
