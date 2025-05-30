"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import DropZone from "react-dropzone";
import { Cloud, File, Loader2 } from "lucide-react";
import { Progress } from "~/components/ui/progress";
import { useUploadThing } from "~/lib/uploadthing";
import { useToast } from "~/hooks/use-toast";
import { api } from "~/trpc/react";
import { useRouter } from "next/navigation";

function UploadDropZone() {
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const { startUpload ,routeConfig} = useUploadThing("pdfUploader");
  const trpcUtils = api.useUtils();
  const { mutate: startPolling } = api.file.getFile.useMutation({
    onSuccess(data) {
      router.push(`/dashboard/${data.id}`);
    },
    retry: true,
    retryDelay: 500,
  });

  const startSimulatedProgress = () => {
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 95) {
          clearInterval(interval);
          return prev;
        }
        return prev + 10;
      });
    }, 500);

    return interval;
  };

  return (
    <DropZone
      multiple={false}
      onDrop={async (acceptedFiles) => {
        setIsUploading(true);
        const progressInterval = startSimulatedProgress();
        console.log(routeConfig)

        // handle file upload logic here
        const res = await startUpload(acceptedFiles);
        if (!res) {
          return toast({
            title: "something went wrong",
            description: "Please try again later.",
            variant: "destructive",
          });
        }
        console.log("res", res);
        const serverData = res[0]?.serverData
        const [fileResponse] = res;
        const key = fileResponse?.key;
        if (!key) {
          return toast({
            title: "something went wrong",
            description: "please try again later",
            variant: "destructive",
          });
        }

        // polling process
        startPolling({ key });
        clearInterval(progressInterval);
        // trpcUtils.file.getUserFiles.invalidate()
        trpcUtils.file.getUserFiles.setData(undefined,(oldData) => {
            if(oldData == null || serverData == null) return;
            const newFile = {
                id: serverData.id,
                userId: serverData.userId,
                key: serverData.key,
                name: serverData.name,
                url: serverData.url,
                uploadStatus: serverData.uploadStatus,
                createdAt: new Date(serverData.createdAt),
                updatedAt: new Date(serverData.updatedAt),
            }
            return [newFile,...oldData]
        })
        setUploadProgress(100);
      }}
    >
      {({ getRootProps, getInputProps, acceptedFiles }) => (
        <div
          {...getRootProps()}
          className="border h-64 m-4 border-dashed border-gray-300 rounded-lg "
        >
          <div className="flex items-center justify-center h-full w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full h-full rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Cloud className="h-6 w-6 text-zinc-500 mb-2" />
                <p className="mb-2 text-sm text-zinc-700">
                  <span className="font-semibold">Click to upload</span>{" "}
                </p>
                <p className="text-xs text-zinc-500">PDF (p to 4mb)</p>
              </div>

              {acceptedFiles && acceptedFiles[0] ? (
                <div className="max-w-xs bg-white flex items-center rounded-md overflow-hidden outline outline-[1px] outline-zinc-200 divide-x divide-zinc-200">
                  <div className="px-3 py-2 h-full grid place items-center">
                    <File className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="px-3 py-2 h-full text-sm truncate">
                    {acceptedFiles[0].name}
                  </div>
                </div>
              ) : null}

              {isUploading ? (
                <div className="w-full mt-4 max-w-xs mx-auto">
                  <Progress
                    value={uploadProgress}
                    className="h-1 w-full bg-zinc-200"
                  />
                  {uploadProgress === 100 ?(
                    <div className="flex gap-1 items-center justify-center text-sm text-zinc-700 pt-2 text-center">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Redirecting...
                    </div>
                  ) : null}
                </div>
              ) : null}

              <input
                type="file"
                id="dropzone-file"
                className="hidden"
                {...getInputProps()}
              />
            </label>
          </div>
        </div>
      )}
    </DropZone>
  );
}

export default function UploadButton() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(v) => {
        if (!v) {
          setIsOpen(false);
        }
      }}
    >
      <DialogTrigger onClick={() => setIsOpen(true)} asChild>
        <Button>Upload Button</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogTitle>upload file</DialogTitle>
        <UploadDropZone />
      </DialogContent>
    </Dialog>
  );
}
