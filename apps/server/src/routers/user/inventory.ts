import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { protectedProcedure, router } from "../../lib/trpc";
import { z } from "zod";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { toFloat, toInt } from "../../utils/index";

const s3Client = new S3Client({
  region: process.env.AWS_BUCKET_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const inventoryRouter = router({
  // get Signed Url
  generateImageUploadUrl: protectedProcedure
    .input(
      z.object({
        key: z.string().optional(),
        fileName: z.string(),
        fileType: z.string().regex(/^image\/(png|jpeg|gif|webp)$/),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log(input);
      const s3Key = input.key
        ? input.key
        : `inventory-images/${ctx.session.user.id}/${
            input.fileName
          }-${Date.now()}`;

      const command = new PutObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: s3Key,
        ContentType: input.fileType,
        Metadata: {
          userId: ctx.session.user.id,
        },
      });

      const url = await getSignedUrl(s3Client, command, { expiresIn: 60 });

      return {
        uploadUrl: url,
        s3Key,
        url: url.split("?")[0],
      };
    }),

  // uplaod excel sheet data

  uploadExcel: protectedProcedure
    .input(
      z.object({
        data: z.array(z.record(z.any())), // array of records (Excel-style JSON rows)
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { data } = input;

      // Step 1: Create inventoryData record
      const inventoryRecord = await ctx.db.inventoryData.create({
        data: {
          userId: ctx.session.user.id,
        },
      });

      // Helper to normalize keys by trimming whitespace
      const normalizeKeys = (row: Record<string, any>) => {
        const normalized: Record<string, any> = {};
        for (const key in row) {
          const cleanKey = key.trim();
          normalized[cleanKey] = row[key];
        }
        return normalized;
      };

      // Step 2: Insert items
      const itemRecords = await ctx.db.inventoryItem.createMany({
        data: data.map((rawItem) => {
          const item = normalizeKeys(rawItem); // Clean keys before mapping

          console.log(item, "item");
          return {
            inventoryDataId: inventoryRecord.id,
            image: String(item["IMAGE"] ?? ""),
            userId: ctx.session.user.id,
            name: String(item["Name"] ?? ""),
            sku: String(item["SKU"] ?? ""),
            upc: String(item["UPC"] ?? ""),
            comments: String(item["COMMENTS"] ?? ""),
            inbound: toFloat(item["Inbound"]),
            tag: String(item["Tag"] ?? ""),
            weight: toFloat(item["weight (LBS.)"]),
            cubicQtyPerUnit: toFloat(item["Cubic QTY / per unit"]),
            stock: toInt(item["Stock"]),
            key: item["key"] ? String(item["key"]) : "",
            imageUrl: item["image_url"] ? String(item["image_url"]) : "",
          };
        }),
      });

      return {
        ...inventoryRecord,
        itemsCreated: itemRecords.count,
      };
    }),

  // get all inventory data
  getInventoryData: protectedProcedure.query(async ({ ctx }) => {
    const data = await ctx.db.inventoryItem.findMany({
      where: { userId: ctx.session.user.id },
    });
    return data;
  }),

  // get single inventory data
  getInventorySingleData: protectedProcedure
    .input(z.object({ id: z.string() })) // define query param
    .query(async ({ ctx, input }) => {
      const data = await ctx.db.inventoryItem.findFirst({
        where: { id: input.id }, // use input.id here
      });
      return data;
    }),

  // update Excel data
  updateExcelData: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: z.record(z.any()), // array of records (Excel-style JSON rows)
      })
    )
    .mutation(async ({ input, ctx }) => {
      const existing = await ctx.db.inventoryItem.findUnique({
        where: { id: input.id },
      });

      if (!existing) {
        throw new Error("Not found or unauthorized");
      }

      const newData = {
        image: input.data.image,
        name: input.data.name,
        sku: input.data.sku,
        upc: input.data.upc,
        comments: input.data.comments,
        inbound: toFloat(input.data.inbound),
        tag: input.data.tag,
        weight: toFloat(input.data.weight),
        cubicQtyPerUnit: toFloat(input.data.cubicQtyPerUnit),
        stock: toInt(input.data.stock),
        imageUrl: input.data.imageUrl,
        key: input.data.Key,
      };

      const updated = await ctx.db.inventoryItem.update({
        where: { id: input.id },
        data: newData,
      });

      return updated;
    }),
});
