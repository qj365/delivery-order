import crypto from "node:crypto";
import { env } from "@src/env";

export function createHmacFromData(data: string, secret: string) {
  return crypto.createHmac("sha256", secret).update(data).digest("hex");
}

export function verifyHmac(
  plaintext: string,
  ciphertext: string,
  secret: string,
) {
  return createHmacFromData(plaintext, secret) === ciphertext;
}

export function decodeBase64String(data: string) {
  const dataDecoded = Buffer.from(data, "base64").toString("utf8");

  return dataDecoded;
}

export function encodeBase64String(dataString: string): string {
  const dataEncoded = Buffer.from(dataString).toString("base64");

  return dataEncoded;
}

export function md5ToHex(data: string) {
  return crypto.createHash("md5").update(data).digest("hex");
}

export function md5ToBinary(data: string) {
  return crypto.createHash("md5").update(data).digest();
}

function getDeterministicIV(text: string) {
  return crypto.createHash("md5").update(text).digest().subarray(0, 16); // IV 16 byte
}
