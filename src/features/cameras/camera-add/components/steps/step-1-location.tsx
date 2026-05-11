import { useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LabelWithTooltip } from '../label-with-tooltip';
import type { CameraFormValues } from '../../schema';

export const Step1Location = () => {
  const {
    register,
    formState: { errors },
    setValue,
  } = useFormContext<CameraFormValues>();

  return (
    <>
      {/* Location information */}
      <section className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_latitude"
              wrapperClassName="pt-2"
              tooltipText="Geographic latitude of the camera location."
              required
            >
              Latitude
            </LabelWithTooltip>
            <div>
              <Input
                id="cam_latitude"
                type="number"
                step="any"
                {...register('cam_latitude', {
                  onChange: (e) => {
                    const value = e.target.value;
                    const num = Number(value);
                    // Limit input to 10 characters to prevent extremely long numbers
                    if (value.length > 10) {
                      setValue('cam_latitude', value.slice(0, 10));
                    }
                    // Validate range and provide feedback
                    if (value && !isNaN(num) && (num < -90 || num > 90)) {
                      // Range exceeded, but Zod will catch this and show error
                    }
                  },
                })}
                placeholder="40.7128"
                className="block w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3"
                onKeyDown={(e) =>
                  ['e', 'E', '+'].includes(e.key) && e.preventDefault()
                }
              />
              <p className="mt-1 text-red-600 text-xs min-h-5">
                {errors.cam_latitude?.message}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_longitude"
              wrapperClassName="pt-2"
              tooltipText="Geographic longitude of the camera location."
              required
            >
              Longitude
            </LabelWithTooltip>
            <div>
              <Input
                id="cam_longitude"
                type="number"
                step="any"
                {...register('cam_longitude', {
                  onChange: (e) => {
                    const value = e.target.value;
                    const num = Number(value);
                    // Limit input to 10 characters to prevent extremely long numbers
                    if (value.length > 10) {
                      setValue('cam_longitude', value.slice(0, 10));
                    }
                    // Validate range and provide feedback
                    if (value && !isNaN(num) && (num < -180 || num > 180)) {
                      // Range exceeded, but Zod will catch this and show error
                    }
                  },
                })}
                placeholder="74.0060"
                className="block w-full h-10 rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3"
                onKeyDown={(e) =>
                  ['e', 'E', '+'].includes(e.key) && e.preventDefault()
                }
              />
              <p className="mt-1 text-red-600 text-xs min-h-5">
                {errors.cam_longitude?.message}
              </p>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <LabelWithTooltip
              htmlFor="cam_placement_zone"
              tooltipText="Zone where the camera is placed (e.g. Building A)."
              required
            >
              Placement zone
            </LabelWithTooltip>
            <Input
              id="cam_placement_zone"
              {...register('cam_placement_zone')}
              placeholder="Enter placement zone (for example, Building A)"
              maxLength={30}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-red-600 text-xs min-h-5">
              {errors.cam_placement_zone?.message}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <LabelWithTooltip
              htmlFor="cam_placement_subzone"
              tooltipText="Sub-zone within the placement zone (e.g. Floor 1)."
            >
              Placement sub-zone
            </LabelWithTooltip>
            <Input
              id="cam_placement_subzone"
              {...register('cam_placement_subzone')}
              placeholder="Enter sub-zone (for example, Floor 1)"
              maxLength={30}
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
            <LabelWithTooltip
              htmlFor="cam_placement_zone_slot"
              wrapperClassName="pt-2"
              tooltipText="Slot identifier within the zone."
            >
              Placement slot
            </LabelWithTooltip>
            <div>
              <Input
                id="cam_placement_zone_slot"
                {...register('cam_placement_zone_slot')}
                placeholder="Enter slot identifier"
                maxLength={30}
                className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </section>
      <Separator />

      {/* Address information */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          Address information
        </h2>
        <div className="grid grid-cols-[160px,minmax(0,1fr)] items-start gap-4">
          <LabelWithTooltip
            htmlFor="cam_address1"
            wrapperClassName="pt-2"
            tooltipText="Street address of the camera location."
          >
            Street address
          </LabelWithTooltip>
          <div>
            <Input
              id="cam_address1"
              {...register('cam_address1')}
              maxLength={50}
              placeholder="Enter street address"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-red-600 text-xs min-h-5">
              {errors.cam_address1?.message}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <LabelWithTooltip
              htmlFor="cam_city"
              tooltipText="City of the camera location."
            >
              City
            </LabelWithTooltip>
            <Input
              id="cam_city"
              {...register('cam_city', {
                onChange: (e) => {
                  const value = e.target.value;
                  // Only allow alphabetic characters, spaces, hyphens, and apostrophes
                  if (!/^[a-zA-Z\s\-']*$/.test(value)) {
                    setValue('cam_city', value.replace(/[^a-zA-Z\s\-']/g, ''));
                  }
                },
              })}
              maxLength={15}
              placeholder="Enter city"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-red-600 text-xs min-h-5">
              {errors.cam_city?.message}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <LabelWithTooltip
              htmlFor="cam_zipcode"
              tooltipText="Postal or ZIP code (numeric, max 6 digits)."
            >
              Postal code
            </LabelWithTooltip>
            <Input
              id="cam_zipcode"
              {...register('cam_zipcode', {
                onChange: (e) => {
                  const value = e.target.value;
                  if (!/^\d*$/.test(value)) {
                    setValue('cam_zipcode', value.replace(/\D/g, ''));
                  }
                },
              })}
              maxLength={6}
              placeholder="Enter postal code"
              className="block w-full rounded-md border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="mt-1 text-red-600 text-xs min-h-5">
              {errors.cam_zipcode?.message}
            </p>
          </div>
        </div>
      </section>
    </>
  );
};
