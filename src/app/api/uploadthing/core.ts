import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { db } from "~/server/db";

const f = createUploadthing();


// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  pdfUploader : f({
    pdf: {
      maxFileSize: "4MB", 
      maxFileCount: 1,
    },
  })
    .middleware(async ({ req }) => {
        const { getUser } = getKindeServerSession()
        const user = await getUser()
        if(!user || !user.id) throw new UploadThingError("Unauthorized");
      return { userId : user.id }
    })
    .onUploadComplete(async ({ metadata, file }) => {
        const createdFile = await db.file.create({
          data: {
            key: file.key,
            name: file.name,
            userId: metadata.userId,
            url: file.ufsUrl,
            uploadStatus: "PROCESSING"
          }
        })
        return {
          id: createdFile.id,
          userId: createdFile.userId,
          key: createdFile.key,
          name: createdFile.name,
          url: createdFile.url,
          uploadStatus: createdFile.uploadStatus,
          createdAt: createdFile.createdAt.toISOString(),
          updatedAt: createdFile.updatedAt.toISOString(),
        }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
