// import * as net from 'net';
import * as dgram from 'dgram'
import * as crypto from 'crypto';
import { Snowflake } from 'discord.js';

export interface TimezoneResponse {
  code: number,
  message: string,
}

export interface TimezoneRequest {
  requestType: RequestType,
  apiKey: string | null,
  data: AliasData | UserData
}

interface AliasData {
  alias: string
}

interface UserData {
  userId: Snowflake
}

export enum RequestType {
  TIMEZONE_FROM_ALIAS = "TIMEZONE_FROM_ALIAS",
  TIMEZONE = "TIMEZONE_FROM_USERID",
  ALIAS = "ALIAS_FROM_USERID",
  USER_FROM_ALIAS = "USERID_FROM_ALIAS"
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

// TCP
/*export const send = (message: TimezoneRequest): Promise<TimezoneResponse> => {
  return new Promise((resolve, reject) => {
    const key = process.env.TIMEZONE_API_KEY;
    const host = process.env.TIMEZONE_API_HOST;
    const port = process.env.TIMEZONE_API_PORT;
    if (!key || !host || !port) throw new Error("Timezone API is missing .env variables!");

    // const encryptedMessage = encrypt(JSON.stringify(message), key);
    message.apiKey = key
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
};*/

// UDP
export const send = (message: TimezoneRequest): Promise<TimezoneResponse> => {
  return new Promise((resolve, reject) => {
    const key = process.env.TIMEZONE_API_KEY;
    const host = process.env.TIMEZONE_API_HOST;
    const port = process.env.TIMEZONE_API_PORT;
    if (!key || !host || !port) throw new Error("Timezone API is missing .env variables!");

    // const encryptedMessage = encrypt(JSON.stringify(message), key);
    message.apiKey = key
    const encryptedMessage = Buffer.from(JSON.stringify(message), "utf-8");

    const client = dgram.createSocket('udp4');
    let timeout: NodeJS.Timeout;
    client.on('message', (message, rinfo) => {
      clearTimeout(timeout);
      //const response = JSON.parse(decrypt(data, key));
      const response = JSON.parse(message.toString("utf-8"));
      console.log(response)
      resolve(response as TimezoneResponse)
      client.close()
    });

    client.send(encryptedMessage, Number.parseInt(port), host, (err) => {
      if(err) {
        console.log("Error: ", err.message);
        resolve({code: 400, message:"Bad Request"});
        client.close()
      }
    });

    timeout = setTimeout(() => {
      console.log("Timeout: No response received in 3 seconds");
      client.close();
      resolve({code: 500, message:"Internal Server Error"});
    }, 3000);
  });
};