import { useMutation } from "@tanstack/react-query";
import { createContext, useState, type ReactNode } from "react";
import { toast } from "~/hooks/use-toast";

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

export const ChatContextProvider = ({ fileId,children }: Props) => {
    const [message, setMessage] = useState<string>("")
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const { mutate: sendMessage } = useMutation({
        mutationFn: async ({ message }: { message: string }) => {
            const res = await fetch("/api/message", {
                method: "POST",
                body: JSON.stringify({
                    fileId,
                    message
                })
            })
            if(!res.ok){
                throw new Error("failed to send a message")
            }
            return res.body
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

        </ChatContext.Provider>
    )
}