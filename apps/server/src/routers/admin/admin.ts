import { z } from "zod";
import { adminProtectedProcedure, router } from "../../lib/trpc";
import { toFloat } from "../../utils/index";

export const adminRouter = router({
  getAllUserWithItems: adminProtectedProcedure.query(async ({ ctx }) => {
    if (ctx.session.user.role !== "admin") {
      throw new Error("Unauthorized: Admin access only");
    }

    // Get all users
    const users = await ctx.db.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
      },
    });

    // Group inventory items by userId
    const totalItems = await ctx.db.inventoryItem.groupBy({
      by: ["userId"],
      _count: {
        _all: true,
      },
    });

    // Group received items
    const receivedItems = await ctx.db.inventoryItem.groupBy({
      by: ["userId"],
      where: {
        received: true,
      },
      _count: {
        received: true,
      },
    });

    const userStats = users.map((user) => {
      const total =
        totalItems.find((i) => i.userId === user.id)?._count._all ?? 0;
      const received =
        receivedItems.find((i) => i.userId === user.id)?._count.received ?? 0;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        totalInventoryItemsCount: total,
        receivedItemsCount: received,
      };
    });

    return {
      totalUsers: users.length,
      users: userStats,
    };
  }),

  getUserByIdWithItems: adminProtectedProcedure
    .input(
      z.object({
        userId: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access only");
      }

      const user = await ctx.db.user.findUnique({
        where: {
          id: input.userId,
        },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!user) {
        throw new Error("User not found");
      }

      const inventoryItems = await ctx.db.inventoryItem.findMany({
        where: {
          userId: input.userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return {
        user,
        inventoryItems,
      };
    }),

  updateInventoryItemQuantities: adminProtectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        stock: z.number(),
        cubicQtyPerUnit: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.session.user.role !== "admin") {
        throw new Error("Unauthorized: Admin access only");
      }

      const updatedItem = await ctx.db.inventoryItem.update({
        where: {
          id: input.itemId,
        },
        data: {
          stock: input.stock,
          cubicQtyPerUnit: toFloat(input.cubicQtyPerUnit),
        },
      });

      return {
        message: "Inventory item updated successfully.",
        updatedItem,
      };
    }),
});
