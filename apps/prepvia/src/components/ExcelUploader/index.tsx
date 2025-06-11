'use client';

import { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { useRouter } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  TableIcon,
  Edit,
  Trash2,
  Eye
} from 'lucide-react';
import { queryClient, trpc } from '@/utils/trpc';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

interface ExcelUploaderProps {
  inventoryData?: any[];
  onFileUpload?: (file: File) => void;
  onFileRemove?: () => void;
  onUploadStart?: () => void;
  onDataImport?: (data: any[]) => void;
  onUploadComplete?: () => void;
  isLoading?: boolean;
  [key: string]: any;
}

export default function ExcelUploader({
  inventoryData = [],
  onFileUpload = () => {},
  onFileRemove = () => {},
  isLoading = false
}: ExcelUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [jsonData, setJsonData] = useState<any[] | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const router = useRouter();

  // Only use API data, not parsed Excel data
  useEffect(() => {
    if (Array.isArray(inventoryData) && inventoryData.length > 0) {
      const allRows = inventoryData
        .flatMap((entry) => entry.items || [])
        .map((item) => ({
          id: item.id,
          name: item.name,
          sku: item.sku,
          upc: item.upc,
          comments: item.comments,
          inbound: item.inbound,
          tag: item.tag,
          weight: item.weight,
          cubicQty: item.cubicQtyPerUnit,
          stock: item.stock
        }));
      setJsonData(allRows);
    } else {
      setJsonData([]);
    }
  }, [inventoryData]);

  const mutation = useMutation(trpc.inventory.uploadExcel.mutationOptions());

  // Simulate progress during processing
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isProcessing) {
      setUploadProgress(0);
      interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + Math.random() * 15;
          return newProgress >= 90 ? 90 : newProgress;
        });
      }, 300);
    } else if (success) {
      setUploadProgress(100);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isProcessing, success]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject
  } = useDropzone({
    accept: {
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx'
      ],
      'text/csv': ['.csv']
    },
    multiple: false,
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        const file = acceptedFiles[0];
        setSelectedFile(file);
        handleFileChange(file);
        onFileUpload(file);
        setError(null);
      }
    },
    onDropRejected: () => {
      setError('Invalid file type. Please upload an Excel or CSV file.');
    }
  });

  const handleFileChange = async (selectedFile: File) => {
    const file = selectedFile;
    if (!file) return;

    // Don't parse and show Excel data immediately
    // Just validate the file format
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // Just validate, don't set data
        const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
          header: 1
        });

        if (!rawData || rawData.length < 2) {
          setError('Invalid or empty Excel file');
          return;
        }

        // File is valid, ready for upload
        setError(null);
      } catch (error) {
        setError('Failed to parse Excel file');
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
    };

    reader.readAsArrayBuffer(file);
  };

  const handleUpload = async () => {
    if (selectedFile) {
      setError(null);
      setSuccess(false);
      setIsProcessing(true);

      // Parse the Excel file for upload
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          const rawData = XLSX.utils.sheet_to_json<any[]>(worksheet, {
            header: 1
          });

          const headers = rawData[0];
          const rows = rawData.slice(1);
          const transformedData = rows
            .filter(
              (row) =>
                row &&
                row.length > 0 &&
                row.some(
                  (cell) => cell !== undefined && cell !== null && cell !== ''
                )
            )
            .map((row) => {
              const obj: Record<string, any> = {};
              headers.forEach((key, index) => {
                obj[key] = row[index];
              });
              return obj;
            });

          // Upload to API
          mutation.mutate(
            { data: transformedData },
            {
              onSuccess: async () => {
                setSuccess(true);
                setIsProcessing(false);
                await queryClient.invalidateQueries({
                  queryKey: trpc.inventory.getInventoryData.queryKey()
                });
              },
              onError: (error) => {
                setError(`Upload failed: ${error.message}`);
                setIsProcessing(false);
              }
            }
          );
        } catch (error) {
          setError('Failed to parse Excel file');
          setIsProcessing(false);
        }
      };

      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError(null);
    setSuccess(false);
    onFileRemove();
  };

  const handleRowClick = (rowData: any, rowIndex: number) => {
    localStorage.setItem('editRowData', JSON.stringify(rowData));
    localStorage.setItem('editRowIndex', rowIndex.toString());
    router.push(`/dashboard/inventory/${rowData.id}`);
  };

  const renderTableSkeleton = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-6 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
        <div className="border rounded-lg">
          <div className="grid grid-cols-6 gap-4 p-4 border-b bg-muted/50">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-4 p-4 border-b last:border-b-0">
              {Array.from({ length: 6 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDataTable = () => {
    // Always show the header and controls
    const showData = jsonData && jsonData.length > 0;
    const headers = showData ? Object.keys(jsonData[0]) : [];

    return (
      <div className="mt-6 sm:mt-8 pb-8 sm:pb-12">
        {/* Always visible header and controls */}
        <div className="mb-4 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <TableIcon className="h-5 w-5" />
            Items in Inventory
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2 py-1">
              {showData ? jsonData.length : 0} rows
            </Badge>
            <div className="flex overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('table')}
                className="rounded-none px-3 py-1 text-xs"
              >
                <TableIcon className="mr-1 h-3 w-3" />
                Table
              </Button>
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('cards')}
                className="rounded-none px-3 py-1 text-xs"
              >
                <Eye className="mr-1 h-3 w-3" />
                Cards
              </Button>
            </div>
          </div>
        </div>

        {isLoading && renderTableSkeleton()}

        {!isLoading && showData && viewMode === 'table' && (
          <div className="flex flex-1 flex-col">
            <div className="relative flex w-full flex-1 hide-scrollbar ">
              <div className="
  flex flex-col overflow-x-auto rounded-lg border hide-scrollbar
  w-full
  max-w-full
  sm:max-w-[98vw]
  md:max-w-[90vw]
  lg:max-w-[80vw]
  xl:max-w-[76vw]
">
                <Table>
                  <TableHeader className="bg-background sticky top-0 z-10">
                    <TableRow>
                      {headers.map(
                        (header, index) =>
                          header !== 'id' && (
                            <TableHead
                              key={index}
                              className="min-w-[120px] px-2 text-xs font-medium tracking-wider uppercase sm:px-4"
                            >
                              <div className="truncate" title={header}>
                                {header}
                              </div>
                            </TableHead>
                          )
                      )}
                      <TableHead className="w-[80px] text-center text-xs font-medium tracking-wider uppercase">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jsonData.map((row, rowIndex) => (
                      <TableRow
                        key={rowIndex}
                        className="hover:bg-muted/50 animate-fade-in transition-colors duration-150"
                        style={{ animationDelay: `${rowIndex * 50}ms` }}
                      >
                        {headers.map((header, cellIndex) => {
                          if (header === 'id') return null;
                          return (
                            <TableCell
                              key={cellIndex}
                              className="min-w-[120px] px-2 py-2 text-sm sm:px-4"
                            >
                              <div
                                className="max-w-[150px] truncate sm:max-w-[200px]"
                                title={String(row[header] || '')}
                              >
                                {row[header] !== undefined && row[header] !== null
                                  ? String(row[header])
                                  : '—'}
                              </div>
                            </TableCell>
                          );
                        })}
                        <TableCell className="px-2 py-2 text-center sm:px-4">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleRowClick(row, rowIndex)}
                                  className="text-muted-foreground hover:text-foreground h-7 w-7 transition-colors duration-200 sm:h-8 sm:w-8"
                                >
                                  <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                                  <span className="sr-only">Edit row</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Edit this row</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}

        {/* Cards view */}
        {!isLoading && showData && viewMode === 'cards' && (
          <ScrollArea className="h-[400px] w-full">
            <div className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {jsonData.map((row, rowIndex) => (
                <Card
                  key={rowIndex}
                  className="animate-fade-in hover:border-primary/20 cursor-pointer border transition-all duration-200 hover:shadow-md"
                  style={{ animationDelay: `${rowIndex * 50}ms` }}
                  onClick={() => handleRowClick(row, rowIndex)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {Object.entries(row)
                        .slice(0, 4)
                        .map(([key, value], index) => (
                          <div key={index} className="space-y-1">
                            <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                              {key}
                            </span>
                            <div
                              className="truncate text-sm font-medium"
                              title={String(value || '')}
                            >
                              {value !== undefined && value !== null
                                ? String(value)
                                : '—'}
                            </div>
                          </div>
                        ))}
                      {Object.keys(row).length > 4 && (
                        <div className="text-muted-foreground border-t pt-1 text-xs">
                          +{Object.keys(row).length - 4} more fields
                        </div>
                      )}
                    </div>
                    <div className="mt-4 flex justify-end border-t pt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-xs"
                      >
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Empty state */}
        {!isLoading && !showData && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <TableIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No inventory data
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload an Excel file to see your inventory items here.
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="animate-fade-in mx-auto flex w-full flex-col">
        <div className="text-lg font-semibold sm:text-xl">
          Upload Excel File
        </div>
        <div className="mb-2 text-sm sm:text-base">
          Upload your Excel file to import inventory data
        </div>
        <div
          className={`relative rounded-xl border-2 border-dashed transition-all duration-300 ease-in-out ${isDragActive ? 'border-opacity-100 scale-[1.02]' : 'border-opacity-50'} ${isDragAccept ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' : ''} ${isDragReject ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/20' : ''} ${!isDragActive ? 'border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600' : ''} `}
        >
          <div
            {...getRootProps()}
            className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center p-4 sm:min-h-[180px] sm:p-8"
          >
            <input {...getInputProps()} />
            <div className="text-center">
              {isDragAccept ? (
                <div className="animate-bounce-in">
                  <div className="mb-3 inline-flex rounded-full bg-emerald-100 p-2 sm:mb-4 sm:p-3 dark:bg-emerald-900/30">
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 sm:h-8 sm:w-8 dark:text-emerald-400" />
                  </div>
                  <p className="text-base font-medium text-emerald-600 sm:text-lg dark:text-emerald-400">
                    Drop to upload your Excel file
                  </p>
                </div>
              ) : isDragReject ? (
                <div className="animate-shake">
                  <div className="mb-3 inline-flex rounded-full bg-rose-100 p-2 sm:mb-4 sm:p-3 dark:bg-rose-900/30">
                    <AlertCircle className="h-6 w-6 text-rose-600 sm:h-8 sm:w-8 dark:text-rose-400" />
                  </div>
                  <p className="text-base font-medium text-rose-600 sm:text-lg dark:text-rose-400">
                    This file type is not supported
                  </p>
                  <p className="mt-1 text-xs text-rose-500 sm:text-sm dark:text-rose-400">
                    Please use Excel or CSV files only
                  </p>
                </div>
              ) : (
                <div className="animate-fade-in">
                  <div className="mb-3 inline-flex rounded-full bg-gray-100 p-2 sm:mb-4 sm:p-3 dark:bg-gray-800">
                    <FileSpreadsheet className="h-6 w-6 text-gray-600 sm:h-8 sm:w-8 dark:text-gray-300" />
                  </div>
                  <p className="mb-2 text-base font-medium text-gray-700 sm:text-lg dark:text-gray-300">
                    {isDragActive
                      ? 'Drop your file here'
                      : 'Drag & drop your Excel file here'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    or{' '}
                    <span className="text-primary underline">browse files</span>
                  </p>
                  <p className="mt-3 text-xs text-gray-400 sm:mt-4 dark:text-gray-500">
                    Supported formats: .xlsx, .xls, .csv
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="animate-slide-down mt-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {success && !error && (
          <div className="animate-slide-down mt-4">
            <Alert
              variant="default"
              className="border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-sm text-emerald-600 dark:text-emerald-400">
                File processed and uploaded successfully!
              </AlertDescription>
            </Alert>
          </div>
        )}

        {selectedFile && (
          <div className="animate-slide-up mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 sm:mt-6 sm:p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center space-x-3">
                <div className="flex-shrink-0 rounded-md border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                  <FileSpreadsheet className="text-primary h-5 w-5 sm:h-6 sm:w-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 sm:text-base dark:text-gray-100">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                onClick={removeFile}
                variant="ghost"
                size="icon"
                className="h-7 w-7 flex-shrink-0 text-gray-500 transition-colors duration-200 hover:text-rose-500 sm:h-8 sm:w-8 dark:text-gray-400 dark:hover:text-rose-400"
                aria-label="Remove selected file"
              >
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
            </div>

            {isProcessing && (
              <div className="animate-fade-in mt-4">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-700 sm:text-sm dark:text-gray-300">
                    Processing...
                  </span>
                  <span className="text-xs text-gray-500 sm:text-sm dark:text-gray-400">
                    {Math.round(uploadProgress)}%
                  </span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </div>
        )}

        {selectedFile && !isProcessing && (
          <div className="animate-slide-up mt-4 flex justify-end sm:mt-6">
            <Button
              onClick={handleUpload}
              className="gap-2 px-4 text-sm transition-all duration-200 hover:scale-105 sm:px-6 sm:text-base"
              disabled={isProcessing}
            >
              <Upload className="h-4 w-4" />
              Upload & Process
            </Button>
          </div>
        )}
      </div>
      {renderDataTable()}
    </>
  );
}