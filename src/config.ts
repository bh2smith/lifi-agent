const ACCOUNT_ID = process.env.ACCOUNT_ID || "max-normal.near";

// TODO: https://github.com/bh2smith/evm-test-agent/issues/20
const {
  VERCEL_ENV,
  VERCEL_URL,
  VERCEL_BRANCH_URL,
  VERCEL_PROJECT_PRODUCTION_URL,
} = process.env;
const DEPLOYMENT_URL = (() => {
  switch (VERCEL_ENV) {
    case 'production':
      return `https://${VERCEL_PROJECT_PRODUCTION_URL}`;
    case 'preview':
      return `https://${VERCEL_BRANCH_URL || VERCEL_URL}`;
    default:
      return `http://localhost:${process.env.PORT || 3000}`;
  }
})();

const PLUGIN_URL =
  DEPLOYMENT_URL || `${'localhost'}:${process.env.PORT || 3000}`;

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
