/**
 * Shared TypeScript types for Kiro Workers
 *
 * This module contains common type definitions used across all actions.
 */

/**
 * Supported platforms for Kiro CLI binary downloads
 */
export type Platform = 'linux' | 'darwin' | 'win32';

/**
 * Supported architectures for Kiro CLI binary downloads
 */
export type Architecture = 'x64' | 'arm64';

/**
 * Platform information for binary selection
 */
export interface PlatformInfo {
  platform: Platform;
  arch: Architecture;
}

/**
 * Error codes for action failures
 */
export enum ActionErrorCode {
  DOWNLOAD_FAILED = 1,
  CHECKSUM_MISMATCH = 2,
  INSTALLATION_FAILED = 3,
  CLI_NOT_FOUND = 4,
  AUTHENTICATION_FAILED = 5,
  GITHUB_API_ERROR = 6,
  INVALID_INPUT = 7,
  UNKNOWN_ERROR = 99,
}

/**
 * Custom error class for action failures
 */
export class ActionError extends Error {
  constructor(
    message: string,
    public readonly code: ActionErrorCode,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'ActionError';
    Object.setPrototypeOf(this, ActionError.prototype);
  }
}

/**
 * Agent configuration structure
 */
export interface AgentConfig {
  name: string;
  version: string;
  description?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: unknown;
}

/**
 * Agent prompt and configuration
 */
export interface Agent {
  prompt: string;
  config: AgentConfig;
  customCode?: string;
}

/**
 * Agent type for different actions
 */
export type AgentType = 'pull-request' | 'issue' | 'project';

/**
 * GitHub PR context
 */
export interface PRContext {
  number: number;
  title: string;
  body: string;
  author: string;
  changedFiles: string[];
  additions: number;
  deletions: number;
  commits: number;
}

/**
 * GitHub Issue context
 */
export interface IssueContext {
  number: number;
  title: string;
  body: string;
  author: string;
  labels: string[];
  state: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Task status in tasks.md
 */
export type TaskStatus = 'not_started' | 'in_progress' | 'completed';

/**
 * Parsed task from tasks.md
 */
export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  optional: boolean;
  requirements: string[];
  subtasks?: Task[];
}

/**
 * Download options
 */
export interface DownloadOptions {
  url: string;
  destination: string;
  maxRetries?: number;
  retryDelay?: number;
}

/**
 * Checksum verification options
 */
export interface ChecksumOptions {
  filePath: string;
  expectedChecksum: string;
  algorithm?: 'sha256' | 'sha512';
}
