import * as net from 'net';
import * as crypto from 'crypto';
import { Snowflake } from 'discord.js';

export interface TimezoneResponse {
  code: number,
  message: string,
}

export interface TimezoneRequest {
  requestType: RequestType,
  data: AliasData | UserData
}

interface AliasData {
  alias: string
}

interface UserData {
  userId: Snowflake
}

export enum RequestType {
  TIMEZONE_FROM_ALIAS = "RequestType.TIMEZONE_FROM_ALIAS_REQUEST",
  TIMEZONE = "RequestType.TIMEZONE_REQUEST",
  ALIAS = "RequestType.ALIAS_REQUEST",
  USER_FROM_ALIAS = "RequestType.USER_FROM_ALIAS_REQUEST"
}

function encrypt(text: string, key: string): Buffer {
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-256-cbc", Buffer.from(key, "utf-8"), iv);

    const encrypted = Buffer.concat([cipher.update(text, "utf-8"), cipher.final()]);

    const ivAndEncryptedData = Buffer.concat([iv, encrypted]);

    return ivAndEncryptedData;
}

function decrypt(encodedData: Buffer, key: string): string {
    const iv = encodedData.slice(0, 16);

    const encryptedData = encodedData.slice(16);

    const decipher = crypto.createDecipheriv("aes-256-cbc", Buffer.from(key, "utf-8"), iv);

    const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
    ]);

    return decrypted.toString("utf-8");
}

export const send = (message: TimezoneRequest): Promise<TimezoneResponse> => {
  return new Promise((resolve, reject) => {
    const key = process.env.TIMEZONE_API_KEY;
    const host = process.env.TIMEZONE_API_HOST;
    const port = process.env.TIMEZONE_API_PORT;
    if (!key || !host || !port) throw new Error("Timezone API is missing .env variables!");

    // const encryptedMessage = encrypt(JSON.stringify(message), key);
    const encryptedMessage = Buffer.from(JSON.stringify(message), "utf-8");

    const client = net.createConnection({ host: host, port: Number.parseInt(port) });

    client.on("data", (data: Buffer) => {
      //const response = JSON.parse(decrypt(data, key));
      const response = JSON.parse(data.toString("utf-8"));
      console.log(response)
      resolve(response as TimezoneResponse);
      client.end();
    });

    client.on("connect", () => {
      client.write(encryptedMessage);
    })

    client.on('error', (err: Error) => {
      console.error('Error:', err.message);
      resolve({code: 404, message:"Not Found"})
      client.end()
    });
  });
};