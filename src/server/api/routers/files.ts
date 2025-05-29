import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "../trpc";
import { TRPCError } from "@trpc/server";

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
        })
})