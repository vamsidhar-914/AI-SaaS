"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect } from "react"
import type { AppRouter } from "~/server/api/root"
import { api } from "~/trpc/react"

export default function Page(){
    const router = useRouter()
    const searchParams = useSearchParams()
    const origin = searchParams.get("origin")

    const { data,isLoading ,error} = api.user.authCallback.useQuery(undefined, {
        retry: true,
        retryDelay: 500,

    });
    useEffect(() => {
        if (data?.success) {
          router.push(origin ? `/${origin}` : "/dashboard")
        } else if (error?.data?.code === "UNAUTHORIZED") {
          router.push("/sign-in")
        }
      }, [data, error, origin, router])

    if(isLoading) return null


    return(
        <div className="w-full mt-24 flex justify-center">
            <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-800"  />
                <h3 className="font-semibold text-xl">Setting up your account</h3>
                <p>You will be redirecte automatically</p>
            </div>
        </div>
    )
} 