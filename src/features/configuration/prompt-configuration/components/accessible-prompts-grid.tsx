import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  fetchAccessiblePromptsByTypes,
  setAccessiblePromptsPage,
  setAccessiblePromptsItemsPerPage,
} from '@/store/slices/prompt-configuration-slice';
import type { SystemPrompt } from '@/store/slices/prompt-configuration-slice';
import type { AppDispatch, RootState } from '@/store';

interface AccessiblePromptsGridProps {
  promptTypes: string;
  onSelectPrompt: (prompt: SystemPrompt) => void;
}

const AccessiblePromptsGrid: React.FC<AccessiblePromptsGridProps> = ({
  promptTypes,
  onSelectPrompt,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { accessiblePrompts } = useSelector(
    (state: RootState) => state.promptConfiguration
  );

  const { prompts, loading, error, currentPage, itemsPerPage } =
    accessiblePrompts;

  // Fetch accessible prompts when component mounts or when promptTypes change
  useEffect(() => {
    if (promptTypes) {
      dispatch(
        fetchAccessiblePromptsByTypes({
          promptTypes,
          page: currentPage,
          itemsPerPage,
        })
      );
    }
  }, [promptTypes, currentPage, itemsPerPage, dispatch]);

  const handleItemsPerPageChange = (value: string) => {
    dispatch(setAccessiblePromptsItemsPerPage(Number(value)));
    dispatch(setAccessiblePromptsPage(1));
    // Fetch new data after updating pagination
    dispatch(
      fetchAccessiblePromptsByTypes({
        promptTypes,
        page: 1,
        itemsPerPage: Number(value),
      })
    );
  };

  const handleNextPage = () => {
    const nextPage = currentPage + 1;
    dispatch(setAccessiblePromptsPage(nextPage));
    dispatch(
      fetchAccessiblePromptsByTypes({
        promptTypes,
        page: nextPage,
        itemsPerPage,
      })
    );
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const prevPage = currentPage - 1;
      dispatch(setAccessiblePromptsPage(prevPage));
      dispatch(
        fetchAccessiblePromptsByTypes({
          promptTypes,
          page: prevPage,
          itemsPerPage,
        })
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-md text-red-800 text-sm">
        <strong>Error:</strong> {error}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No accessible prompts found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {prompts.map((prompt) => (
          <Card
            key={prompt.promptHash}
            className="cursor-pointer transition-all hover:shadow-lg hover:ring-2 hover:ring-primary"
            onClick={() => onSelectPrompt(prompt)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <CardTitle className="text-lg">{prompt.promptName}</CardTitle>
                  <CardDescription className="text-xs mt-1">
                    {prompt.promptHash.substring(0, 16)}...
                  </CardDescription>
                </div>
                <Badge variant="outline">{prompt.promptType}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {prompt.promptDescription && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-sm text-muted-foreground line-clamp-2 cursor-help">
                      {prompt.promptDescription}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs break-words">
                    {prompt.promptDescription}
                  </TooltipContent>
                </Tooltip>
              )}
              <div className="flex gap-2 flex-wrap">
                <Badge variant="secondary" className="text-xs">
                  {prompt.accessLevel}
                </Badge>
                {prompt.refPromptKey && (
                  <Badge variant="secondary" className="text-xs">
                    {prompt.refPromptKey}
                  </Badge>
                )}
                {prompt.userRoleCohortHash && (
                  <Badge variant="secondary" className="text-xs">
                    Cohort: {prompt.userRoleCohortHash.substring(0, 8)}...
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between gap-4 px-2 py-4 border-t mt-4">
        {/* Left: Items Per Page Dropdown */}
        <div className="flex items-center gap-2">
          <Select
            value={String(itemsPerPage)}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">Items per page</span>
        </div>

        {/* Right: Page Navigation */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage}
          </span>

          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevPage}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextPage}
            disabled={prompts.length < itemsPerPage}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AccessiblePromptsGrid;
