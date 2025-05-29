import { getKindeServerSession } from '@kinde-oss/kinde-auth-nextjs/server'
import { NextRequest } from 'next/server'
import { SendMessageValidator } from '~/lib/validators/validator'
import { db } from '~/server/db'

export const POST = async (req: NextRequest) => {
    // endpoint for asking a question to a pdf file

    const body = await req.json()
    const { getUser } = getKindeServerSession()
    const user = await getUser()
    const userId = user?.id
    if(!userId) {
        return new Response("unAuthorized", { status: 401 })
    }
    const { message,fileId } = SendMessageValidator.parse(body)
    const file = await db.file.findFirst({
        where: {
            id: fileId,
            userId
        }
    })
    if(!file) return new Response("Not found", { status: 404 })
    await db.message.create({
        data: {
            isUserMessage: true,
            text: message,
            fileId,
            userId
        }
    })

    

    // AI Stuff (sementic query)
}