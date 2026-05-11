import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, History, GitFork, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { PromptTemplate } from '@/types/workflow-types';

interface PromptListTableProps {
  prompts: PromptTemplate[];
  loading: boolean;
  onViewVersions: (prompt: PromptTemplate) => void;
  onFork: (prompt: PromptTemplate) => void;
  onDelete: (prompt: PromptTemplate) => void;
}

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'system':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'user':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'events_list':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const getAccessLevelColor = (level: string) => {
  switch (level) {
    case 'public':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'organization':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'private':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

export function PromptListTable({
  prompts,
  loading,
  onViewVersions,
  onFork,
  onDelete,
}: PromptListTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading prompts...</div>
      </div>
    );
  }

  if (prompts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border border-dashed rounded-lg">
        <p className="text-muted-foreground mb-2">No prompts found</p>
        <p className="text-sm text-muted-foreground">
          Create your first prompt template to get started
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Prompt Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Access Level</TableHead>
            <TableHead>Latest Version</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead>Last Updated</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {prompts.map((prompt) => (
            <TableRow key={prompt.ref_prompt_key}>
              <TableCell className="font-medium">
                {prompt.prompt_name}
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getCategoryColor(prompt.prompt_category)}
                >
                  {prompt.prompt_category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={getAccessLevelColor(prompt.access_level)}
                >
                  {prompt.access_level}
                </Badge>
              </TableCell>
              <TableCell>
                {prompt.latest_version ? (
                  <span className="text-sm">
                    v{prompt.latest_version.version_number}
                  </span>
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {prompt.created_by}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(prompt.updated_at), {
                  addSuffix: true,
                })}
              </TableCell>
              <TableCell>
                {prompt.is_active ? (
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/20"
                  >
                    Active
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-gray-500/10 text-gray-500 border-gray-500/20"
                  >
                    Inactive
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onViewVersions(prompt)}>
                      <History className="mr-2 h-4 w-4" />
                      View Versions
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onFork(prompt)}>
                      <GitFork className="mr-2 h-4 w-4" />
                      Fork Prompt
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => onDelete(prompt)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
