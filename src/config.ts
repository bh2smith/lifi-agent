import { DEPLOYMENT_URL } from "vercel-url";

const ACCOUNT_ID = process.env.ACCOUNT_ID || "max-normal.near";

// Set the plugin url in order of BITTE_CONFIG, env, DEPLOYMENT_URL (used for Vercel deployments)
const PLUGIN_URL =
  DEPLOYMENT_URL ||
  `${process.env.NEXT_PUBLIC_HOST || "localhost"}:${process.env.PORT || 3000}`;

if (!PLUGIN_URL) {
  console.error(
    "!!! Plugin URL not found in env, BITTE_CONFIG or DEPLOYMENT_URL !!!",
  );
  process.exit(1);
}

const SUPPORTED_CHAIN_IDS = [
  1, // Mainnet
  10, // Optimism
  56, // Binance Smart Chain (BSC)
  137, // Polygon
  8453, // Base (Coinbase L2)
  42161, // Arbitrum One
  42220, // CELO
  43114, // Avalanche
  81457, // Blast
];

export { ACCOUNT_ID, PLUGIN_URL, SUPPORTED_CHAIN_IDS };
