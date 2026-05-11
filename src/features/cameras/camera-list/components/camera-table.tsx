import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type Updater,
  type PaginationState,
} from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import Hls from 'hls.js';
import {
  Pencil,
  SquarePen,
  Trash2,
  Play,
  MapPin,
  Signal,
  Grid2x2,
  List,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { DataTablePagination } from '@/components/data-table/data-table-pagination';
import { ApolloError } from '@apollo/client';
import type { Camera } from '@/features/cameras/camera-list/types/cameras';
import type { CameraFormData } from '@/features/cameras/camera-add/types/types';
import { DataTableToolbar } from '@/components/data-table/data-table-toolbar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCameras } from '@/providers/cameras-provider';
import type { CameraDialogType } from '@/providers/cameras-provider';
import DeleteCameraDialog from '@/features/cameras/camera-delete/camera-delete-dialog';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';
import { matchesSmartSearch } from '@/utils/smart-search';

interface EditCameraFormData extends CameraFormData {
  id: number;
}

const LivePreview: React.FC<{ hlsUrl: string; shouldPlay?: boolean }> = ({
  hlsUrl,
  shouldPlay = true,
}) => {
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    const video = videoRef.current;
    if (!video || !hlsUrl) return;

    let hls: Hls | null = null;

    if (Hls.isSupported()) {
      hls = new Hls({
        lowLatencyMode: false,
        enableWorker: true,
      });
      hls.loadSource(hlsUrl);
      hls.attachMedia(video);
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = hlsUrl;
    }

    if (shouldPlay) {
      const play = () => {
        void video.play().catch(() => {
          // ignore preview play failures
        });
      };
      play();
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      video.pause();
      video.removeAttribute('src');
      video.load();
    };
  }, [hlsUrl, shouldPlay]);

  return (
    <video
      ref={videoRef}
      muted
      playsInline
      className="absolute inset-0 h-full w-full object-cover"
      preload="metadata"
    />
  );
};

const TAG_COLOR_CLASSES = [
  'border-violet-400 bg-violet-50 text-violet-700 dark:border-violet-500 dark:bg-violet-950/20 dark:text-violet-300',
  'border-pink-400 bg-pink-50 text-pink-700 dark:border-pink-500 dark:bg-pink-950/20 dark:text-pink-300',
  'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-500 dark:bg-blue-950/20 dark:text-blue-300',
  'border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-300',
  'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-500 dark:bg-amber-950/20 dark:text-amber-300',
  'border-cyan-400 bg-cyan-50 text-cyan-700 dark:border-cyan-500 dark:bg-cyan-950/20 dark:text-cyan-300',
];

interface ListViewTableRowProps {
  camera: Camera;
  onCameraNameClick: (camera: Camera) => void;
  mapCameraToFormData: (camera: Camera) => EditCameraFormData;
  setCurrentCamera: (data: EditCameraFormData) => void;
  setOpen: (type: CameraDialogType) => void;
  navigate: (path: string, options?: { state?: unknown }) => void;
  setCameraToDelete: (camera: Camera | null) => void;
  setDeleteDialogOpen: (open: boolean) => void;
  canManage?: boolean;
}

