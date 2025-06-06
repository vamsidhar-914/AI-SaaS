import { Loader2, MessageSquare } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import { INFINITE_QUERY_LIMIT } from "~/config/infiniteQueries";
import { api } from "~/trpc/react";
import  Message from "./Message";
import { useContext, useEffect, useRef, useState } from "react";
import { ChatContext } from "./ChatContext";
import { useIntersection } from "@mantine/hooks";

export default function Messages({ fileId }: { fileId: string }) {
  const { isLoading: isAiThinking } = useContext(ChatContext);
  const { data, isLoading, fetchNextPage } =
    api.file.getAllMessages.useInfiniteQuery(
      {
        fileId,
        limit: INFINITE_QUERY_LIMIT,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      },
    );

  const messages = data?.pages.flatMap((page) => page.messages);
  const loadingMessage = {
    createdAt: new Date().toISOString(),
    id: "loading-mesage",
    isUserMessage: false,
    text: (
      <span className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin" />
      </span>
    ),
  };

  const combinedMessages = [
    ...(isAiThinking ? [loadingMessage] : []),
    ...(messages ?? []),
  ];
  const lastMessageRef = useRef<HTMLDivElement>(null);
  const { ref,entry } = useIntersection({
    root: lastMessageRef.current,
    threshold: 1
  })

  useEffect(() => {
    if(entry?.isIntersecting){
        fetchNextPage()
    }
  },[entry,fetchNextPage])
 
  return (
    <div className="flex max-h-[calc(100vh-3.5rem-7rem)] border-zinc-200 flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb scrollbar-thumb-rounded scrollabar-track-blue-lighter scrollbar-w-2 scrollbar-touch">
      {combinedMessages && combinedMessages.length > 0 ? (
        combinedMessages.map((message, index) => {
          const isNextMsgSamePerson =
            combinedMessages[index - 1]?.isUserMessage ===
            combinedMessages[index]?.isUserMessage;

          if (index == combinedMessages.length - 1) {
            return (
                <>
                <Message    
                  key={message.id}
                  isNextMsgSamePerson={isNextMsgSamePerson}
                  message={message}
                  ref={ref}
                />
                </>
            );
          } else
            return (
              <Message
                message={message}
                isNextMsgSamePerson={isNextMsgSamePerson}
                key={message.id}
              />
            );
        })
      ) : isLoading ? (
        <div className="w-full flex flex-col gap-2">
          <Skeleton height={16} />
          <Skeleton height={16} />
          <Skeleton height={16} />
          <Skeleton height={16} />
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          <h3 className="font-semibold text-xl">you&apos;re all set!</h3>
          <p className="text-zinc-500 text-sm">
            Ask your first question to get started...
          </p>
        </div>
      )}
    </div>
  );
}
