// This is all LiFi Bridge: https://li.fi/api-sdk/
import { SUPPORTED_CHAIN_IDS } from "@/src/app/config";
import {
  addressField,
  addressOrSymbolField,
  BlockchainMapping,
  FieldParser,
  floatField,
  getTokenDetails,
  loadTokenMap,
  numberField,
  TokenInfo,
} from "@bitte-ai/agent-sdk";
import type { ChainId, LiFiStep } from "@lifi/sdk";
import { createConfig, getQuote } from "@lifi/sdk";
import { unstable_cache } from "next/cache";
import { getAddress, parseUnits, type Address } from "viem";

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
      return loadTokenMap(SUPPORTED_CHAIN_IDS);
    },
    ["token-map"], // cache key
    {
      revalidate: 86400, // revalidate 24 hours
      tags: ["token-map"],
    },
  );

  return getCachedTokenMap();
}

export interface Input {
  srcChain: number;
  dstChain: number;
  amount: number;
  evmAddress: Address;
  srcToken: string;
  dstToken: string;
}

export const parsers: FieldParser<Input> = {
  srcChain: numberField,
  dstChain: numberField,
  amount: floatField,
  evmAddress: addressField,
  srcToken: addressOrSymbolField,
  dstToken: addressOrSymbolField,
};

export async function logic(
  tokenMap: BlockchainMapping,
  input: Input,
): Promise<{ buyToken: TokenInfo; bridgeAmount: bigint; quote: LiFiStep }> {
  const { srcChain, srcToken, dstChain, dstToken, amount, evmAddress } = input;
  const [buyToken, sellToken] = await Promise.all([
    getTokenDetails(dstChain, dstToken, tokenMap),
    getTokenDetails(srcChain, srcToken, tokenMap),
  ]);
  if (!(buyToken && sellToken)) {
    throw new Error(
      `buy OR sell token not found: buy=${buyToken}, sell=${sellToken}`,
    );
  }
  console.log(
    `Tokens: sell=${JSON.stringify(sellToken)}, buy=${JSON.stringify(buyToken)}`,
  );
  const bridgeAmount = parseUnits(amount.toString(), sellToken.decimals);
  console.log("Bridge Amount", bridgeAmount);
  const quote = await bridgeQuote({
    account: getAddress(evmAddress),
    amount: bridgeAmount,
    src: { chain: srcChain, address: sellToken.address },
    dest: { chain: dstChain, address: buyToken.address },
  });
  console.log("got Quote with ID", quote.id);
  return { quote, buyToken, bridgeAmount };
}
