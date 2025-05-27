"use client"

import { Loader2 } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import type { AppRouter } from "~/server/api/root"
import { api } from "~/trpc/react"
import AuthCallbackComponent from "../_components/AuthCallbackComponent"

export default function Page(){
    return (
      <Suspense fallback={""}>
        <AuthCallbackComponent />
      </Suspense>
    )
} 