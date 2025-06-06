import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server"
import { notFound, redirect } from "next/navigation"
import ChatWrapper from "~/app/_components/chat/ChatWrapper"
import PdfRenderer from "~/app/_components/PdfRenderer"
import { db } from "~/server/db"

type PageProps = {
    params: {
        fileId: string
    }
}

export default async function FilePage({ params }:  PageProps ){
    const { fileId } = params 
    const { getUser } = getKindeServerSession()
    const user = await getUser()
     if(!user || !user.id) redirect(`/auth-callback?origin=dashboard/${fileId}`)

    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId: user.id
        }
    })
    if(!file) notFound()
    return(
        <div className="flex-1 justify flex flex-col h-[calc(100vh-3.5rem)]">
            <div className="mx-auto w-full max-w-8xl grow lg:flex xl:px-2">
                {/* left side */}
                <div className="flex-1 xl:flex">
                    <div className="px-4 py-6 sm:px-6 lg-pl-8 xl:flex-1 xl:pl-6">
                        <PdfRenderer url={file.url} />
                    </div>
                </div>

                {/* right side */}
                <div className="shrink-0 flex-[0.75] border-t border-gray-200 lg:w-96 lg-border-l lg:border-t-0">
                    <ChatWrapper fileId={fileId}  />
                </div>
            </div>
        </div>
    )
}