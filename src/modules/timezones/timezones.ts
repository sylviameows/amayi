import { Snowflake } from "discord.js";
import { RequestType, send } from "./socket";

export default {
  fromId: async (userId: Snowflake): Promise<string | null> => {
    const response = await send({
      requestType: RequestType.TIMEZONE,
      apiKey: null,
      data: {
        userId
      }
    })

    if (response.code == 404) return null;
    return response.message
  },

  aliasFromUserId: async (userId: Snowflake): Promise<string | null> => {
    const response = await send({
      requestType: RequestType.ALIAS,
      apiKey: null,
      data: {
        userId
      }
    })

    if (response.code == 404) return null;
    return response.message
  },

  fromAlias: async (alias: string): Promise<string | null> => {
    const response = await send({
      requestType: RequestType.TIMEZONE_FROM_ALIAS,
      apiKey: null,
      data: {
        alias
      }
    })

    if (response.code == 404) return null;
    return response.message
  },

  userIdFromAlias: async (alias: string): Promise<string | null> => {
    const response = await send({
      requestType: RequestType.USER_FROM_ALIAS,
      apiKey: null,
      data: {
        alias
      }
    })

    if (response.code == 404) return null;
    return response.message
  }
}
