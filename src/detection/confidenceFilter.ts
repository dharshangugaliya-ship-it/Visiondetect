/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Detection } from './types';

/**
 * Filters detections according to the Master Base logic:
 * if confidence >= threshold: accept detection
 * else: reject detection
 */
export function filterByConfidence(
  detections: Detection[],
  threshold: number
): Detection[] {
  return detections.filter((d) => d.confidence >= threshold);
}
