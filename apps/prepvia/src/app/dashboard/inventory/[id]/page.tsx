"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Save,
  X,
  ImageIcon,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Edit3,
  FileText,
  RefreshCw,
  Info,
  Camera,
  Package,
} from "lucide-react"
import PageContainer from "@/components/layout/page-container"
import Image from "next/image"
import { useMutation, useQuery } from '@tanstack/react-query';
import { trpc } from '@/utils/trpc';
import { toast } from 'sonner';

// Zod validation schema for inventory form
const inventorySchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name is required" })
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(100, { message: "Name must be less than 100 characters" })
    .trim(),
  sku: z
    .string()
    .min(1, { message: "SKU is required" })
    .min(3, { message: "SKU must be at least 3 characters long" })
    .max(50, { message: "SKU must be less than 50 characters" })
    .regex(/^[A-Za-z0-9-_]+$/, { message: "SKU can only contain letters, numbers, hyphens, and underscores" })
    .trim(),
  upc: z
    .string()
    .min(1, { message: "UPC is required" })
    .regex(/^\d{12}$/, { message: "UPC must be exactly 12 digits" })
    .trim(),
  comments: z
    .string()
    .min(1, { message: "Comments are required" })
    .max(500, { message: "Comments must be less than 500 characters" })
    .trim(),
  inbound: z.coerce
    .number()
    .min(0, { message: "Inbound quantity must be 0 or greater" })
    .max(999999, { message: "Inbound quantity must be less than 1,000,000" }),
  tag: z
    .string()
    .min(1, { message: "Tag is required" })
    .max(50, { message: "Tag must be less than 50 characters" })
    .trim(),
  weight: z.coerce
    .number()
    .min(0.01, { message: "Weight must be greater than 0" })
    .max(9999.99, { message: "Weight must be less than 10,000 lbs" }),
  cubicQtyPerUnit: z.coerce
    .number()
    .min(0.01, { message: "Cubic quantity must be greater than 0" })
    .max(999.99, { message: "Cubic quantity must be less than 1,000" }),
  stock: z.coerce
    .number()
    .min(0, { message: "Stock must be 0 or greater" })
    .max(999999, { message: "Stock must be less than 1,000,000" }),
  imageUrl: z.string().optional(),
  image: z.any().optional(),
})

type InventoryFormData = z.infer<typeof inventorySchema>


