import type { inferRouterOutputs } from "@trpc/server";
import type { JSX } from "react";
import type { AppRouter } from "~/server/api/root";

type RouterOutput = inferRouterOutputs<AppRouter>
type Messages = RouterOutput["file"]["getAllMessages"]

type OmitText = Omit<Messages["messages"][number], "text" | "createdAt">
type ExtendedText = {
    text: string | JSX.Element
}
type ExtendedDate = {
    createdAt: string | Date
}
export type ExtendedMessage = OmitText & ExtendedText & ExtendedDate