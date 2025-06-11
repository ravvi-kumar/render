// 'use client';

// import * as XLSX from 'xlsx';
// import { useState, useRef } from 'react';
// import { Button } from '@/components/ui/button';
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
//   CardDescription
// } from '@/components/ui/card';
// import { trpc } from '@/utils/trpc';
// import {  useQuery } from '@tanstack/react-query';
// import ExcelUploader from '@/components/ExcelUploader/index';
// import PageContainer from '@/components/layout/page-container';

// export default function DownloadExcelCard() {
//   const [previewData, setPreviewData] = useState<string[][]>([]);
//   // eslint-disable-next-line @typescript-eslint/no-unused-vars
//   const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([]);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const { data:inventoryData = [] } = useQuery(trpc.inventory.getInventoryData.queryOptions());

//   const handleDownload = () => {
//     const wsData = [
//       ['IMAGE','Name', 'SKU','UPC ','COMMENTS','Inbound', 'Tag',  'weight (LBS.)', 'Cubic QTY / per unit ', 'Stock'],
//       ['', '', '', '', '','', '', '', '', '']
//     ];

//     const worksheet = XLSX.utils.aoa_to_sheet(wsData);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'Template');

//     const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
//       header: 1
//     });
//     setPreviewData(jsonData);

//     XLSX.writeFile(workbook, 'empty_product_template.xlsx');
//   };


//   const handleImageUpload = (
//     rowIndex: number,
//     e: React.ChangeEvent<HTMLInputElement>
//   ) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         const result = event.target?.result as string;
//         setImagePreviews((prev) => {
//           const updated = [...prev];
//           updated[rowIndex] = result;
//           return updated;
//         });
//       };
//       reader.readAsDataURL(file);
//     }
//   };

  
 
 

//   return (
//     <PageContainer scrollable >
//       <div className='w-full' >
//        <Card className='m-3 border shadow-sm'>
//         <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
//           <div>
//             <CardTitle className='text-xl font-semibold'>
//               Download Template
//             </CardTitle>
//             <CardDescription>
//               Get and preview a blank Excel template
//             </CardDescription>
//           </div>
//           <Button variant='outline' onClick={handleDownload}>
//             Download
//           </Button>
//         </CardHeader>

//         <CardContent>
//           {previewData.length > 0 && (
//             <>
//               <input
//                 type='file'
//                 ref={fileInputRef}
//                 accept='image/*'
//                 className='hidden'
//                 onChange={(e) => {
//                   const rowIndex = parseInt(
//                     fileInputRef.current?.getAttribute('data-row-index') || '0'
//                   );
//                   handleImageUpload(rowIndex, e);
//                 }}
//               />
//             </>
//           )}
//         </CardContent>
//       </Card> 

//       <ExcelUploader
//         inventoryData={inventoryData}
//       />
//       </div>
//     </PageContainer>
//   );
// }

"use client"

import type React from "react"

import * as XLSX from "xlsx"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { trpc } from "@/utils/trpc"
import { useQuery } from "@tanstack/react-query"
import ExcelUploader from '@/components/ExcelUploader/index';
import PageContainer from "@/components/layout/page-container"
import Link from "next/link"

export default function DownloadExcelCard() {
  const [previewData, setPreviewData] = useState<string[][]>([])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [imagePreviews, setImagePreviews] = useState<(string | null)[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: inventoryData = [], isLoading } = useQuery(trpc.inventory.getInventoryData.queryOptions())

  const handleDownload = () => {
    // const wsData = [
    //   ["IMAGE", "Name", "SKU", "UPC ", "COMMENTS", "Inbound", "Tag", "weight (LBS.)", "Cubic QTY / per unit ", "Stock"],
    //   ["", "", "", "", "", "", "", "", "", ""],
    // ]
    const wsData = [
      ["IMAGE", "Name", "SKU", "UPC ", "COMMENTS", "Inbound", "Tag", "weight (LBS.)"],
      ["", "", "", "", "", "", "", ""],
    ]

    const worksheet = XLSX.utils.aoa_to_sheet(wsData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template")

    const jsonData = XLSX.utils.sheet_to_json<string[]>(worksheet, {
      header: 1,
    })
    setPreviewData(jsonData)

    XLSX.writeFile(workbook, "empty_inventory_template.xlsx")
  }

  const handleImageUpload = (rowIndex: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const result = event.target?.result as string
        setImagePreviews((prev) => {
          const updated = [...prev]
          updated[rowIndex] = result
          return updated
        })
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <PageContainer scrollable>
      <div className="w-full space-y-4 sm:space-y-6">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="text-lg sm:text-xl font-semibold">Download Template</CardTitle>
              <CardDescription className="text-sm sm:text-base">
                Please download the template and fill in the details related to the product you want to sell. Once completed, proceed to&nbsp;
                <Link href={'/dashboard/send-to-prepvia'} >
                  <span className="text-primary font-bold">Send to PrepVia</span>
                </Link>.
              </CardDescription>
            </div>
            <Button variant="outline" onClick={handleDownload} className=" cursor-pointer w-full sm:w-auto">
              Download
            </Button>
          </CardHeader>

          <CardContent>
            {previewData.length > 0 && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const rowIndex = Number.parseInt(fileInputRef.current?.getAttribute("data-row-index") || "0")
                    handleImageUpload(rowIndex, e)
                  }}
                />
              </>
            )}
          </CardContent>
        </Card>
        <ExcelUploader inventoryData={inventoryData ?? []} loading={isLoading} />         
      </div>
    </PageContainer>
  )
}