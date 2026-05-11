import { describe, expect, it } from 'vitest';
import {
  extractUniqueClasses,
  getDetectionsAtTime,
  normalizeBoundingBoxes,
} from '../../utils/bounding-box-normalizer';
import type {
  BoundingBoxDetection,
  BoundingBoxesData,
} from '../../types/batch-analysis';

describe('YOLO bounding box normalizer', () => {
  it('prefers source video dimensions and collapses PPE person detections into one label', () => {
    const ppePersonDetection = {
      class_name: 'person',
      track_id: '42',
      confidence: 0.91,
      bbox: [32, 18, 192, 108],
      ppe_status: {
        helmet: true,
        vest: false,
        shoes: true,
      },
    } as BoundingBoxDetection & {
      ppe_status: {
        helmet: boolean;
        vest: boolean;
        shoes: boolean;
      };
    };

    const data: BoundingBoxesData = {
      source_width: 320,
      source_height: 180,
      total_frames_processed: 1,
      frames: [
        {
          frame_index: 0,
          timestamp_ms: 1500,
          detections: [
            ppePersonDetection,
            {
              class_name: 'helmet',
              track_id: 'helmet-42',
              confidence: 0.99,
              bbox: [0, 0, 16, 16],
            },
          ],
        },
      ],
    };

    const frames = normalizeBoundingBoxes(data, 2000, {
      width: 640,
      height: 360,
    });

    expect(frames).toHaveLength(1);
    expect(frames[0].detections).toHaveLength(1);

    const detection = frames[0].detections[0];
    expect(detection.frameId).toBe(0);
    expect(detection.timestampMs).toBe(1500);
    expect(detection.className).toBe('person');
    expect(detection.trackId).toBe('42');
    expect(detection.confidence).toBe(0.91);
    expect(detection.displayLabel).toBe('Helmet: yes, Vest: no, Shoes: yes');
    expect(detection.ppeStatus).toEqual({
      helmet: true,
      vest: false,
      shoes: true,
    });
    expect(detection.bbox.x).toBeCloseTo(0.05);
    expect(detection.bbox.y).toBeCloseTo(0.05);
    expect(detection.bbox.width).toBeCloseTo(0.25);
    expect(detection.bbox.height).toBeCloseTo(0.25);
  });

  it('uses backend dimensions when available and clamps boxes that exceed bounds', () => {
    const data: BoundingBoxesData = {
      source_width: 100,
      source_height: 100,
      total_frames_processed: 2,
      frames: [
        {
          frame_index: 0,
          timestamp_seconds: 0.5,
          detections: [
            {
              class_name: 'vehicle',
              track_id: '9',
              confidence: 0.8,
              bbox: [-20, -10, 150, 140],
            },
          ],
        },
      ],
    };

    const frames = normalizeBoundingBoxes(data, 4000, null, {
      width: 200,
      height: 200,
    });

    expect(frames[0].timestampMs).toBe(500);
    expect(frames[0].detections[0].bbox).toEqual({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
  });

  it('derives timestamps from frame spacing when explicit timestamps are missing', () => {
    const data: BoundingBoxesData = {
      source_width: 100,
      source_height: 100,
      total_frames_processed: 5,
      frames: [
        {
          frame_index: 3,
          detections: [
            {
              class_name: 'box',
              confidence: 0.7,
              bbox: [0, 0, 10, 10],
            },
          ],
        },
        {
          frame_index: 1,
          timestamp_ms: 250,
          detections: [
            {
              class_name: 'box',
              confidence: 0.8,
              bbox: [0, 0, 10, 10],
            },
          ],
        },
        {
          frame_index: 0,
          timestamp_seconds: 0.5,
          detections: [
            {
              class_name: 'box',
              confidence: 0.9,
              bbox: [0, 0, 10, 10],
            },
          ],
        },
      ],
    };

    const frames = normalizeBoundingBoxes(data, 4000, {
      width: 100,
      height: 100,
    });

    expect(frames.map((frame) => frame.timestampMs)).toEqual([250, 500, 3000]);
    expect(frames.map((frame) => frame.frameId)).toEqual([1, 0, 3]);
  });

  it('returns detections for the matching frame and respects hold windows', () => {
    const frames = [
      {
        frameId: 0,
        timestampMs: 100,
        detections: [{ id: 'a' }],
      },
      {
        frameId: 1,
        timestampMs: 600,
        detections: [{ id: 'b' }],
      },
    ] as ReturnType<typeof normalizeBoundingBoxes>;

    expect(getDetectionsAtTime(frames, 100)).toEqual([{ id: 'a' }]);
    expect(getDetectionsAtTime(frames, 325)).toEqual([{ id: 'a' }]);
    expect(getDetectionsAtTime(frames, 500)).toEqual([]);
    expect(getDetectionsAtTime(frames, -200)).toEqual([]);
    expect(getDetectionsAtTime(frames, -200, { preferNearest: true })).toEqual([
      { id: 'a' },
    ]);
  });

  it('keeps all YOLO tracked_objects when a frame includes person alongside other classes', () => {
    const data: BoundingBoxesData = {
      source_width: 500,
      source_height: 400,
      total_frames_processed: 1,
      frames: [
        {
          frame_index: 0,
          timestamp_ms: 0,
          tracked_objects: [
            {
              track_id: 0,
              class_name: 'person',
              bbox: [10, 10, 50, 80],
              confidence: 0.9,
            },
            {
              track_id: 1,
              class_name: 'traffic light',
              bbox: [100, 20, 120, 60],
              confidence: 0.55,
            },
            {
              track_id: 2,
              class_name: 'car',
              bbox: [200, 100, 280, 160],
              confidence: 0.7,
            },
          ],
        },
      ],
    };

    const frames = normalizeBoundingBoxes(data, 1000, {
      width: 500,
      height: 400,
    });

    expect(frames).toHaveLength(1);
    const classes = frames[0].detections.map((d) => d.className).sort();
    expect(classes).toEqual(['car', 'person', 'traffic light']);
  });

  it('extracts unique classes from both standard detections and tracked persons', () => {
    const data: BoundingBoxesData = {
      source_width: 100,
      source_height: 100,
      frames: [
        {
          tracked_persons: [
            {
              class_name: 'person',
              bbox: [0, 0, 10, 10],
              ppe_status: { helmet: true },
            },
          ],
        },
        {
          detections: [
            {
              class_name: 'vehicle',
              confidence: 0.5,
              bbox: [0, 0, 10, 10],
            },
          ],
        },
      ],
    };

    expect(extractUniqueClasses(data)).toEqual(['person', 'vehicle']);
  });
});
