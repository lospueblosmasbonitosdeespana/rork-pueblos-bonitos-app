import { createTRPCRouter } from "./create-context";
import hiRoute from "./routes/example/hi/route";
import pueblosWithImagesRoute from "./routes/pueblos/with-images/route";

export const appRouter = createTRPCRouter({
  example: createTRPCRouter({
    hi: hiRoute,
  }),
  pueblos: createTRPCRouter({
    withImages: pueblosWithImagesRoute,
  }),
});

export type AppRouter = typeof appRouter;
