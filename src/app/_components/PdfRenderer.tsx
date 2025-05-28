"use client";

import { ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { Document, Page ,pdfjs} from "react-pdf"

import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";
import { toast } from "~/hooks/use-toast";
import { useResizeDetector } from 'react-resize-detector'
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { useState } from "react";
import { set } from "date-fns";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.mjs`


export default function PdfRenderer({ url }: { url: string }){
    const [pages, setPages] = useState<number>();
    const [currPage,setCurrPage] = useState<number>(1)
    const {width,ref} = useResizeDetector()
    return (
        <div className="w-full bg-white rounded-md shadow flex flex-col items-center">
            <div className="h-14 w-full border-b border-zinc-200 flex items-center justify-between px-2">
                <div className="flex items-center gap-1.5">
                  <Button disabled={currPage <= 1} variant={"ghost"} aria-label="previous page" onClick={() => {
                    setCurrPage((prev) => (prev - 1  > 1 ? prev - 1 : 1 ))
                  }}>
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                    <div className="flex items-center gap-1.5">
                        <Input className="w-12 h-8" value={currPage} defaultValue={currPage} />
                        <p className="text-zinc-700 text-sm space-x-1">
                            <span></span>
                            <span>{pages ?? "x"}</span>
                        </p>
                    </div>
                    <Button disabled={pages === undefined || currPage === pages} onClick={() => setCurrPage((prev) => prev + 1 > pages! ? pages! : prev + 1)} variant={"ghost"} aria-label="next page">
                        <ChevronUp className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="flex-1 w-full max-h-screen">
                <div ref={ref}>
                    <Document loading={
                        <div className="flex justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                    } 
                    onLoadError={(error) => {
                        toast({
                            title: "something went wronog",
                            description: error.message,
                            variant: "destructive"
                        })
                    }}
                    onLoadSuccess={({ numPages }) => {
                        setPages(numPages);
                    }}
                    file={url} className="max-h-full">
                        <Page width={width ? width : 1} pageNumber={currPage} />
                    </Document>
                </div>
            </div>
        </div>
    )
}