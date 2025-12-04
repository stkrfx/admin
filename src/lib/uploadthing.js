import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

export const UploadButton = generateUploadButton();
export const UploadDropzone = generateUploadDropzone();

// CRITICAL: Export the hook here
export const { useUploadThing, uploadFiles } = generateReactHelpers();