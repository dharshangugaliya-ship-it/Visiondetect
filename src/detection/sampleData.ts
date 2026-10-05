/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import streetSceneImg from '../assets/images/street_scene_1791216977411.jpg';
import trafficSceneImg from '../assets/images/traffic_scene_1791216992170.jpg';
import officeSceneImg from '../assets/images/office_scene_1791217007112.jpg';
import { Detection } from './types';
import { getClassColor } from './visualization';

export interface SampleMedia {
  id: string;
  name: string;
  type: 'image' | 'video';
  url: string;
  dimensions: string;
  size: string;
  defaultDetections?: Detection[];
}

export const SAMPLE_MEDIA: SampleMedia[] = [
  {
    id: 'street-scene',
    name: 'Street Scene.jpg',
    type: 'image',
    url: streetSceneImg,
    dimensions: '1920 × 1080',
    size: '2.4 MB',
    defaultDetections: [
      {
        id: 'det-1',
        class_id: 0,
        class_name: 'person',
        confidence: 0.93,
        bounding_box: [210, 120, 420, 780],
        color: getClassColor('person'),
      },
      {
        id: 'det-2',
        class_id: 2,
        class_name: 'car',
        confidence: 0.88,
        bounding_box: [840, 320, 980, 620],
        color: getClassColor('car'),
      },
      {
        id: 'det-3',
        class_id: 5,
        class_name: 'bus',
        confidence: 0.87,
        bounding_box: [1050, 280, 1420, 640],
        color: getClassColor('bus'),
      },
      {
        id: 'det-4',
        class_id: 1,
        class_name: 'bicycle',
        confidence: 0.82,
        bounding_box: [1500, 520, 1780, 820],
        color: getClassColor('bicycle'),
      },
    ],
  },
  {
    id: 'traffic-scene',
    name: 'City Intersection.jpg',
    type: 'image',
    url: trafficSceneImg,
    dimensions: '1920 × 1080',
    size: '3.1 MB',
    defaultDetections: [
      {
        id: 'det-t1',
        class_id: 2,
        class_name: 'car',
        confidence: 0.95,
        bounding_box: [350, 520, 580, 710],
        color: getClassColor('car'),
      },
      {
        id: 'det-t2',
        class_id: 2,
        class_name: 'car',
        confidence: 0.89,
        bounding_box: [640, 550, 820, 680],
        color: getClassColor('car'),
      },
      {
        id: 'det-t3',
        class_id: 0,
        class_name: 'person',
        confidence: 0.84,
        bounding_box: [120, 540, 190, 720],
        color: getClassColor('person'),
      },
      {
        id: 'det-t4',
        class_id: 9,
        class_name: 'traffic_light',
        confidence: 0.91,
        bounding_box: [290, 310, 340, 430],
        color: getClassColor('traffic_light'),
      },
    ],
  },
  {
    id: 'office-scene',
    name: 'Office Desk.jpg',
    type: 'image',
    url: officeSceneImg,
    dimensions: '1920 × 1080',
    size: '2.8 MB',
    defaultDetections: [
      {
        id: 'det-o1',
        class_id: 63,
        class_name: 'laptop',
        confidence: 0.96,
        bounding_box: [380, 460, 680, 720],
        color: getClassColor('laptop'),
      },
      {
        id: 'det-o2',
        class_id: 64,
        class_name: 'mouse',
        confidence: 0.89,
        bounding_box: [720, 580, 810, 670],
        color: getClassColor('mouse'),
      },
      {
        id: 'det-o3',
        class_id: 41,
        class_name: 'cup',
        confidence: 0.92,
        bounding_box: [240, 520, 320, 640],
        color: getClassColor('cup'),
      },
      {
        id: 'det-o4',
        class_id: 67,
        class_name: 'cell_phone',
        confidence: 0.87,
        bounding_box: [840, 550, 930, 690],
        color: getClassColor('cell_phone'),
      },
    ],
  },
];
