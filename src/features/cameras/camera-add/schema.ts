import { z } from 'zod';

export const cameraFormSchema = z.object({
  cam_hash: z.string().optional(),
  cam_id: z.number().optional(),
  cam_name: z.string().min(1, 'Camera name is required'),
  cam_latitude: z
    .string()
    .min(1, 'Latitude is required')
    .refine((value) => {
      const num = Number(value);
      return !isNaN(num) && num >= -90 && num <= 90;
    }, 'Enter valid latitude '),
  cam_longitude: z
    .string()
    .min(1, 'Longitude is required')
    .refine((value) => {
      const num = Number(value);
      return !isNaN(num) && num >= -180 && num <= 180;
    }, 'Enter valid longitude'),
  cam_placement_zone: z.string().min(1, 'Placement zone is required'),
  cam_placement_subzone: z.string().optional(),
  cam_placement_zone_slot: z.string().optional(),
  cam_cloud_stream_id: z.string().min(1, 'Cloud Stream ID is required'),
  cam_ip: z
    .string()
    .min(1, 'IP address is required')
    .refine((value) => {
      // IPv4 pattern: 0-255.0-255.0-255.0-255
      const ipv4Regex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      // IPv6 pattern (simplified)
      const ipv6Regex =
        /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4})$/;
      return ipv4Regex.test(value) || ipv6Regex.test(value);
    }, 'Enter a valid IP address'),
  cam_type: z.string().min(1, 'Camera type is required'),
  cam_resolution: z.string().min(1, 'Resolution is required'),
  cam_address1: z.string().optional(),
  cam_city: z
    .string()
    .optional()
    .refine(
      (value) => !value || /^[a-zA-Z\s\-']*$/.test(value),
      'City must contain only alphabetic characters'
    ),
  cam_zipcode: z.string().optional(),
  cam_fps_source_rate: z
    .string()
    .min(1, 'FPS Source Rate is required')
    .refine(
      (value) => /^\d{1,2}$/.test(value),
      'FPS Source Rate must be numeric with maximum 2 digits'
    ),
  cam_thumbnail_path: z.string().optional(),
  cam_status: z.string().optional(),
  cam_tags: z
    .string()
    .optional()
    .refine((value) => {
      if (!value || !value.trim()) return true;
      const tags = value
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.slice(0, 15));
      return tags.length <= 10 && tags.every((t) => t.length <= 15);
    }, 'Enter up to 10 tags, each 15 characters or fewer'),
});

export type CameraFormValues = z.infer<typeof cameraFormSchema>;
