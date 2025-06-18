// This is all LiFi Bridge: https://li.fi/api-sdk/
import { BlockchainMapping, loadTokenMap } from "@bitte-ai/agent-sdk";
import type { ChainId, LiFiStep } from "@lifi/sdk";
import { createConfig, getQuote } from "@lifi/sdk";
import { unstable_cache } from "next/cache";
import type { Address } from "viem";

createConfig({ integrator: "bh2smith.eth" });

export interface TokenId {
  chain: ChainId;
  address: Address;
}

export interface BridgeInput {
  account: Address;
  amount: bigint;
  src: TokenId;
  dest: TokenId;
}

export async function bridgeQuote({
  src,
  dest,
  account,
  amount,
}: BridgeInput): Promise<LiFiStep> {
  const quote = await getQuote({
    fromAddress: account,
    fromChain: src.chain,
    toChain: dest.chain,
    fromToken: src.address,
    toToken: dest.address,
    fromAmount: amount.toString(),
  });
  return quote;
}

// TODO: Move this into library.
export async function getTokenMap(): Promise<BlockchainMapping> {
  const getCachedTokenMap = unstable_cache(
    async () => {
      console.log("Loading TokenMap...");
      return loadTokenMap(getEnvVar("TOKEN_MAP_URL"));
    },
    ["token-map"], // cache key
    {
      revalidate: 86400, // revalidate 24 hours
      tags: ["token-map"],
    },
  );

  return getCachedTokenMap();
}

function getEnvVar(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`${key} is not set`);
  }
  return value;
}
