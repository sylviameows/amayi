import { Snowflake } from "discord.js"

export interface TimezoneResponse {
  code: number,
  message: string,
}

export interface TimezoneRequest {
  requestType: string,
  data: Object
}