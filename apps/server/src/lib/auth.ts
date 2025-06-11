import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "../../prisma";
import { admin, openAPI } from "better-auth/plugins";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "mongodb",
  }),
  trustedOrigins: [process.env.CORS_ORIGIN || "","https://prepvia-monorepo-prepvia.vercel.app"],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification:false
  },
  plugins : [
        openAPI(),
        admin() 
  ]
});
