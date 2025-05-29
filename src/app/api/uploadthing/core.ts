import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { db } from "~/server/db";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { PineconeStore } from '@langchain/pinecone'
import { pc } from "~/lib/pinecone";
import { toast } from "~/hooks/use-toast";
import { OllamaEmbeddings } from "@langchain/ollama"


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

        // langchain
        try{
          const response = await fetch(createdFile.url)
          const blob = await response.blob()
          const loader = new PDFLoader(blob);
          const pageLevelDocs = await loader.load()
          const pagesAmt = pageLevelDocs.length
          
          // vectorize and index entire document
          const pineconeIndex = pc.Index("chatdoc-saas")
              const embeddings = new OllamaEmbeddings({
                  model: "llama3.2:latest", // Default value
                  baseUrl: "http://localhost:11434", // Default value
                });
          await PineconeStore.fromDocuments(pageLevelDocs,embeddings,{
            //@ts-ignore
            pineconeIndex,
            namespace: createdFile.id
          })

          await db.file.update({
            data: {
              uploadStatus: "COMPLETED"
            },
            where: {
              id: createdFile.id
            }
          })
          console.log("indexing done")
        }catch(err){
          console.log("indexing failed", err)
          await db.file.update({
            where: {
              id: createdFile.id
            },
            data: {
              uploadStatus: "FAILED"
            }
          })
        }

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
