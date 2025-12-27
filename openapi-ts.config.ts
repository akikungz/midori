import { defineConfig } from "@hey-api/openapi-ts";

export default defineConfig({
  input: `${process.env.API_URL}/api/openapi/json`,
  output: "src/lib/api",
  plugins: ["@tanstack/react-query"],
});
