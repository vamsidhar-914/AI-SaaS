import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";
import { INFINITE_QUERY_LIMIT } from "~/config/infiniteQueries";

export const fileRouter = createTRPCRouter({
    getUserFiles: protectedProcedure
        .query(async ({ ctx }) => {
            const userId = ctx.userId
            const files = await ctx.db.file.findMany({
                where: {
                    userId
                },
            })
            return files;
        }),
    deleteUserFile: protectedProcedure
        .input(z.object({
            id: z.string()
        }))
        .mutation(async ({ ctx ,input: { id } }) => {
            const userId = ctx.userId
            const file = await ctx.db.file.findFirst({
                where: {
                    id,
                    userId
                }
            })
            if(!file) {
                throw new TRPCError({ code: "NOT_FOUND" })
            }
            await ctx.db.file.delete({
                where:{
                    id,
                }
            })
            return { success: true}
        }),
    getFile: protectedProcedure
        .input(z.object({
            key: z.string()
        })).mutation(async ({ ctx,input: { key } }) => {
            const userId = ctx.userId
            const fileExists = await ctx.db.file.findFirst({
                where:{
                    key,
                    userId
                }
            })
            if(!fileExists){
                throw new TRPCError({ code: "NOT_FOUND" })
            }
            return fileExists;
        }),
    getFileUploadStatus: protectedProcedure
        .input(z.object({
            fileId: z.string()
        })).query(async ({ ctx,input: { fileId } }) => {
            const file = await ctx.db.file.findFirst({
                where: {
                    id: fileId,
                    userId: ctx.userId
                }
            })
            if(!file) {
                return { status: "PENDING" as const }
            }
            return { status: file.uploadStatus }
        }),
    getAllMessages: protectedProcedure
        .input(z.object({
            fileId: z.string(),
            limit: z.number().min(1).max(100).nullish(),
            cursor: z.string().nullish()
        })).query(async ({ ctx,input }) => {
            const { fileId,cursor } = input
            const { userId } = ctx
            const limit = input.limit ?? INFINITE_QUERY_LIMIT

            const file = await ctx.db.file.findFirst({
                where: {
                    id: input.fileId,
                    userId
                }
            })
            if(!file) throw new TRPCError({ code:"NOT_FOUND" })
            const messages = await ctx.db.message.findMany({
        take: limit +1,
                where: {
                    fileId
                },
                orderBy: {
                    createdAt: "desc"
                },
                cursor: cursor ? { id: cursor } : undefined,
                select: {
                    id: true,
                    isUserMessage: true,
                    createdAt: true,
                    text: true
                }
            })
            let nextCursor: typeof cursor | undefined = undefined
            if(messages.length > limit){
                const nextItem = messages.pop()
                nextCursor = nextItem?.id
            }
            return {
                messages,
                nextCursor
            }
        })
})