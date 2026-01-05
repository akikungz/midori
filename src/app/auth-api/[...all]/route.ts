import { auth } from "@midori/lib/auth-server";
import { toNextJsHandler } from "better-auth/next-js";
// import { toNodeHandler } from "better-auth/node";

// export const config = { api: { bodyParser: false } };

// export default toNodeHandler(auth.handler); 

export const { GET, POST } = toNextJsHandler(auth.handler);
