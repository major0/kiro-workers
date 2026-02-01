/**
 * Download utility for Kiro CLI binary downloads
 *
 * This module provides functions for downloading files with retry logic,
 * exponential backoff, and platform detection for binary selection.
 *
 * Key features:
 * - Automatic retry with exponential backoff for transient failures
 * - Streaming downloads to handle large files efficiently
 * - Platform and architecture detection for cross-platform support
 * - Automatic directory creation for destination paths
 * - Smart error handling (no retry on 4xx client errors except 429)
 *
 * Requirements: 1.1, 9.4
 *
 * @module shared/utils/download
 */

import * as core from '@actions/core';
import * as httpm from '@actions/http-client';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import { pipeline } from 'stream';
import type { PlatformInfo, Platform, Architecture } from '../types/index.js';

const pipelineAsync = promisify(pipeline);

/**
 * Default retry configuration
 *
 * These constants define the default behavior for download retry logic:
 * - DEFAULT_MAX_RETRIES: Maximum number of retry attempts (3 retries = 4 total attempts)
 * - DEFAULT_RETRY_DELAY_MS: Initial delay before first retry (1 second)
 * - BACKOFF_MULTIPLIER: Exponential backoff multiplier (doubles delay each retry)
 */
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_RETRY_DELAY_MS = 1000;
const BACKOFF_MULTIPLIER = 2;

/**
 * Download a file from a URL with retry logic and exponential backoff
 *
 * This function implements automatic retry with exponential backoff for transient
 * failures. It will not retry on 4xx client errors (except 429 rate limiting).
 * The destination directory is created automatically if it doesn't exist.
 *
 * Retry behavior:
 * - Attempt 1: Immediate
 * - Attempt 2: After 1000ms (retryDelayMs)
 * - Attempt 3: After 2000ms (retryDelayMs * 2)
 * - Attempt 4: After 4000ms (retryDelayMs * 4)
 *
 * @param url - The URL to download from
 * @param destPath - The destination file path (directory will be created if needed)
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelayMs - Initial retry delay in milliseconds (default: 1000)
 * @returns Promise that resolves when download completes successfully
 * @throws Error if download fails after all retries or on non-retryable errors (4xx)
 *
 * @example
 * ```typescript
 * await downloadFile(
 *   'https://example.com/file.tar.gz',
 *   '/tmp/downloads/file.tar.gz',
 *   3,
 *   1000
 * );
 * ```
 */
export async function downloadFile(
  url: string,
  destPath: string,
  maxRetries: number = DEFAULT_MAX_RETRIES,
  retryDelayMs: number = DEFAULT_RETRY_DELAY_MS
): Promise<void> {
  const client = new httpm.HttpClient('kiro-workers', undefined, {
    allowRetries: false, // We handle retries manually for better control
  });

  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 0) {
        const delay = retryDelayMs * Math.pow(BACKOFF_MULTIPLIER, attempt - 1);
        core.info(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms delay...`);
        await sleep(delay);
      }

      core.info(`Downloading from ${url}...`);

      const response = await client.get(url);

      if (response.message.statusCode !== 200) {
        throw new Error(`HTTP ${response.message.statusCode}: ${response.message.statusMessage}`);
      }

      // Ensure destination directory exists
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }

      // Stream response to file
      const fileStream = fs.createWriteStream(destPath);
      await pipelineAsync(response.message, fileStream);

      core.info(`Successfully downloaded to ${destPath}`);
      return;
    } catch (error) {
      lastError = error as Error;
      core.warning(
        `Download attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}`
      );

      // Don't retry on 404 or other client errors
      if (lastError.message.includes('HTTP 4') && !lastError.message.includes('429')) {
        throw lastError;
      }

      // If this was the last attempt, throw the error
      if (attempt >= maxRetries) {
        throw new Error(
          `Failed to download after ${maxRetries + 1} attempts: ${lastError.message}`
        );
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Download failed for unknown reason');
}

/**
 * Get the current platform and architecture information
 *
 * Maps Node.js platform/arch values to Kiro CLI binary naming convention.
 * This is used to determine which binary variant to download.
 *
 * Supported platforms:
 * - linux (Node.js 'linux')
 * - darwin (Node.js 'darwin' - macOS)
 * - win32 (Node.js 'win32' - Windows)
 *
 * Supported architectures:
 * - x64 (Node.js 'x64' - 64-bit Intel/AMD)
 * - arm64 (Node.js 'arm64' - 64-bit ARM, e.g., Apple Silicon)
 *
 * @returns Platform information object with platform and arch properties
 * @throws Error if the current platform or architecture is unsupported
 *
 * @example
 * ```typescript
 * const { platform, arch } = getPlatform();
 * // On macOS M1: { platform: 'darwin', arch: 'arm64' }
 * // On Linux x64: { platform: 'linux', arch: 'x64' }
 * ```
 */
export function getPlatform(): PlatformInfo {
  const nodePlatform = process.platform;
  const nodeArch = process.arch;

  // Map Node.js platform to Kiro CLI platform naming
  let platform: Platform;
  switch (nodePlatform) {
    case 'linux':
      platform = 'linux';
      break;
    case 'darwin':
      platform = 'darwin';
      break;
    case 'win32':
      platform = 'win32';
      break;
    default:
      throw new Error(`Unsupported platform: ${nodePlatform}`);
  }

  // Map Node.js architecture to Kiro CLI architecture naming
  let arch: Architecture;
  switch (nodeArch) {
    case 'x64':
      arch = 'x64';
      break;
    case 'arm64':
      arch = 'arm64';
      break;
    default:
      throw new Error(`Unsupported architecture: ${nodeArch}`);
  }

  return { platform, arch };
}

/**
 * Sleep for a specified duration
 *
 * Utility function for implementing delays between retry attempts.
 * Uses setTimeout wrapped in a Promise for async/await compatibility.
 *
 * @param ms - Duration in milliseconds to sleep
 * @returns Promise that resolves after the specified delay
 *
 * @example
 * ```typescript
 * await sleep(1000); // Wait 1 second
 * ```
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
