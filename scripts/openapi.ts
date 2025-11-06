import { execSync } from "node:child_process";
import fs from "node:fs";
import crypto from "node:crypto";

import env from "@midori/libs/env";

const OPENAPI_SPEC_URL = `${env.API_URL}/openapi/json`;
const CACHE_FILE = "./.cache/.openapi_hash";
const OUTPUT_FILE = "./src/libs/api/types.ts";
const RETRY_INTERVAL_MS = 10000;
const MAX_RETRIES = 25;

async function fetchOpenAPISpec() {
  const res = await fetch(OPENAPI_SPEC_URL);
  if (!res.ok) {
    throw new Error(`Failed to fetch OpenAPI spec: ${res.statusText}`);
  }
  return res.json();
}

const getHash = (data: string) =>
  crypto.createHash("sha256").update(data).digest("hex");

const getCachedHash = () =>
  fs.existsSync(CACHE_FILE) ? fs.readFileSync(CACHE_FILE, "utf-8") : null;

const cacheHash = (hash: string) => {
  fs.mkdirSync("./.cache", { recursive: true });
  fs.writeFileSync(CACHE_FILE, hash, "utf-8");
};

async function generateTypes() {
  const spec = await fetchOpenAPISpec();
  const specString = JSON.stringify(spec);
  const currentHash = getHash(specString);
  const cachedHash = getCachedHash();

  if (currentHash === cachedHash) {
    console.log(
      `[${new Date().toISOString()}] - OpenAPI spec unchanged. Skipping type generation.`,
    );
    return;
  }

  fs.writeFileSync("./.cache/openapi.json", specString, "utf-8");

  try {
    execSync(
      `bun openapi-typescript ./.cache/openapi.json --output ${OUTPUT_FILE}`,
      { stdio: "inherit" },
    );
    console.log(
      `[${new Date().toISOString()}] - Generated TypeScript types at ${OUTPUT_FILE}`,
    );
    cacheHash(currentHash);
  } catch (error) {
    console.error("Failed to generate TypeScript types:", error);
    process.exit(1);
  }
}

function webSocketTest(retries = 0) {
  try {
    const ws = new WebSocket(`${env.API_URL.replace("http", "ws")}/api`);

    ws.addEventListener("open", generateTypes);

    ws.addEventListener("close", () => {
      console.warn("WebSocket connection closed.");
      if (retries < MAX_RETRIES) {
        console.log(
          `Retrying WebSocket connection in ${RETRY_INTERVAL_MS / 1000} seconds... (Attempt ${
            retries + 1
          }/${MAX_RETRIES})`,
        );
        setTimeout(() => webSocketTest(retries + 1), RETRY_INTERVAL_MS);
      }
    });
  } catch (error) {
    console.error("WebSocket connection error:", error);
    if (retries < MAX_RETRIES) {
      console.log(
        `Retrying WebSocket connection in ${RETRY_INTERVAL_MS / 1000} seconds... (Attempt ${
          retries + 1
        }/${MAX_RETRIES})`,
      );
      setTimeout(() => webSocketTest(retries + 1), RETRY_INTERVAL_MS);
    } else {
      console.error("Max WebSocket connection attempts reached. Exiting.");
      process.exit(1);
    }
  }
}

webSocketTest();
