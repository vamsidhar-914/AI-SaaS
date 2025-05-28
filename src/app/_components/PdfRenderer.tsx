"use client";

import {
  ChevronDown,
  ChevronUp,
  Expand,
  Loader2,
  RotateCcw,
  Search,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { toast } from "~/hooks/use-toast";
import { useResizeDetector } from "react-resize-detector";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useState } from "react";
import { set } from "date-fns";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "~/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import SimpleBar from "simplebar-react";
import { Dialog, DialogContent } from "~/components/ui/dialog";
import { DialogTrigger } from "@radix-ui/react-dialog";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`;

export default function PdfRenderer({ url }: { url: string }) {
  const [pages, setPages] = useState<number>();
  const [currPage, setCurrPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const { width, ref } = useResizeDetector();

  const [renderedScale, setRenderedScale] = useState<number | null>(null)
  const isLoading = renderedScale !== scale

  const CustomPageValidator = z.object({
    page: z.string().refine((num) => Number(num) > 0 && Number(num) <= pages!), // string to number
  });

  type TCustomPageValidator = z.infer<typeof CustomPageValidator>;

  const {
    register,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm<TCustomPageValidator>({
    defaultValues: {
      page: "1",
    },
    resolver: zodResolver(CustomPageValidator),
  });

  const handlePageSubmit = ({ page }: TCustomPageValidator) => {
    setCurrPage(Number(page));
    setValue("page", String(page));
  };

  return (
    <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
      <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
        <div className="flex items-center gap-1.5">
          <Button
            disabled={currPage <= 1}
            variant={"ghost"}
            aria-label="previous page"
            onClick={() => {
              setCurrPage((prev) => (prev - 1 > 1 ? prev - 1 : 1));
              setValue("page", String(currPage - 1))
            }}
          >
            <ChevronDown className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-1.5">
            <Input
              {...register("page")}
              className={cn(
                "w-12 h-8",
                errors.page && "focus-visible:ring-red-500",
              )}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSubmit(handlePageSubmit)();
                }
              }}
            />
            <p className="text-zinc-700 text-sm space-x-1">
              <span></span>
              <span>{pages ?? "x"}</span>
            </p>
          </div>
          <Button
            disabled={pages === undefined || currPage === pages}
            onClick={() =>{
                setCurrPage((prev) => (prev + 1 > pages! ? pages! : prev + 1))
                setValue("page",String(currPage + 1))
            }
            }
            variant={"ghost"}
            aria-label="next page"
          >
            <ChevronUp className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="gap-1.5" aria-label="zoom" variant="ghost">
                <Search className="h-4 w-4" />
                {scale * 100}% <ChevronDown className="h-3 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setScale(1)}>
                100%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(1.5)}>
                150%
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setScale(2)}>
                200%
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button
            onClick={() => setRotation((prev) => prev + 90)}
            aria-label="rotate 90 degrees"
            variant="ghost"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>

          <PdfFullScreen url={url} />
        </div>
      </div>

      <div className="flex-1 w-full max-h-screen">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)]">
          <div ref={ref}>
            <Document
              loading={
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              }
              onLoadError={(error) => {
                toast({
                  title: "something went wronog",
                  description: error.message,
                  variant: "destructive",
                });
              }}
              onLoadSuccess={({ numPages }) => {
                setPages(numPages);
              }}
              file={url}
              className="max-h-full"
            >
              {isLoading && renderedScale ? <Page
                width={width ? width : 1}
                pageNumber={currPage}
                scale={scale}
                key={"@"+renderedScale}
                rotate={rotation}
              /> : null}
              <Page
              className={cn(isLoading ? "hidden" : "")}
              loading= {
                <div className="flex justify-center">
                    <Loader2 className="my-24 h-6 w-6 animate-spin" />
                </div>
              }
                width={width ? width : 1}
                pageNumber={currPage}
                scale={scale}
                rotate={rotation}
                key={"@" + scale}
                onRenderSuccess={() => setRenderedScale(scale)}
              />
            </Document>
          </div>
        </SimpleBar>
      </div>
    </div>
  );
}

function PdfFullScreen({ url }: { url: string }) {
  const [fullScreen, setFullScreen] = useState(false);
  const [currPage, setCurrPage] = useState<number>(1);
  const [pages, setPages] = useState<number>();
  const { width, ref } = useResizeDetector();
  return (
    <Dialog
      open={fullScreen}
      onOpenChange={(v) => {
        if (!v) {
          setFullScreen(v);
        }
      }}
    >
      <DialogTrigger onClick={() => setFullScreen(true)} asChild>
        <Button  aria-label="fullscreen" className="gap-1.5" variant="ghost">
          <Expand className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-7xl w-full">
        <SimpleBar autoHide={false} className="max-h-[calc(100vh-10rem)] mt-6">
          <div ref={ref}>
            <Document
              loading={
                <div className="flex justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                </div>
              }
              onLoadError={(error) => {
                toast({
                  title: "something went wronog",
                  description: error.message,
                  variant: "destructive",
                });
              }}
              onLoadSuccess={({ numPages }) => {
                setPages(numPages);
              }}
              file={url}
              className="max-h-full"
            >
              <Page width={width ? width : 1} pageNumber={currPage} />
              {new Array(pages).fill(0).map((_, i) => (
                <Page key={i} width={width ? width : 1} pageNumber={i + 1} />
              ))}
            </Document>
          </div>
        </SimpleBar>
      </DialogContent>
    </Dialog>
  );
}
