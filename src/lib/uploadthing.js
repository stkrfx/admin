import { generateReactHelpers } from "@uploadthing/react";

/**
 * Core UploadThing helpers for the client.
 * - useUploadThing: Hook for custom upload flows (chat, profile pic).
 * - uploadFiles: Imperative upload function.
 */
export const { useUploadThing, uploadFiles } = generateReactHelpers();