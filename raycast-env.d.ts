/// <reference types="@raycast/api">

/* 🚧 🚧 🚧
 * This file is auto-generated from the extension's manifest.
 * Do not modify manually. Instead, update the `package.json` file.
 * 🚧 🚧 🚧 */

/* eslint-disable @typescript-eslint/ban-types */

type ExtensionPreferences = {
  /** Projects File - Path to file containing project directories (one per line) */
  "projectsFile": string
}

/** Preferences accessible in all the extension's commands */
declare type Preferences = ExtensionPreferences

declare namespace Preferences {
  /** Preferences accessible in the `claude-picker` command */
  export type ClaudePicker = ExtensionPreferences & {}
  /** Preferences accessible in the `codex-picker` command */
  export type CodexPicker = ExtensionPreferences & {}
}

declare namespace Arguments {
  /** Arguments passed to the `claude-picker` command */
  export type ClaudePicker = {}
  /** Arguments passed to the `codex-picker` command */
  export type CodexPicker = {}
}