const ListViewTableRow: React.FC<ListViewTableRowProps> = ({
  camera,
  onCameraNameClick,
  mapCameraToFormData,
  setCurrentCamera,
  setOpen,
  navigate,
  setCameraToDelete,
  setDeleteDialogOpen,
  canManage,
}) => {
  const name =
    camera.cam_name ||
    (camera as { camName?: string }).camName ||
    'Unknown camera';
  const zone =
    camera.cam_placement_zone ||
    (camera as { camPlacementZone?: string }).camPlacementZone ||
    'N/A';
  const statusRaw =
    camera.cam_status || (camera as { camStatus?: string }).camStatus || 'N/A';
  const status = String(statusRaw).toUpperCase();
  const isActive = status === 'ACTIVE' || status === '1';
  const type =
    camera.cam_type ||
    (camera as { camType?: string }).camType ||
    'Unknown type';
  const ip = camera.cam_ip || (camera as { camIp?: string }).camIp || 'N/A';
  const thumbnail =
    (camera as { cam_thumbnail_path?: string }).cam_thumbnail_path ||
    (camera as { camThumbnailPath?: string }).camThumbnailPath ||
    '';
  const hlsUrl =
    (camera as { hls_url?: string }).hls_url ||
    (camera as { hlsUrl?: string }).hlsUrl ||
    '';
  const tags = camera.cam_tags ?? camera.camTags ?? [];

  return (
    <TableRow className="h-12 hover:bg-muted/50 border-b border-border">
      <TableCell className="px-3 py-1">
        <div className="relative w-24 h-12 mt-1 mb-1 overflow-hidden rounded bg-slate-900">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={`${name} thumbnail`}
              className="h-full w-full object-cover"
            />
          ) : isActive && hlsUrl ? (
            <>
              <LivePreview hlsUrl={hlsUrl} shouldPlay={true} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            </>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
          )}
        </div>
      </TableCell>
      <TableCell
        className="px-4 py-1 font-medium text-foreground cursor-pointer hover:underline"
        onClick={() => onCameraNameClick(camera)}
      >
        {name}
      </TableCell>
      <TableCell className="px-4 py-1">
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className={`flex items-center gap-1 text-xs ${
            !isActive
              ? 'bg-red-50 dark:bg-red-800/40 text-red-500 dark:border-red-800 border-red-300 dark:text-red-400'
              : 'bg-green-50 dark:bg-green-800/40 text-green-500 border-green-300 dark:border-green-800 dark:text-green-400'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full animate-pulse ${
              isActive ? 'bg-green-400' : 'bg-red-400'
            }`}
          />
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell className="px-4 py-1 text-sm text-muted-foreground">
        {ip}
      </TableCell>
      <TableCell className="px-4 py-1 text-sm text-muted-foreground">
        <div className="flex items-center gap-1">
          <MapPin className="h-3 w-3" />
          <span>
            {camera.cam_latitude && camera.cam_longitude
              ? `${camera.cam_latitude}, ${camera.cam_longitude}`
              : 'N/A'}
          </span>
        </div>
      </TableCell>
      <TableCell className="px-4 py-1">
        <div className="text-sm">
          <Badge
            variant="outline"
            className="shrink-0 border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary"
          >
            {zone}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="px-4 py-1">
        <div className="flex gap-1 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {type}
          </Badge>
        </div>
      </TableCell>
      <TableCell className="px-4 py-1">
        {tags.length ? (
          <TooltipProvider>
            <div className="flex gap-1 flex-wrap max-w-[200px] items-center">
              {tags.slice(0, 2).map((tag, idx) => {
                const shouldTruncate = tag.length > 18;
                const displayTag = shouldTruncate
                  ? `${tag.slice(0, 15)}...`
                  : tag;
                const colorClass =
                  TAG_COLOR_CLASSES[idx % TAG_COLOR_CLASSES.length];
                const badge = (
                  <Badge
                    key={idx}
                    variant="outline"
                    className={`text-xs font-medium ${colorClass}`}
                  >
                    {displayTag}
                  </Badge>
                );

                return shouldTruncate ? (
                  <Tooltip key={`tag-${idx}`}>
                    <TooltipTrigger asChild>{badge}</TooltipTrigger>
                    <TooltipContent side="top">
                      <p className="text-xs">{tag}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  badge
                );
              })}

              {tags.length > 2 && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold px-2"
                    >
                      +{tags.length - 2}More
                    </Badge>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <div className="space-y-1">
                      {tags.slice(2).map((tag, idx) => (
                        <p key={`tag-more-${idx}`} className="text-xs">
                          • {tag}
                        </p>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </TooltipProvider>
        ) : (
          <span className="text-xs text-muted-foreground">No tags</span>
        )}
      </TableCell>
      <TableCell className="px-4 py-1">
        <div className="flex gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onCameraNameClick(camera);
                  }}
                  aria-label="View Live Stream"
                  className="h-7 w-7 p-0"
                >
                  <Play className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">View Live Stream</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canManage) {
                      toast.error(
                        "You don't have permission to do this operation."
                      );
                      return;
                    }
                    const formData = mapCameraToFormData(camera);
                    setCurrentCamera(formData);
                    setOpen('edit');
                    const routeCohortHash =
                      new URLSearchParams(window.location.search).get(
                        'cohort'
                      ) || '';
                    const isLiveContext =
                      window.location.pathname.startsWith('/live');
                    const cohortHash =
                      routeCohortHash ||
                      camera.user_role_cohort_hash ||
                      camera.userRoleCohortHash ||
                      '';
                    const editPath = cohortHash
                      ? `/cameras/edit?cohort=${encodeURIComponent(cohortHash)}`
                      : '/cameras/edit';
                    navigate(editPath, {
                      state: {
                        camera: formData,
                        cohortHash,
                        ...(isLiveContext ? { source: 'live-landing' } : {}),
                      },
                    });
                  }}
                  aria-label="Configure camera"
                  className="h-7 w-7 p-0"
                >
                  <SquarePen className="h-4 w-4 text-blue-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Edit Camera</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!canManage) {
                      toast.error(
                        "You don't have permission to do this operation."
                      );
                      return;
                    }
                    setCameraToDelete(camera);
                    setDeleteDialogOpen(true);
                  }}
                  aria-label="Delete camera"
                  className="h-7 w-7 p-0"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p className="text-xs">Delete camera</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
};

