import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { TRPCError } from "@trpc/server";

export const apiRouter = createTRPCRouter({
    authCallback: publicProcedure
        .query(async ({ ctx }) => {
            const { getUser } = getKindeServerSession()
            const user = await getUser();

            if(!user || !user.id || !user.email) {
              throw new TRPCError({ code: 'UNAUTHORIZED' })
            }
            const dbUser = await ctx.db.user.findUnique({
              where: { id: user.id }
            })
            if(!dbUser){
              await ctx.db.user.create({
                data: {
                  id: user.id,
                  email: user.email
                }
              })
            }
            return { success: true }
        })
})