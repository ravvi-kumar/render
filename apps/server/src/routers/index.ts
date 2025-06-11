import { protectedProcedure, publicProcedure, router } from "../lib/trpc";
import { adminRouter } from "./admin/admin";
import { inventoryRouter } from "./user/inventory";

export const appRouter = router({
  healthCheck: publicProcedure.query(() => {
    return {
      message: "NOt working",
    }
  }),
  privateData: protectedProcedure.query(({ ctx }) => {
    return {
      message: "This is private",
      user: ctx.session.user,
    };
  }),
  inventory: inventoryRouter,
  admin : adminRouter
});
export type AppRouter = typeof appRouter;
