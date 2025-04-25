import * as net from 'net';
import * as crypto from 'crypto';

import type { TimezoneRequest, TimezoneResponse } from './timezones'

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
    if (!key) throw new Error("Timezone API key is not present!");

    const encryptedMessage = encrypt(JSON.stringify(message), key);

    const client = net.createConnection({ host: 'apollo.arcator.co.uk', port: 8888 });

    client.on("data", (data: Buffer) => {
      const response = JSON.parse(decrypt(data, key));
      resolve(response as TimezoneResponse);
      client.end();
    });

    client.on("connect", () => {
      client.write(encryptedMessage);
    })

    client.on('error', (err: Error) => {
      console.error('Error:', err.message);
      reject(err);
    });
  });
};