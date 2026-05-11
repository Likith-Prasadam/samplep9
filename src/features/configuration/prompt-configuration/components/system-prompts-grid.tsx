import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trash2 } from 'lucide-react';
import type { SystemPrompt } from '@/store/slices/prompt-configuration-slice';

interface SystemPromptsGridProps {
  prompts: SystemPrompt[];
  selectedPromptHash?: string;
  onSelectPrompt: (promptHash: string) => void;
  onDeletePrompt?: (prompt: SystemPrompt) => void;
  loading?: boolean;
}

const SystemPromptsGrid: React.FC<SystemPromptsGridProps> = ({
  prompts,
  selectedPromptHash,
  onSelectPrompt,
  onDeletePrompt,
  loading = false,
}) => {
  const [itemsPerPage] = useState(10);
  const [currentPage] = useState(1);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedPrompts = prompts.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 bg-muted rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No system prompts available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedPrompts.map((prompt) => (
          <Card
            key={prompt.promptHash}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedPromptHash === prompt.promptHash
                ? 'ring-2 ring-primary'
                : ''
            }`}
            onClick={() => onSelectPrompt(prompt.promptHash)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{prompt.promptName}</CardTitle>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="outline" className="text-xs">
                      {prompt.promptType}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeletePrompt?.(prompt);
                  }}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Delete this prompt"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
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
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination Controls */}
      {/* <div className="flex items-center justify-between gap-4 px-2 py-4 border-t mt-4">
        {/* Left: Items Per Page Dropdown */}
      {/* <div className="flex items-center gap-2">
          <Select value={String(itemsPerPage)} onValueChange={handleItemsPerPageChange}>
            <SelectTrigger className="w-[80px]">
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
          <span className="text-sm text-muted-foreground">Rows per page</span>
        </div>

        {/* Right: Page Navigation */}
      {/* <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Page {currentPage} of {totalPages}
          </span>

          {/* First Page Button */}
      {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <span className="text-xs">«</span>
          </Button>

          {/* Previous Button */}
      {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Page Numbers */}
      {/* <div className="flex gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={page === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(page)}
                className="h-8 min-w-8 px-2"
              >
                {page}
              </Button>
            ))}
          </div>

          {/* Next Button */}
      {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Last Page Button */}
      {/* <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="h-8 w-8 p-0"
          >
            <span className="text-xs">»</span>
          </Button>
        </div>
      </div> */}
    </div>
  );
};

export default React.memo(SystemPromptsGrid);
