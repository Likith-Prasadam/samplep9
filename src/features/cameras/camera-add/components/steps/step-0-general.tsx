import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { CAMERA_TYPES, CAMERA_RESOLUTIONS } from '../../types/types';
import { LabelWithTooltip } from '../label-with-tooltip';
import type { CameraFormValues } from '../../schema';

const TAG_MAX_COUNT = 10;
const TAG_MAX_LENGTH = 15;

const normalizeTagsInput = (value: string, previous: string): string => {
  const endsWithComma = /,\s*$/.test(value);
  const isDeleting = previous.length > value.length;
  const tags = value
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .map((t) => t.slice(0, TAG_MAX_LENGTH))
    .slice(0, TAG_MAX_COUNT);
  const base = tags.join(', ');
  const canStartNext =
    endsWithComma && tags.length < TAG_MAX_COUNT && !isDeleting;
  return canStartNext ? `${base}${base ? ', ' : ''}` : base;
};

export const Step0General = () => {
  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useFormContext<CameraFormValues>();

  const camType = watch('cam_type');
  const camResolution = watch('cam_resolution');
  const camTags = watch('cam_tags');

  return (
    <>
      {/* Basic information */}
      <section className="space-y-4">
        <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
          <LabelWithTooltip
            htmlFor="cam_name"
            wrapperClassName="pt-2"
            tooltipText="A unique display name for this camera (max 20 characters)."
            required
          >
            Camera name
          </LabelWithTooltip>
          <div>
            <Input
              id="cam_name"
              {...register('cam_name')}
              maxLength={20}
              placeholder="Enter camera name"
              className="block w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-red-600 text-xs min-h-5">
              {errors.cam_name?.message}
            </p>
          </div>
        </div>
        <Separator />
      </section>

      {/* Technical details */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_type"
              wrapperClassName="pt-2"
              tooltipText="Type of camera or capture device."
              required
            >
              Camera type
            </LabelWithTooltip>
            <div>
              <Select
                value={camType}
                onValueChange={(value) =>
                  setValue('cam_type', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Select camera type" />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_TYPES.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-red-600 text-xs min-h-5">
                {errors.cam_type?.message}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_resolution"
              wrapperClassName="pt-2"
              tooltipText="Video resolution for this camera."
              required
            >
              Resolution
            </LabelWithTooltip>
            <div>
              <Select
                value={camResolution}
                onValueChange={(value) =>
                  setValue('cam_resolution', value, { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full h-10 px-3 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                  <SelectValue placeholder="Select resolution" />
                </SelectTrigger>
                <SelectContent>
                  {CAMERA_RESOLUTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-red-600 text-xs min-h-5">
                {errors.cam_resolution?.message}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_cloud_stream_id"
              wrapperClassName="pt-2"
              tooltipText="Identifier for the cloud stream used for live viewing."
              required
            >
              Cloud stream ID
            </LabelWithTooltip>
            <div>
              <Input
                id="cam_cloud_stream_id"
                {...register('cam_cloud_stream_id')}
                placeholder="Enter cloud stream identifier"
                className="block w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3"
              />
              <p className="mt-1 text-red-600 text-xs min-h-5">
                {errors.cam_cloud_stream_id?.message}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_ip"
              wrapperClassName="pt-2"
              tooltipText="Camera device IP address (IPv4)."
              required
            >
              IP address
            </LabelWithTooltip>
            <div>
              <Input
                id="cam_ip"
                {...register('cam_ip', {
                  onChange: (e) => {
                    const value = e.target.value;
                    // Allow digits, dots (for IPv4), and colons (for IPv6)
                    if (!/^[\d.:\-a-fA-F]*$/.test(value)) {
                      setValue('cam_ip', value.replace(/[^\d.:\-a-fA-F]/g, ''));
                    }
                  },
                })}
                placeholder="192.168.1.100"
                className="block w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3"
                maxLength={15}
              />
              <p className="mt-1 text-red-600 text-xs min-h-5">
                {errors.cam_ip?.message}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 md:items-start">
          <div className="flex-1 grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_fps_source_rate"
              wrapperClassName="pt-2"
              tooltipText="Frames per second from the camera source."
            >
              Source frame rate (FPS)
            </LabelWithTooltip>
            <div>
              <Input
                id="cam_fps_source_rate"
                type="number"
                {...register('cam_fps_source_rate', {
                  onChange: (event) => {
                    let value = event.target.value.replace(/\D/g, '');
                    if (value.length > 2) {
                      value = value.slice(0, 2);
                    }
                    setValue('cam_fps_source_rate', value, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  },
                })}
                placeholder="30"
                max="99"
                min="0"
                className="block w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3"
              />
              <p className="mt-1 text-red-600 text-xs min-h-5">
                {errors.cam_fps_source_rate?.message}
              </p>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_tags"
              wrapperClassName="pt-2"
              tooltipText="Use tags to identify camera places."
            >
              Tags
            </LabelWithTooltip>
            <div>
              <Input
                id="cam_tags"
                value={camTags ?? ''}
                {...register('cam_tags', {
                  onChange: (event) => {
                    const normalized = normalizeTagsInput(
                      event.target.value,
                      camTags ?? ''
                    );
                    setValue('cam_tags', normalized, {
                      shouldValidate: true,
                      shouldDirty: true,
                    });
                  },
                })}
                placeholder="Comma separated (e.g. indoor,daytime)"
                maxLength={200}
                className="block w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3"
              />
              {(() => {
                return <></>;
              })()}
              <p className="mt-1 text-red-600 text-xs min-h-5">
                {errors.cam_tags?.message}
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};
