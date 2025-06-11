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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import PageContainer from '@/components/layout/page-container';

const formSchema = z.object({
    products: z.array(z.object({
        identifier: z.string(),
        quantity: z.number().min(1),
        cubicFeet: z.number().min(0.01),
    })).min(1),
});

const DAILY_COST_PER_CUBIC_FT = 0.07;

export default function StoragePage() {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            products: [{ identifier: '', quantity: 1, cubicFeet: 0.01 }],
        },
    });

    const addProduct = () => {
        const products = form.getValues('products');
        form.setValue('products', [...products, { identifier: '', quantity: 1, cubicFeet: 0.01 }]);
    };

    const removeProduct = (index: number) => {
        const products = form.getValues('products');
        if (products.length > 1) {
            products.splice(index, 1);
            form.setValue('products', products);
        }
    };

    // Calculate totals
    const products = form.watch('products');
    const totalCubicQty = products.reduce((sum, p) => sum + (p.quantity * p.cubicFeet), 0);
    const dailyCost = +(totalCubicQty * DAILY_COST_PER_CUBIC_FT).toFixed(2);

    // Dummy values for balance and next billing
    const balance = 70.24;
    const nextBillingDate = '2025-05-27';

    const onSubmit = (values: z.infer<typeof formSchema>) => {
        toast.success('Storage information updated.');
    };

    return (
        <PageContainer>
            <div className="max-w-4xl mx-auto">
                <Card>
                    <CardHeader>
                        <CardTitle>Storage Overview</CardTitle>
                        <CardDescription>
                            Track your inventory storage, cubic measurements, and storage costs.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                {/* Products Table */}
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-medium">Stored Products</h4>
                                        <Button type="button" variant="outline" onClick={addProduct}>
                                            Add Product
                                        </Button>
                                    </div>
                                    {products.map((_, index) => (
                                        <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.identifier`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        {index === 0 && <FormLabel>Identifier (SKU/Name)</FormLabel>}
                                                        <FormControl>
                                                            <Input placeholder="Enter product identifier" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.quantity`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        {index === 0 && <FormLabel>Stock Qty</FormLabel>}
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
                                            <FormField
                                                control={form.control}
                                                name={`products.${index}.cubicFeet`}
                                                render={({ field }) => (
                                                    <FormItem>
                                                        {index === 0 && <FormLabel>Cubic Feet (per unit)</FormLabel>}
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                min={0.01}
                                                                step={0.01}
                                                                {...field}
                                                                onChange={e => field.onChange(parseFloat(e.target.value))}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <div className="flex items-end gap-2">
                                                <div>
                                                    {index === 0 && <FormLabel>Cubic Qty</FormLabel>}
                                                    <div className="py-2">
                                                        {(products[index].quantity * products[index].cubicFeet).toFixed(2)}
                                                    </div>
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    onClick={() => removeProduct(index)}
                                                    disabled={products.length === 1}
                                                >
                                                    Remove
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Calculations */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium">Total Cubic Qty</span>
                                            <span>{totalCubicQty.toFixed(2)} cu ft</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium">Daily Cost</span>
                                            <span>
                                                ${dailyCost} <span className="text-xs text-muted-foreground">(in-stock only)</span>
                                            </span>
                                        </div>
                                        <div className="text-xs text-muted-foreground mb-2">
                                            Daily cost is only for in-stock units. Units in shipment or being prepped do not incur storage fees.
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            You pay for storage every 15 days. Rate: $0.07 per cubic foot per day.
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium">Balance</span>
                                            <span>${balance}</span>
                                        </div>
                                        <div className="flex justify-between mb-2">
                                            <span className="font-medium">Next Billing Date</span>
                                            <span>{nextBillingDate}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end">
                                    <Button type="submit">Update Storage</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </PageContainer>
    );
}