export default function EditInventoryPage() {
  const router = useRouter();
  const { id }: { id: string } = useParams();
  const [formData, setFormData] = useState({});
  const [originalData, setOriginalData] = useState<any>({});
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [fieldFocus, setFieldFocus] = useState<string | null>(null);

  const { data: inventoryData } = useQuery(trpc.inventory.getInventorySingleData.queryOptions({ id }))
  const mutation = useMutation(trpc.inventory.updateExcelData.mutationOptions())
  const getSignUrl = useMutation(trpc.inventory.generateImageUploadUrl.mutationOptions())

  // Initialize React Hook Form with Zod validation
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    watch,
    setValue,
    getValues,
  } = useForm<InventoryFormData>({
    resolver: zodResolver(inventorySchema),
    mode: "onChange",
    defaultValues: {
      name: "",
      sku: "",
      upc: "",
      comments: "",
      inbound: 0,
      tag: "",
      weight: 0,
      cubicQtyPerUnit: 0,
      stock: 0,
      imageUrl: "",
    },
  })

  // Watch all form values to detect changes
  const watchedValues = watch()

  useEffect(() => {
    if (inventoryData) {
      setIsLoading(false)
      const formData = {
        name: inventoryData?.name || "",
        sku: inventoryData?.sku || "",
        upc: inventoryData?.upc || "",
        comments: inventoryData?.comments || "",
        inbound: inventoryData?.inbound || 0,
        tag: inventoryData?.tag || "",
        weight: inventoryData?.weight || 0,
        cubicQtyPerUnit: inventoryData?.cubicQtyPerUnit || 0,
        stock: inventoryData?.stock || 0,
        imageUrl: inventoryData?.imageUrl || "",
      }

      setOriginalData(formData)
      reset(formData)

      // Set image preview if exists in data
      if (inventoryData?.imageUrl) {
        setImagePreview(inventoryData?.imageUrl)
      }
    }
  }, [inventoryData, reset])

  // Check for changes using React Hook Form's isDirty
  useEffect(() => {
    setHasChanges(isDirty || selectedImage !== null)
  }, [isDirty, selectedImage])

  // Simulate progress during submission
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (isSubmitting) {
      setSubmitProgress(0)
      interval = setInterval(() => {
        setSubmitProgress((prev) => {
          const newProgress = prev + Math.random() * 20
          return newProgress >= 90 ? 90 : newProgress
        })
      }, 200)
    } else if (success) {
      setSubmitProgress(100)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isSubmitting, success])

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        setError("Image size must be less than 5MB")
        return
      }

      // Validate file type
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file")
        return
      }

      setSelectedImage(file)
      setValue("image", file, { shouldDirty: true })

      // Use URL.createObjectURL for blob preview
      const previewUrl = URL.createObjectURL(file)
      setImagePreview(previewUrl)

      setError(null)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview("")
    setValue("image", undefined, { shouldDirty: true })
  }

  const onSubmit = async (data: InventoryFormData) => {
    // if (!selectedImage) return;
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    try {
      let updatedData;
      if (selectedImage){
        const { uploadUrl, s3Key, url } = await getSignUrl.mutateAsync({
          fileName: selectedImage?.name,
          fileType: selectedImage?.type,
          key : inventoryData?.key ?? undefined
        });
      
      await fetch(uploadUrl, {
        method: 'PUT',
        body: selectedImage,
        headers: {
          'Content-Type': selectedImage.type
        }
      });
      
      updatedData = {
        ...data,
        image:"",
        Key: s3Key,
        imageUrl: url
      };
    }
      // if(!updatedData) return
      setFormData(updatedData ?? data);
      const response = await mutation.mutateAsync({ id: id, data: updatedData ?? data });
      if (response) {
        setSuccess(true);
        toast.success('Inventory', {
          description: 'Inventory updated successfully'
        });
        // setTimeout(() => {
        //   router.push('/dashboard/inventory');
        // }, 2000);
      } else {
        throw new Error('Failed to update data');
      }
    } catch (error) {
      setError('Failed to update inventory. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleReset = () => {
    reset(originalData)
    setSelectedImage(null)
    setImagePreview(originalData.imageUrl || "")
    setError(null)
  }

  const getFieldKeys = () => Object.keys(originalData).filter((key) => key !== "image" && key !== "imageUrl")

  const formatFieldName = (field: string) => {
    return field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, " $1")
  }

  // Group fields into categories for better organization
  const getBasicFields = () => {
    const allFields = getFieldKeys()
    const basicFields = ["name", "sku", "upc", "tag"]
    return allFields.filter((field) => basicFields.includes(field))
  }

  const getDetailFields = () => {
    const allFields = getFieldKeys()
    const basicFields = ["name", "sku", "upc", "tag"]
    return allFields.filter((field) => !basicFields.includes(field))
  }

  // Helper function to get error message for a field
  const getFieldError = (fieldName: keyof InventoryFormData): string | undefined => {
    const error = errors[fieldName]
    if (!error) return undefined
    
    // Handle different error types from React Hook Form
    if (typeof error === 'string') return error
    if (typeof error === 'object' && 'message' in error) {
      return typeof error.message === 'string' ? error.message : undefined
    }
    
    return undefined
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8 dark:from-gray-950 dark:to-gray-900">
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 animate-pulse">
            <Skeleton className="mb-4 h-10 w-48" />
            <Skeleton className="mb-2 h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Card className="animate-pulse">
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (Object.keys(originalData).length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-amber-500" />
            <h3 className="mb-2 text-lg font-semibold">No Data Found</h3>
            <p className="mb-4 text-gray-600 dark:text-gray-400">Unable to load inventory data. Please try again.</p>
            <Button onClick={() => router.push("/dashboard/inventory")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <PageContainer>
      <div className="animate-fade-in w-full p-4 md:p-8">
        {/* Header with sticky behavior */}
        <div className="from-background via-background sticky top-0 z-10 bg-gradient-to-b to-transparent pb-4">
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard/inventory")}
            className="group mb-4 transition-all duration-200 hover:bg-white/50 dark:hover:bg-gray-800/50"
          >
            <ArrowLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Back to Inventory
          </Button>

          <div className="mb-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 rounded-lg p-2">
                <Package className="text-primary h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl dark:text-gray-100">Edit</h1>
            </div>

            <div className="flex items-center gap-2">
              {hasChanges && (
                <Badge variant="secondary" className="animate-pulse">
                  Unsaved Changes
                </Badge>
              )}

              <Button
                type="submit"
                form="inventory-form"
                disabled={isSubmitting || !hasChanges}
                className="gap-2 transition-all duration-200 hover:scale-105 disabled:hover:scale-100"
                size="sm"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>

          <p className="mb-4 text-gray-600 dark:text-gray-400">
            Modify the fields below and save your changes to update the inventory data. All fields are required.
          </p>

          {/* Status Messages */}
          {error && (
            <Alert variant="destructive" className="animate-slide-down mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="animate-slide-down mb-4 border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <AlertDescription className="text-emerald-600 dark:text-emerald-400">
                Inventory updated successfully! Redirecting...
              </AlertDescription>
            </Alert>
          )}

          {/* Progress Bar */}
          {isSubmitting && (
            <div className="animate-fade-in mb-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Updating inventory...</span>
                <span className="text-gray-500 dark:text-gray-400">{Math.round(submitProgress)}%</span>
              </div>
              <Progress value={submitProgress} className="h-2" />
            </div>
          )}
        </div>

        {/* Main Form Card */}
        <Card className="animate-slide-up border-0 bg-white/70 shadow-sm backdrop-blur-sm dark:bg-gray-900/70">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Edit3 className="h-5 w-5" />
              Inventory Details
            </CardTitle>
            <CardDescription>
              Update the information for this inventory item. All fields are required and will be validated.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="mb-6 grid grid-cols-2">
                <TabsTrigger value="details" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Basic Details
                </TabsTrigger>
                <TabsTrigger value="advanced" className="flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Additional Info
                </TabsTrigger>
              </TabsList>

              <form id="inventory-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <TabsContent value="details" className="mt-0">
                  {/* Image Upload Section */}
                  <div className="mb-6 flex flex-col items-start gap-6 sm:flex-row">
                    <div className="group relative flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 sm:w-1/3 dark:border-gray-700 dark:bg-gray-800/50">
                      {imagePreview ? (
                        <>
                          <Image
                            src={imagePreview ?? originalData.imageUrl}
                            alt='Product preview'
                            height={100}
                            width={100}
                            className='h-full w-full object-cover transition-all duration-300 group-hover:scale-105 group-hover:opacity-75'
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all duration-300 group-hover:bg-black/40 group-hover:opacity-100">
                            <div className="flex gap-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="secondary"
                                      size="icon"
                                      className="h-8 w-8 rounded-full"
                                      onClick={() => document.getElementById("image-upload")?.click()}
                                    >
                                      <Camera className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Change image</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="icon"
                                      className="h-8 w-8 rounded-full"
                                      onClick={removeImage}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Remove image</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div
                          className="flex h-full w-full cursor-pointer flex-col items-center justify-center p-4 text-center"
                          onClick={() => document.getElementById("image-upload")?.click()}
                        >
                          <ImageIcon className="mb-2 h-10 w-10 text-gray-400" />
                          <p className="text-sm text-gray-500 dark:text-gray-400">Click to upload product image</p>
                          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">JPG, PNG or GIF (max 5MB)</p>
                        </div>
                      )}
                      <Input
                        id="image-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>

                    <div className="w-full space-y-4 sm:w-2/3">
                      {getBasicFields()?.map((field: string, index) => (
                        <div
                          key={field}
                          className={`animate-fade-in space-y-2 transition-all duration-200 ${
                            fieldFocus === field ? "scale-[1.01]" : ""
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <Label
                            htmlFor={field}
                            className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {formatFieldName(field)}
                            <span className="text-red-500">*</span>
                            {field === "sku" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Stock Keeping Unit - Unique identifier for this product</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {field === "upc" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Universal Product Code - Must be exactly 12 digits</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </Label>
                          <Input
                            id={field}
                            type={field === "upc" ? "text" : "text"}
                            {...register(field as keyof InventoryFormData)}
                            className={`focus:ring-primary/20 hover:border-primary/50 transition-all duration-200 focus:ring-2 ${
                              getFieldError(field as keyof InventoryFormData)
                                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                : ""
                            }`}
                            placeholder={`Enter ${formatFieldName(field).toLowerCase()}`}
                            onFocus={() => setFieldFocus(field)}
                            onBlur={() => setFieldFocus(null)}
                          />
                          {getFieldError(field as keyof InventoryFormData) && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {getFieldError(field as keyof InventoryFormData)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="advanced" className="mt-0">
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {getDetailFields().map((field: string, index) => (
                        <div
                          key={field}
                          className={`animate-fade-in space-y-2 transition-all duration-200 ${
                            fieldFocus === field ? "scale-[1.01]" : ""
                          }`}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <Label
                            htmlFor={field}
                            className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                          >
                            {formatFieldName(field)}
                            <span className="text-red-500">*</span>
                            {field === "weight" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Weight in pounds (LBS)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            {field === "cubicQtyPerUnit" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Info className="h-3 w-3 text-gray-400" />
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Cubic quantity per unit</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </Label>
                          <Input
                            id={field}
                            type={["inbound", "weight", "cubicQtyPerUnit", "stock"].includes(field) ? "number" : "text"}
                            step={["weight", "cubicQtyPerUnit"].includes(field) ? "0.01" : "1"}
                            min={
                              ["inbound", "stock"].includes(field)
                                ? "0"
                                : ["weight", "cubicQtyPerUnit"].includes(field)
                                  ? "0.01"
                                  : undefined
                            }
                            {...register(field as keyof InventoryFormData)}
                            className={`focus:ring-primary/20 hover:border-primary/50 transition-all duration-200 focus:ring-2 ${
                              getFieldError(field as keyof InventoryFormData)
                                ? "border-red-500 focus:border-red-500 focus:ring-red-200"
                                : ""
                            }`}
                            placeholder={`Enter ${formatFieldName(field).toLowerCase()}`}
                            onFocus={() => setFieldFocus(field)}
                            onBlur={() => setFieldFocus(null)}
                          />
                          {getFieldError(field as keyof InventoryFormData) && (
                            <p className="text-sm text-red-600 dark:text-red-400">
                              {getFieldError(field as keyof InventoryFormData)}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </TabsContent>

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 border-t border-gray-200 pt-6 sm:flex-row dark:border-gray-800">
                  <Button
                    type="submit"
                    disabled={isSubmitting || !hasChanges}
                    className="flex-1 gap-2 transition-all duration-200 hover:scale-105 disabled:hover:scale-100 sm:flex-none"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/dashboard/inventory")}
                    disabled={isSubmitting}
                    className="flex-1 transition-all duration-200 hover:bg-gray-50 sm:flex-none dark:hover:bg-gray-800"
                  >
                    Cancel
                  </Button>

                  {hasChanges && !isSubmitting && (
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={handleReset}
                      className="flex-1 gap-2 text-gray-500 hover:text-gray-700 sm:flex-none dark:text-gray-400 dark:hover:text-gray-200"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset Changes
                    </Button>
                  )}
                </div>
              </form>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  )
}
