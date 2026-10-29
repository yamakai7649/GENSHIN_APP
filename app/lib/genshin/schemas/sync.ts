import { z } from "zod";
import {
  genshinAccountSchema,
  genshinOverviewSchema,
} from "@/lib/genshin/schemas/account";
import { genshinCharacterSchema } from "@/lib/genshin/schemas/character";

export const rawGenshinSyncDataSchema = z
  .object({
    account: genshinAccountSchema,
    overview: genshinOverviewSchema,
    characters: z.object({
      list: z.array(genshinCharacterSchema),
    }),
  })
  .transform((data) => ({
    account: data.account,
    overview: data.overview,
    characters: data.characters.list,
  }));

export const genshinSyncDataSchema = z.object({
  account: genshinAccountSchema,
  overview: genshinOverviewSchema,
  characters: z.array(genshinCharacterSchema),
});

export type GenshinSyncData = z.infer<typeof genshinSyncDataSchema>;
