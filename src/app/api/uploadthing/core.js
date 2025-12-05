import { createUploadthing } from "uploadthing/next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const f = createUploadthing();

/**
 * Shared Auth Middleware
 * Verifies the user is logged in via NextAuth before allowing upload.
 */
const handleAuth = async () => {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    throw new Error("Unauthorized");
  }
  console.log(`[UploadThing] User ${session.user.id} is authenticated for upload.`);
  return { userId: session.user.id };
};

export const ourFileRouter = {
  // 1. Chat Attachments (Images, Audio, PDF)
  chatAttachment: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
    audio: { maxFileSize: "16MB", maxFileCount: 1 }, // Larger for voice notes
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log(`[UploadThing] Chat onUploadComplete invoked — metadata=${JSON.stringify(metadata)}, file=${JSON.stringify(file)}`);
        // Do any post-upload work here. Return value sent back to client as the
        // onClientUploadComplete response.
        return { uploadedBy: metadata?.userId, url: file?.url };
      } catch (err) {
        console.error('[UploadThing] Chat onUploadComplete ERROR', err);
        throw err; // rethrow so uploadthing knows it failed
      }
    }),

  // 2. User Profile Picture (Strictly Images)
  profilePicture: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async () => await handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      try {
        console.log(`[UploadThing] Profile onUploadComplete invoked — metadata=${JSON.stringify(metadata)}, file=${JSON.stringify(file)}`);
        // Update user model or trigger async jobs here if needed
        return { uploadedBy: metadata?.userId, url: file?.url };
      } catch (err) {
        console.error('[UploadThing] Profile onUploadComplete ERROR', err);
        throw err;
      }
    }),
};