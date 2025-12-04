import {
  generateUploadButton,
  generateUploadDropzone,
  generateReactHelpers,
} from "@uploadthing/react";

export const UploadButton = generateUploadButton();
export const UploadDropzone = generateUploadDropzone();

// Add this line to export the hook you are trying to use
export const { useUploadThing, uploadFiles } = generateReactHelpers();