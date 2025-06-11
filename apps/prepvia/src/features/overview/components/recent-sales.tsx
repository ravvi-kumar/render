"use client"

import { useState } from "react"
import { Avatar,  AvatarImage } from "@/components/ui/avatar"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const shipmentData = {
  "In transit": [
    {
      name: "Samsung Galaxy S23",
      price: "$799",
      image: "https://source.unsplash.com/featured/?smartphone,samsung",
      status: "En route to warehouse",
      trackingId: "TRK001",
    },
    {
      name: "Apple iPhone 15",
      price: "$999",
      image: "https://source.unsplash.com/featured/?iphone,apple",
      status: "Out for delivery",
      trackingId: "TRK002",
    },
    {
      name: "OnePlus 11 Pro",
      price: "$749",
      image: "https://source.unsplash.com/featured/?oneplus,smartphone",
      status: "In transit",
      trackingId: "TRK003",
    },
  ],
  Receiving: [
    {
      name: "LG Double Door Refrigerator",
      price: "$1,199",
      image: "https://source.unsplash.com/featured/?refrigerator,lg",
      status: "Awaiting dock assignment",
      trackingId: "RCV001",
    },
    {
      name: "Whirlpool Washing Machine",
      price: "$699",
      image: "https://source.unsplash.com/featured/?washingmachine,whirlpool",
      status: "Being unloaded",
      trackingId: "RCV002",
    },
    {
      name: "Panasonic Microwave Oven",
      price: "$199",
      image: "https://source.unsplash.com/featured/?microwave,panasonic",
      status: "Received at dock",
      trackingId: "RCV003",
    },
  ],
  Inspected: [
    {
      name: "Sony 55\" 4K TV",
      price: "$899",
      image: "https://source.unsplash.com/featured/?sony,tv",
      status: "Quality check passed",
      trackingId: "INS001",
    },
    {
      name: "Dell XPS 15 Laptop",
      price: "$1,499",
      image: "https://source.unsplash.com/featured/?laptop,dell",
      status: "Inspection complete",
      trackingId: "INS002",
    },
    {
      name: "HP LaserJet Printer",
      price: "$349",
      image: "https://source.unsplash.com/featured/?printer,hp",
      status: "Approved for storage",
      trackingId: "INS003",
    },
    {
      name: "Bose Noise Cancelling Headphones",
      price: "$379",
      image: "https://source.unsplash.com/featured/?headphones,bose",
      status: "Documentation verified",
      trackingId: "INS004",
    },
  ],
};


export function ShipmentFilter() {
  const [selectedFilter, setSelectedFilter] = useState<"In transit" | "Receiving" | "Inspected">("In transit")

  const currentData = shipmentData[selectedFilter]
  const totalCount = Object.values(shipmentData).flat().length

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Shipment Status</CardTitle>
        <CardDescription>Total {totalCount} shipments tracked this month.</CardDescription>
        <div className="pt-4">
          <Select
            value={selectedFilter}
            onValueChange={(value: "In transit" | "Receiving" | "Inspected") => setSelectedFilter(value)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="In transit">In transit</SelectItem>
              <SelectItem value="Receiving">Receiving</SelectItem>
              <SelectItem value="Inspected">Inspected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-8">
          {currentData.map((shipment, index) => (
            <div key={index} className="flex items-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={shipment.image || "/placeholder.svg"} alt="Avatar" />
                {/* <AvatarFallback>{shipment.fallback}</AvatarFallback> */}
              </Avatar>
              <div className="ml-4 space-y-1">
                <p className="text-sm leading-none font-medium">{shipment.name}</p>
                {/* <p className="text-muted-foreground text-sm">{shipment.email}</p> */}
              </div>
              <div className="ml-auto text-right">
                <p className="text-sm font-medium">{shipment.price}</p>
                <p className="text-xs text-muted-foreground">{shipment.status}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Also export as default for flexibility
export default ShipmentFilter

// If you need to keep the RecentSales name for compatibility
export { ShipmentFilter as RecentSales }
