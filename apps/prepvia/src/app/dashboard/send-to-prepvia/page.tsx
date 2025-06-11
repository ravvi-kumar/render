'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';
import { FileUploader } from '@/components/file-uploader';
import { Trash2 } from 'lucide-react';

const shippingAgencies = [
  { id: 'ups', name: 'UPS' },
  { id: 'fedex', name: 'FedEx' },
  { id: 'ltl', name: 'LTL' },
  { id: 'other', name: 'Other' },
] as const;

const formSchema = z.object({
  shippingAgency: z.string({
    required_error: 'Please select a shipping agency',
  }),
  otherShippingAgency: z.string().optional(),
  tracking: z.string().optional(),
  eta: z.string().optional(),
  bolNumber: z.string().optional(),
  comments: z.string().optional(),
  products: z.array(z.object({
    identifier: z.string({ required_error: 'Product identifier is required' }),
    quantity: z.number({ required_error: 'Quantity is required' }).min(1, 'Quantity must be at least 1'),
  })).min(1, 'At least one product is required'),
  documents: z.any().optional(),
});

export default function SendToPrepvia() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      products: [{ identifier: '', quantity: 1 }],
    },
  });

  // Watch shippingAgency to show/hide "Other" field
  const shippingAgency = useWatch({ control: form.control, name: 'shippingAgency' });

  // Handle file uploads
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // If "Other" is selected, use the custom agency name
      const shipmentAgency =
        values.shippingAgency === 'other'
          ? values.otherShippingAgency
          : shippingAgencies.find(a => a.id === values.shippingAgency)?.name;

      const payload = {
        ...values,
        shippingAgency: shipmentAgency,
        documents: uploadedFiles,
      };

      console.log(payload);
      toast.success("Item(s) confirmation request to PrepVia informed.");
    } catch (error) {
      toast.error("Failed to submit request. Please try again.");
    }
  };

  const addProduct = () => {
    const products = form.getValues('products');
    form.setValue('products', [...products, { identifier: '', quantity: 1 }]);
  };

  const removeProduct = (index: number) => {
    const products = form.getValues('products');
    if (products.length > 1) {
      products.splice(index, 1);
      form.setValue('products', products);
    }
  };

  return (
    <PageContainer>
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Send to PrepVia</CardTitle>
            <CardDescription>
              Initiate stock transfer to the platform by filling an inbound plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Shipping Agency Selection */}
                <FormField
                  control={form.control}
                  name="shippingAgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shipping Agency</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a shipping agency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {shippingAgencies.map((agency) => (
                            <SelectItem key={agency.id} value={agency.id}>
                              {agency.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Show "Other" field if selected */}
                {shippingAgency === 'other' && (
                  <FormField
                    control={form.control}
                    name="otherShippingAgency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Specify Shipping Agency</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter agency name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Tracking, ETA, BOL */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="tracking"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tracking Number</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter tracking number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="eta"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ETA</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bolNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>BOL Number (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter BOL number" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Comments */}
                <FormField
                  control={form.control}
                  name="comments"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Comments</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add any additional comments (e.g., if products are similar, specify here)"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Products */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium">Products in Shipment</h4>
                    <Button type="button" variant="outline" onClick={addProduct}>
                      Add Product
                    </Button>
                  </div>

                  {form.watch('products').map((_, index) => (
                    <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                      <FormField
                        control={form.control}
                        name={`products.${index}.identifier`}
                        render={({ field }) => (
                          <FormItem>
                            {index === 0 && (
                              <FormLabel>Product Identifier (UPC/NAME/SKU)</FormLabel>
                            )}
                            <FormControl>
                              <Input placeholder="Enter product identifier" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex items-end gap-2">
                        <FormField
                          control={form.control}
                          name={`products.${index}.quantity`}
                          render={({ field }) => (
                            <FormItem>
                              {index === 0 && (
                                <FormLabel>Quantity</FormLabel>
                              )}
                              <FormControl>
                                <Input
                                  type="number"
                                  min={1}
                                  {...field}
                                  onChange={e => field.onChange(parseInt(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => removeProduct(index)}
                          disabled={form.getValues('products').length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                </div>

                {/* Document Upload */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Required Documents</h4>
                    <FileUploader
                      accept=".pdf,.doc,.docx"
                      onUpload={(files) => setUploadedFiles(files)}
                      maxSize={5}
                    />
                    <FormDescription className="text-xs mt-2 " >
                      Upload shipment plan, invoice, and other required documents (PDF, DOC, DOCX up to 5MB)
                    </FormDescription>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit">Submit Request</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}