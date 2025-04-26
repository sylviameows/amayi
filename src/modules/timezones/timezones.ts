import { Snowflake } from "discord.js";
import { RequestType, send } from "./socket";

export default {
  fromId: async (userId: Snowflake): Promise<string | null> => {
    const response = await send({
      requestType: RequestType.TIMEZONE,
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
      data: {
        alias
      }
    })

    if (response.code == 404) return null;
    return response.message
  }
}
