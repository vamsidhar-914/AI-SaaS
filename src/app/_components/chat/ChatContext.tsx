import { useMutation } from "@tanstack/react-query";
import { createContext, useRef, useState, type ReactNode } from "react";
import { INFINITE_QUERY_LIMIT } from "~/config/infiniteQueries";
import { env } from "~/env";
import { toast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";

type StreamResponse = {
    addMessage: () => void,
    message: string
    handleInputChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void,
    isLoading: boolean
}

export const ChatContext = createContext<StreamResponse>({
    addMessage: () => {},
    message: "",
    handleInputChange: () => {},
    isLoading: false
})

type Props = {
    fileId : string
    children: ReactNode
}

const url = env.PRODUCTION_URL

export const ChatContextProvider = ({ fileId,children }: Props) => {
    const [message, setMessage] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const backUpMessage = useRef("")
    const trpcUtils = api.useUtils()
    const { mutate: sendMessage } = useMutation({
        mutationFn: async ({ message }: { message: string }) => {
            const res = await fetch(url, {
                method: "POST",
                body: JSON.stringify({
                    fileId,
                    message
                })
            })
            if(!res.ok){  
                throw new Error("failed to send a message")
            }
            const response = await res.json()

            return response
        },
        onMutate: async ({ message }) => {
            backUpMessage.current = message
            setMessage("")
            // cancel outgoing refetches
            await trpcUtils.file.getAllMessages.cancel()
            const prevMessages = trpcUtils.file.getAllMessages.getInfiniteData()
            trpcUtils.file.getAllMessages.setInfiniteData({ fileId,limit: INFINITE_QUERY_LIMIT},(oldData) => {
                if(oldData == null || oldData.pages[0] == null){
                    return
                }
                // let newPages = [...oldData.pages]
                // let latestPage = newPages[0]!
                // latestPage.messages = [
                //     {
                //         createdAt: new Date(),
                //         id: crypto.randomUUID(),
                //         text:message,
                //         isUserMessage: true
                //     },
                //     ...latestPage.messages
                // ]
                // newPages[0] = latestPage
                // return {
                //     ...oldData,
                //     pages: newPages
                // }
                const newMessage = {
                    createdAt: new Date(),
                    id: crypto.randomUUID(),
                    text:message,
                    isUserMessage: true   
                }
                return{
                    ...oldData,
                    pages: [
                        {
                            ...oldData.pages[0],
                            messages: [newMessage,...oldData.pages[0].messages]
                        },
                        ...oldData.pages.slice(1)
                    ]
                }
            })
            setIsLoading(true)

            return{
                prevMessages: prevMessages?.pages.flatMap((page) => page.messages) ?? []
            }
        },
        onSuccess: async (stream) => {
            setIsLoading(false)
            if(!stream){
                return toast({
                    title: "there was a problem sending this message",
                    description: "please refresh the page and try again"
                })
            }
            // const reader =  stream.getReader()
            // const decoder = new TextDecoder()
            // let done = false
            
            // let accResponse = ""
            // while(!done){
            //     const { value, done: doneReading } = await reader.read()
            //     done = doneReading;
            //     const chunkValue = decoder.decode(value)

            //     accResponse += chunkValue

            //     // append the chunk to actual method
            //     trpcUtils.file.getAllMessages.setInfiniteData({ fileId,limit: INFINITE_QUERY_LIMIT }, (oldData) => {
            //         if(oldData == null) {
            //             return
            //         }
            //         let isAiResponseCreated = oldData.pages.some((page) => page.messages.some((message) => message.id === "ai-response"))
            //         let updatedPages = oldData.pages.map((page) => {
            //             if(page == oldData.pages[0]){
            //                 let updatedMessages;

            //                 if(!isAiResponseCreated){
            //                     updatedMessages = [
            //                         {
            //                             createdAt: new Date(),
            //                             id: "ai-response",
            //                             text: accResponse,
            //                             isUserMessage: false
            //                         },
            //                         ...page.messages
            //                     ]   
            //                 }else{
            //                     updatedMessages = page.messages.map((message) => {
            //                         if(message.id === 'ai-response'){
            //                             return {
            //                                 ...message,
            //                                 text: accResponse
            //                             }
            //                         }
            //                         return message;
            //                     })
            //                 }
            //                 return {
            //                     ...page,
            //                     messages: updatedMessages
            //                 }
            //             }
            //             return page
            //         })
            //     return { ...oldData,pages: updatedPages }  
            //     })
            // }
            trpcUtils.file.getAllMessages.setInfiniteData({ fileId,limit: INFINITE_QUERY_LIMIT },(oldData) => {
                if(oldData == null || oldData.pages[0] == null){
                    return;
                }
                const newAiMessage  = {
                     createdAt: new Date(),
                                        id: "ai-response",
                                        text: stream,
                                        isUserMessage: false
                }
                return{
                    ...oldData,
                    pages: [
                        {
                            ...oldData.pages[0],
                            messages: [newAiMessage,...oldData.pages[0].messages]
                        },
                        ...oldData.pages.slice(1)
                    ]
                }

            })
        },
        onError(error, variables, context) {
            setMessage(backUpMessage.current)
            // trpcUtils.file.getAllMessages.setData({ fileId },{
            //     messages: context?.prevMessages! ?? [],
            //     nextCursor: undefined
            // })
        },
        onSettled: async () => {
            setIsLoading(false)
            await trpcUtils.file.getAllMessages.invalidate({ fileId })
        }
    })

    const addMessage = () => sendMessage({ message })
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value)
    }
    

    return (
        <ChatContext.Provider value={{
            addMessage,
            message,
            handleInputChange,
            isLoading
        }}>     
        {children}
        </ChatContext.Provider>
    )
}