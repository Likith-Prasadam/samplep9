import { format } from 'date-fns';
import { Building2, Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import type { OrgCohort } from '@/types/org-cohort-types';

type OrgCohortsListTableProps = {
  data: OrgCohort[];
  isRootAdmin: boolean;
  safePage: number;
  pageSize: number;
  onSelect?: (cohort: OrgCohort) => void;
  onEdit?: (cohort: OrgCohort) => void;
  onDelete?: (cohort: OrgCohort) => void;
};

export function OrgCohortsListTable({
  data,
  isRootAdmin,
  safePage,
  pageSize,
  onSelect,
  onEdit,
  onDelete,
}: OrgCohortsListTableProps) {
  return (
    <div className="rounded-xl overflow-hidden flex flex-col bg-card/60 border border-border">
      <Table>
        <TableHeader className="sticky top-0 z-10 bg-muted">
          <TableRow className="hover:bg-muted">
            <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
              S.NO
            </TableHead>
            <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
              ORGANIZATION NAME
            </TableHead>
            <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
              TYPE
            </TableHead>
            <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
              UPDATED AT
            </TableHead>
            {isRootAdmin && (
              <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                ACTIONS
              </TableHead>
            )}
          </TableRow>
        </TableHeader>

        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={isRootAdmin ? 5 : 4}
                className="h-24 text-center"
              >
                No organizations found
              </TableCell>
            </TableRow>
          ) : (
            data.map((cohort, index) => (
              <TableRow
                key={cohort.orgCohortHash}
                className={cn(
                  'h-12 border-b border-border hover:bg-muted/50',
                  onSelect ? 'cursor-pointer' : ''
                )}
                onClick={() => onSelect?.(cohort)}
              >
                <TableCell className="px-4 py-2 text-sm font-medium align-middle">
                  {(safePage - 1) * pageSize + index + 1}
                </TableCell>
                <TableCell className="px-4 py-2 text-sm font-medium align-middle">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="shrink-0 h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <span className="truncate">{cohort.orgCohortName}</span>
                  </div>
                </TableCell>
                <TableCell className="px-4 py-2 align-middle">
                  {cohort.isRoot ? (
                    <Badge
                      variant="outline"
                      className="rounded-full px-2 py-0 text-[11px] border-emerald-700 text-emerald-700 dark:border-emerald-400 dark:text-emerald-400 bg-transparent"
                    >
                      Root
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="rounded-full px-2 py-0 text-[11px] bg-transparent"
                    >
                      General
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="px-4 py-2 text-sm text-muted-foreground align-middle">
                  {cohort.updatedAt
                    ? format(new Date(cohort.updatedAt), 'MMM dd, yyyy · HH:mm')
                    : '—'}
                </TableCell>
                {isRootAdmin && (
                  <TableCell className="px-4 py-2 align-middle">
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-md"
                            onClick={() => onEdit?.(cohort)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Edit organization
                        </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 rounded-md hover:text-red-600 hover:bg-red-50/50 dark:hover:bg-red-950/20"
                            onClick={() => onDelete?.(cohort)}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-red-500" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          Delete organization
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