interface CameraTableProps {
  loading: boolean;
  error?: ApolloError;
  cameras: Camera[];
  searchTerm: string;
  pagination: PaginationState;
  onPaginationChange: (updater: Updater<PaginationState>) => void;
  onDeleteCamera: (camera: Camera) => void;
  totalCount: number;
  viewMode?: 'grid' | 'list';
  canManage?: boolean;
}

export const CameraTable: React.FC<CameraTableProps> = ({
  loading,
  error,
  cameras,
  searchTerm,
  pagination,
  onPaginationChange,
  onDeleteCamera,
  totalCount,
  viewMode: initialViewMode,
  canManage,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { setCurrentCamera, setOpen } = useCameras();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cameraToDelete, setCameraToDelete] = useState<Camera | null>(null);
  const [tableData, setTableData] = useState<Camera[]>(cameras);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>(
    initialViewMode ?? 'list'
  );

  const cameraDetailBasePath = useMemo(
    () => (location.pathname.startsWith('/live') ? '/live' : '/cameras'),
    [location.pathname]
  );

  const getCameraId = useCallback((camera: Camera): string => {
    const idValue = camera.id ?? camera.cam_id ?? '';
    return typeof idValue === 'string' ? idValue : String(idValue);
  }, []);

  useEffect(() => {
    setTableData(cameras);
  }, [cameras]);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  const zoneCounts = useMemo(() => {
    const map = new Map<string, number>();
    tableData.forEach((c) => {
      const zone =
        c.cam_placement_zone && c.cam_placement_zone.trim() !== ''
          ? c.cam_placement_zone
          : 'N/A';
      map.set(zone, (map.get(zone) ?? 0) + 1);
    });
    return map;
  }, [tableData]);

  const zoneFilterOptions = useMemo(
    () =>
      Array.from(zoneCounts.entries()).map(([zone, count]) => ({
        label: zone,
        value: zone,
        count,
      })),
    [zoneCounts]
  );

  const mapCameraToFormData = useCallback(
    (camera: Camera): EditCameraFormData => {
      const idValue = camera.id ?? camera.cam_id ?? 0;
      const id = typeof idValue === 'number' ? idValue : Number(idValue);
      const tagsRaw =
        (camera as { cam_tags?: unknown }).cam_tags ??
        (camera as { camTags?: unknown }).camTags ??
        [];
      const tags = Array.isArray(tagsRaw)
        ? tagsRaw.join(', ')
        : typeof tagsRaw === 'string'
          ? tagsRaw
          : '';
      const formData: EditCameraFormData = {
        cam_hash: camera.cam_hash || camera.camHash || '',
        cam_name: camera.cam_name || '',
        cam_latitude: camera.cam_latitude?.toString() || '',
        cam_longitude: camera.cam_longitude?.toString() || '',
        cam_placement_zone: camera.cam_placement_zone || '',
        cam_placement_subzone: camera.cam_placement_subzone || '',
        cam_placement_zone_slot: camera.cam_placement_zone_slot || '',
        cam_cloud_stream_id: camera.cam_cloud_stream_id || '',
        cam_ip: camera.cam_ip || '',
        cam_type: camera.cam_type || '',
        cam_resolution: camera.cam_resolution || '',
        cam_address1: camera.cam_address1 || '',
        cam_city: camera.cam_city || '',
        cam_zipcode: camera.cam_zipcode || '',
        cam_fps_source_rate: '',
        cam_thumbnail_path: '',
        cam_status: camera.cam_status || '',
        cam_tags: tags,
        id,
      };
      return formData;
    },
    []
  );

  const handleCameraNameClick = useCallback(
    (camera: Camera) => {
      const cameraName = camera.cam_name || 'unknown';
      const cameraHash = camera.cam_hash || '';
      const routeCohortHash =
        new URLSearchParams(window.location.search).get('cohort') || '';
      const cohortHash =
        routeCohortHash ||
        camera.user_role_cohort_hash ||
        camera.userRoleCohortHash ||
        '';
      const nextUrl = cohortHash
        ? `${cameraDetailBasePath}/${encodeURIComponent(cameraName)}?cohort=${encodeURIComponent(cohortHash)}`
        : `${cameraDetailBasePath}/${encodeURIComponent(cameraName)}`;

      navigate(nextUrl, {
        state: {
          camera: {
            ...camera,
            camHash: cameraHash,
          },
          cohortHash,
        },
      });
    },
    [cameraDetailBasePath, navigate]
  );
  const handleCardClick = useCallback(
    (camera: Camera) => {
      handleCameraNameClick(camera);
    },
    [handleCameraNameClick]
  );

  const columns = React.useMemo<ColumnDef<Camera>[]>(
    () => [
      {
        accessorKey: 'cam_name',
        enableHiding: false,
        header: ({ column }) => (
          <div
            className="cursor-pointer select-none"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
          </div>
        ),
        filterFn: (row, id, filterValue) => {
          const value = String(row.getValue(id) ?? '');
          return matchesSmartSearch(value, filterValue);
        },
        cell: ({ row }) => {
          const camera = row.original;
          return (
            <div
              className="font-medium cursor-pointer hover:underline"
              onClick={() => handleCameraNameClick(camera)}
            >
              {row.getValue('cam_name') || 'N/A'}
            </div>
          );
        },
      },
      {
        id: 'coordinates',
        accessorFn: (row) => {
          const lat = row.cam_latitude;
          const lng = row.cam_longitude;
          return lat && lng ? `${lat}, ${lng}` : 'N/A';
        },
        header: 'Coordinates',
        cell: ({ row }) => {
          const lat = row.original.cam_latitude;
          const lng = row.original.cam_longitude;
          return lat && lng ? `${lat}, ${lng}` : 'N/A';
        },
      },
      {
        accessorKey: 'cam_status',
        header: 'Status',
        filterFn: (row, id, filterValue) => {
          if (
            !filterValue ||
            !Array.isArray(filterValue) ||
            filterValue.length === 0
          ) {
            return true;
          }
          const cellValue = row.getValue(id) as string;
          return filterValue.includes(cellValue || 'N/A');
        },
        cell: ({ row }) => {
          const statusValue = row.getValue('cam_status') as string;
          const status = statusValue || 'N/A';
          const isActive = status.toLowerCase() === 'active';
          return (
            <Badge
              variant={isActive ? 'default' : 'secondary'}
              className={`flex items-center justify-center leading-none px-2 py-1 ${
                !isActive ? 'bg-red-500 text-white' : ''
              }`}
            >
              {status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'cam_placement_zone',
        header: 'Zone',
        filterFn: (row, id, filterValue) => {
          if (
            !filterValue ||
            !Array.isArray(filterValue) ||
            filterValue.length === 0
          ) {
            return true;
          }
          const cellValue = row.getValue(id) as string;
          const displayValue =
            cellValue && cellValue.trim() !== '' ? cellValue : 'N/A';
          return filterValue.includes(displayValue);
        },
        cell: ({ row }) => {
          const zone = row.getValue('cam_placement_zone') as string;
          const displayValue = zone && zone.trim() !== '' ? zone : 'N/A';
          return <span>{displayValue}</span>;
        },
      },
      {
        accessorKey: 'cam_cloud_stream_id',
        header: 'Stream ID',
        cell: ({ row }) => (
          <span>{row.getValue('cam_cloud_stream_id') || 'N/A'}</span>
        ),
      },
      {
        accessorKey: 'cam_ip',
        header: 'IP Address',
        cell: ({ row }) => <span>{row.getValue('cam_ip') || 'N/A'}</span>,
      },
      {
        accessorKey: 'cam_type',
        header: 'Type',
        cell: ({ row }) => <span>{row.getValue('cam_type') || 'N/A'}</span>,
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => {
          const camera = row.original;
          return (
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCameraNameClick(camera);
                      }}
                      aria-label="View Live Stream"
                    >
                      <Play className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">View Live Stream</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canManage) {
                          toast.error(
                            "You don't have permission to do this operation."
                          );
                          return;
                        }
                        const formData = mapCameraToFormData(camera);

                        setCurrentCamera(formData);
                        setOpen('edit');
                        const routeCohortHash =
                          new URLSearchParams(window.location.search).get(
                            'cohort'
                          ) || '';
                        const cohortHash =
                          routeCohortHash ||
                          camera.user_role_cohort_hash ||
                          camera.userRoleCohortHash ||
                          '';
                        const source = location.pathname.startsWith('/live')
                          ? 'live-landing'
                          : undefined;
                        const editPath = cohortHash
                          ? `/cameras/edit?cohort=${encodeURIComponent(cohortHash)}`
                          : '/cameras/edit';
                        navigate(editPath, {
                          state: {
                            camera: formData,
                            cohortHash,
                            ...(source ? { source } : {}),
                          },
                        });
                      }}
                      aria-label="Edit Camera"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Edit Camera</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!canManage) {
                          toast.error(
                            "You don't have permission to do this operation."
                          );
                          return;
                        }
                        setCameraToDelete(camera);
                        setDeleteDialogOpen(true);
                      }}
                      aria-label="Delete Camera"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    <p className="text-xs">Delete Camera</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      handleCameraNameClick,
      mapCameraToFormData,
      setCurrentCamera,
      setOpen,
      navigate,
      canManage,
    ]
  );

  const table = useReactTable({
    data: tableData,
    columns,
    state: {
      pagination,
      sorting,
      columnFilters,
      globalFilter: searchTerm,
    },
    onPaginationChange,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    rowCount: totalCount,
  });

  useEffect(() => {
    table.setGlobalFilter(searchTerm);
  }, [searchTerm, table]);

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCameraToDelete(null);
  };

  const handleDeleteSuccess = () => {
    if (cameraToDelete) {
      const deleteId = getCameraId(cameraToDelete);
      setTableData((prev) => prev.filter((c) => getCameraId(c) !== deleteId));
      onDeleteCamera(cameraToDelete);
    }
    handleCloseDeleteDialog();
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="pb-4 flex items-center justify-between">
          <div className="flex-1">
            <DataTableToolbar
              table={table}
              searchPlaceholder="Filter cameras..."
              searchKey="cam_name"
              filters={[
                {
                  columnId: 'cam_placement_zone',
                  title: 'Zone',
                  options: zoneFilterOptions,
                },
              ]}
            />
          </div>
          <div className=" flex items-center bg-gray-200 dark:bg-black border rounded-lg p-1 h-9 w-20">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center ml-0 h-7 w-9 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-black dark:border-blue-800/60 border text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Grid2x2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center h-7 w-9 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-black dark:border-blue-800/60 border text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="rounded-md border flex-1 overflow-hidden flex flex-col">
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <Spinner className="h-12 w-12 text-blue-500 mb-4" />
            <p className="text-lg font-semibold text-foreground mb-2">
              Loading Cameras
            </p>
            <p className="text-sm text-muted-foreground">
              Please wait while we load your camera...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-red-400">
          Error loading cameras: {error.message}
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="pb-4 flex items-center justify-between">
          <div className="flex-1">
            <DataTableToolbar
              table={table}
              searchPlaceholder="Filter cameras..."
              searchKey="cam_name"
              filters={[
                {
                  columnId: 'cam_placement_zone',
                  title: 'Zone',
                  options: zoneFilterOptions,
                },
              ]}
            />
          </div>
          <div className=" flex items-center bg-gray-200 dark:bg-black border rounded-lg p-1 h-9 w-20">
            <button
              onClick={() => setViewMode('grid')}
              className={`flex items-center justify-center ml-0 h-7 w-9 rounded-md transition ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-black dark:border-blue-800/60 border text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <Grid2x2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center justify-center h-7 w-9 rounded-md transition ${
                viewMode === 'list'
                  ? 'bg-white dark:bg-black dark:border-blue-800/60 border text-blue-600 shadow-sm'
                  : 'text-gray-500'
              }`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>

        {viewMode === 'list' ? (
          // List View - Table Layout
          <div className="rounded-xl flex-1 overflow-hidden flex flex-col bg-card/60 border border-border">
            <ScrollArea className="flex-1 w-full h-full">
              <div className="w-full">
                <Table>
                  <TableHeader className="sticky top-0 z-10 bg-muted">
                    <TableRow className="hover:bg-muted">
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                        PREVIEW
                      </TableHead>
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                        CAMERA NAME
                      </TableHead>
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                        STATUS
                      </TableHead>
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                        IP ADDRESS
                      </TableHead>
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                        COORDINATES
                      </TableHead>
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                        ZONE
                      </TableHead>
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                        TYPES
                      </TableHead>
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground">
                        TAGS
                      </TableHead>
                      <TableHead className="h-10 px-4 py-2 text-xs font-semibold text-muted-foreground ml-2">
                        ACTIONS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table
                        .getRowModel()
                        .rows.map((row) => (
                          <ListViewTableRow
                            key={row.id}
                            camera={row.original}
                            onCameraNameClick={handleCameraNameClick}
                            mapCameraToFormData={mapCameraToFormData}
                            setCurrentCamera={setCurrentCamera}
                            setOpen={setOpen}
                            navigate={navigate}
                            setCameraToDelete={setCameraToDelete}
                            setDeleteDialogOpen={setDeleteDialogOpen}
                            canManage={canManage}
                          />
                        ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={8}
                          className="text-center py-8 text-muted-foreground"
                        >
                          <div className="flex flex-col items-center justify-center gap-2">
                            <p className="font-medium">No cameras found</p>
                            <p className="text-xs">
                              Adjust your filters or add a new camera to get
                              started.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <ScrollBar orientation="horizontal" />
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        ) : (
          // Grid View
          <div className="rounded-xl flex-1 overflow-hidden flex flex-col bg-card/60">
            <ScrollArea className="flex-1 w-full h-full spectra-scrollbar-wide">
              <div className="p-4">
                {table.getRowModel().rows?.length ? (
                  <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {table.getRowModel().rows.map((row) => {
                      const camera = row.original;
                      const name =
                        camera.cam_name ||
                        (camera as { camName?: string }).camName ||
                        'Unknown camera';
                      const zone =
                        camera.cam_placement_zone ||
                        (camera as { camPlacementZone?: string })
                          .camPlacementZone ||
                        'N/A';
                      const statusRaw =
                        camera.cam_status ||
                        (camera as { camStatus?: string }).camStatus ||
                        'N/A';
                      const status = String(statusRaw).toUpperCase();
                      const isActive = status === 'ACTIVE' || status === '1';
                      const coords =
                        camera.cam_latitude && camera.cam_longitude
                          ? `${camera.cam_latitude}, ${camera.cam_longitude}`
                          : 'No coordinates';
                      const type =
                        camera.cam_type ||
                        (camera as { camType?: string }).camType ||
                        'Unknown type';
                      const ip =
                        camera.cam_ip ||
                        (camera as { camIp?: string }).camIp ||
                        'N/A';
                      const thumbnail =
                        (camera as { cam_thumbnail_path?: string })
                          .cam_thumbnail_path ||
                        (camera as { camThumbnailPath?: string })
                          .camThumbnailPath ||
                        '';
                      const hlsUrl =
                        (camera as { hls_url?: string }).hls_url ||
                        (camera as { hlsUrl?: string }).hlsUrl ||
                        '';
                      const tags = camera.cam_tags ?? camera.camTags ?? [];

                      return (
                        <div
                          key={row.id}
                          className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-card/90 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                          onClick={() => handleCardClick(camera)}
                        >
                          <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
                            {thumbnail ? (
                              <>
                                <img
                                  src={thumbnail}
                                  alt={`${name} thumbnail`}
                                  className="absolute inset-0 h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                              </>
                            ) : isActive && hlsUrl ? (
                              <>
                                <LivePreview hlsUrl={hlsUrl} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                              </>
                            ) : (
                              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_#22d3ee33,_transparent_60%),radial-gradient(circle_at_bottom,_#6366f133,_transparent_60%)]" />
                            )}
                            <div className="relative z-10 flex h-full items-start justify-start p-3 text-slate-50">
                              <div className="inline-flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 text-[11px] font-medium uppercase tracking-wide">
                                <span
                                  className={`h-2 w-2 rounded-full ${
                                    isActive ? 'bg-emerald-400' : 'bg-rose-400'
                                  }`}
                                />
                                <span>
                                  {isActive ? 'Active Stream' : 'Inactive'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col gap-1.5 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <p className="line-clamp-2 text-sm font-semibold text-foreground">
                                {name}
                              </p>
                              <Badge
                                variant="outline"
                                className="shrink-0 border-primary/30 bg-primary/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-primary"
                              >
                                {zone}
                              </Badge>
                            </div>
                            <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span className="truncate">{coords}</span>
                            </div>
                            {tags.length ? (
                              <TooltipProvider>
                                <div className="mt-2 flex flex-wrap gap-1 items-center">
                                  {tags.slice(0, 2).map((tag, idx) => {
                                    const shouldTruncate = tag.length > 18;
                                    const displayTag = shouldTruncate
                                      ? `${tag.slice(0, 15)}...`
                                      : tag;
                                    const colorClass =
                                      TAG_COLOR_CLASSES[
                                        idx % TAG_COLOR_CLASSES.length
                                      ];
                                    const badge = (
                                      <Badge
                                        key={idx}
                                        variant="outline"
                                        className={`text-[10px] px-1.5 py-0 h-5 font-medium ${colorClass}`}
                                      >
                                        {displayTag}
                                      </Badge>
                                    );

                                    return shouldTruncate ? (
                                      <Tooltip key={`card-tag-${idx}`}>
                                        <TooltipTrigger asChild>
                                          {badge}
                                        </TooltipTrigger>
                                        <TooltipContent side="top">
                                          <p className="text-xs">{tag}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    ) : (
                                      badge
                                    );
                                  })}

                                  {tags.length > 2 && (
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] font-semibold px-2"
                                        >
                                          +{tags.length - 2}More
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent side="top">
                                        <div className="space-y-1">
                                          {tags.slice(2).map((tag, idx) => (
                                            <p
                                              key={`card-tag-more-${idx}`}
                                              className="text-xs"
                                            >
                                              • {tag}
                                            </p>
                                          ))}
                                        </div>
                                      </TooltipContent>
                                    </Tooltip>
                                  )}
                                </div>
                              </TooltipProvider>
                            ) : (
                              <p className="mt-2 text-[11px] text-muted-foreground">
                                No tags
                              </p>
                            )}
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                              <span className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2 py-0.5">
                                <Signal className="h-3 w-3" />
                                <span>{type}</span>
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCardClick(camera);
                                }}
                                className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-background/60 px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                              >
                                <Play className="h-3 w-3" />
                                <span>Open Live Chat</span>
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between border-t border-border/70 bg-muted/70 px-3 py-2 text-[11px] text-muted-foreground">
                            <span className="truncate">IP: {ip}</span>
                            <div className="flex items-center gap-1.5">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!canManage) {
                                          toast.error(
                                            "You don't have permission to do this operation."
                                          );
                                          return;
                                        }
                                        const formData =
                                          mapCameraToFormData(camera);
                                        setCurrentCamera(formData);
                                        setOpen('edit');
                                        const routeCohortHash =
                                          new URLSearchParams(
                                            window.location.search
                                          ).get('cohort') || '';
                                        const cohortHash =
                                          routeCohortHash ||
                                          camera.user_role_cohort_hash ||
                                          camera.userRoleCohortHash ||
                                          '';
                                        const source =
                                          location.pathname.startsWith('/live')
                                            ? 'live-landing'
                                            : undefined;
                                        const editPath = cohortHash
                                          ? `/cameras/edit?cohort=${encodeURIComponent(cohortHash)}`
                                          : '/cameras/edit';
                                        navigate(editPath, {
                                          state: {
                                            camera: formData,
                                            cohortHash,
                                            ...(source ? { source } : {}),
                                          },
                                        });
                                      }}
                                      aria-label="Configure camera"
                                    >
                                      <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Edit Camera</p>
                                  </TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!canManage) {
                                          toast.error(
                                            "You don't have permission to do this operation."
                                          );
                                          return;
                                        }
                                        setCameraToDelete(camera);
                                        setDeleteDialogOpen(true);
                                      }}
                                      aria-label="Delete camera"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p className="text-xs">Delete camera</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex h-[240px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 bg-background/70 text-sm text-muted-foreground">
                    <p className="font-medium">No cameras found</p>
                    <p className="text-xs">
                      Adjust your filters or add a new camera to get started.
                    </p>
                  </div>
                )}
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          </div>
        )}

        <div className="shrink-0 border-t bg-background/80">
          <DataTablePagination table={table} />
        </div>
      </div>
      <DeleteCameraDialog
        camera={cameraToDelete}
        isOpen={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        onDeleted={handleDeleteSuccess}
      />
    </>
  );
};
