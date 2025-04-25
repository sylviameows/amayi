import { Snowflake } from "discord.js";
import { send } from "./socket";

export async function timezoneFromId(userId: Snowflake): Promise<string | null> {
  const response = await send({
    requestType: "RequestType.TIMEZONE_REQUEST",
    data: {
      userId
    }
  })
  return response.message
}

export async function aliasFromId(userId: Snowflake): Promise<string | null> {
  const response = await send({
    requestType: "RequestType.ALIAS_REQUEST",
    data: {
      userId
    }
  })
  return response.message
}

export async function timezoneFromAlias(alias: string): Promise<string | null> {
  const response = await send({
    requestType: "RequestType.TIMEZONE_FROM_ALIAS_REQUEST",
    data: {
      alias
    }
  })
  return response.message
}

export async function idFromAlias(alias: string): Promise<string | null> {
    const response = await send({
      requestType: "RequestType.USER_FROM_ALIAS_REQUEST",
      data: {
          alias: alias
      }
  })
    return response.message
}