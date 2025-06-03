import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { db } from "~/server/db";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf"
import { WatsonxEmbeddings } from "@langchain/community/embeddings/ibm"
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter'
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase"
import { createClient } from "@supabase/supabase-js"
import { env } from "~/env";


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
          const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200
          })

            const response = await fetch(createdFile.url)
            const blob = await response.blob()
            const loader = new PDFLoader(blob);
            const pageLevelDocs = await loader.load()
            const pagesAmt = pageLevelDocs.length

            const supabaseClient = createClient(
              env.SUPABASE_URL,
              env.SUPABASE_PRIVATE_KEY
            )
                const embeddings = new WatsonxEmbeddings({
                  watsonxAIAuthType:"iam",
                  watsonxAIApikey: env.WATSONX_API_KEY,
                  projectId: env.WATSONX_PROJECT_ID,
                  model:"intfloat/multilingual-e5-large",
                  serviceUrl: env.WATSONX_SERVICE_URL,
                  version: "2022-01-01"
                })

            
            let chunkdocs = []
            for(const pageDoc of pageLevelDocs){
              const chunks = await textSplitter.splitText(pageDoc.pageContent)
              for(const chunk of chunks){
                chunkdocs.push({
                  ...pageDoc,
                  pageContent: chunk,
                  metadata: {
                    ...pageDoc.metadata,
                    fileId: createdFile.id
                  }
                })
              }
            }
            await SupabaseVectorStore.fromDocuments(chunkdocs,embeddings,
              { 
              client: supabaseClient,
              tableName: 'documents',
              queryName: "match_documents"
            })

          await db.file.update({
            data: {
              uploadStatus: "COMPLETED"
            },
            where: {
              id: createdFile.id
            }
          })
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
