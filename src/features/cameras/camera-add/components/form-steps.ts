import type { CameraFormData } from '../types/types';

export interface FormStep {
  id: string;
  title: string;
  description: string;
  fields?: (keyof CameraFormData)[];
}

export const FORM_STEPS: FormStep[] = [
  {
    id: 'camera-basic',
    title: 'Camera Details',
    description: 'Enter basic camera information',
    fields: [
      'cam_name',
      'cam_type',
      'cam_resolution',
      'cam_cloud_stream_id',
      'cam_ip',
      'cam_fps_source_rate',
    ],
  },
  {
    id: 'camera-location',
    title: 'Location & Address',
    description: 'Set coordinates, address details',
    fields: [
      'cam_latitude',
      'cam_longitude',
      'cam_placement_zone',
      'cam_placement_subzone',
      'cam_placement_zone_slot',
      'cam_address1',
      'cam_city',
      'cam_zipcode',
    ],
  },
  {
    id: 'process-config',
    title: 'Configure Pipelines',
    description: 'Select and configure processing pipelines',
    fields: [],
  },
  {
    id: 'preview',
    title: 'Preview & Create',
    description: 'Review your camera details and configuration',
    fields: [],
  },
];
