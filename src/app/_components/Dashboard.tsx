"use client";

import { api } from "~/trpc/react";
import UploadButton from "./UploadButton";
import { Ghost, Loader2, MessagesSquare, Plus, TrashIcon } from "lucide-react";
import Skeleton from "react-loading-skeleton";
import Link from "next/link";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import { useState } from "react";

export default function Dashboard() {
    const [currentlyDeleting, setCurrentlyDeleting] = useState<string | null>(null); 
const trpcUtils = api.useUtils()
  const { data: files, isLoading } = api.file.getUserFiles.useQuery();
  const { mutate: deleteFile,isPending,error } = api.file.deleteUserFile.useMutation({
    onSuccess(data, variables, context) {
      trpcUtils.file.getUserFiles.invalidate()
      // trpcUtils.file.getUserFiles.setData(undefined, (oldData) => {
      //   if(oldData == null || oldData.length === 0){
      //     return;
      //   }
      //   return {
      //     ...oldData.filter((file) => file.id != variables.id )
      //   }
      // })
    },
    onMutate({ id }){
        setCurrentlyDeleting(id)
    },
    onSettled(){
        setCurrentlyDeleting(null)
    }
  });
  

  return (
    <main className="mx-auto max-w-7xl md:p-10">
      <div className="mt-8 flex flex-col items-stat justify-between gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:gap-0">
        <h1 className="font-bold mb-3 text-5xl text-gray-900">my files</h1>

        <UploadButton />
      </div>
      {/* display files */}
      {files && files.length > 0 ? (
        <ul className="mt-8 grid grid-cols-1 gap-6 divide-y divide-zinc-200 sm:grid-cols-2 lg:grid-cols-3">
          {files
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .map((file) => (
              <li
                key={file.id}
                className="col-span-1 divide-y divide-gray-200 rounded-lg bg-white shadow transition hover:shadow-lg"
              >
                <Link
                  href={`/dashboard/${file.id}`}
                  className="flex flex-col gap-2"
                >
                  <div className="pt-6 px-6 flex w-full items-center justify-between space-x-6">
                    <div className="h-10 w-10 flex-shrink-0 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                      <div className="flex-1 truncate">
                        <div className="flex items-center space-x-3">
                          <h3 className="truncate text-lg font-medium text-zinc-900">
                            {file.name}
                          </h3>
                        </div>
                      </div>
                  </div>
                </Link>
                <div className="px-6 mt-4 grid grid-cols-3 place-items-center py-2 gap-6 text-xs text-zinc-500">
                    <div className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        {format(new Date(file.createdAt), "MMM yyyy")}
                    </div>
                    <div className="flex items-center gap-2">
                        <MessagesSquare className="h-4 w-4" />
                        mocked
                    </div>
                    <Button size={"sm"} className="w-full" variant={"destructive"} onClick={() => deleteFile({ id: file.id })}>
                       {currentlyDeleting === file.id ? (
                        <Loader2  className="w-4 h-4 animate-spin"/>
                    ) :  <TrashIcon className="h-4 w-4" />}
                    </Button>
                </div>
                
              </li>
            ))}
        </ul>
      ) : isLoading ? (
        <Skeleton height={100} className="my-2 " count={3} />
      )  :(
        <div className="mt-16 flex flex-col items-center gap-2">
          <Ghost className="h-8 w-8 text-zinc-800" />
          <h3 className="font-semibold text-xl">Pretty empty around here</h3>
          <p>Let&apos;s uplaod your first PDF</p>
        </div>)}

    </main>
  );
}
