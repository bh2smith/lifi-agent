import { NextResponse } from "next/server";
import {
  addressField,
  addressOrSymbolField,
  BlockchainMapping,
  FieldParser,
  getTokenDetails,
  numberField,
  signRequestFor,
  TokenInfo,
  validateInput,
} from "@bitte-ai/agent-sdk";
import {
  Address,
  encodeFunctionData,
  erc20Abi,
  getAddress,
  parseUnits,
} from "viem";
import { bridgeQuote, getTokenMap } from "./util";
import { LiFiStep } from "@lifi/sdk";

interface Input {
  srcChain: number;
  dstChain: number;
  amount: number;
  evmAddress: Address;
  srcToken: string;
  dstToken: string;
}

const parsers: FieldParser<Input> = {
  srcChain: numberField,
  dstChain: numberField,
  amount: numberField,
  evmAddress: addressField,
  srcToken: addressOrSymbolField,
  dstToken: addressOrSymbolField,
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    console.log("quote/", searchParams);
    const input = validateInput<Input>(searchParams, parsers);
    console.log("Parsed Input", input)
    const { quote, buyToken, bridgeAmount } = await logic(await getTokenMap(), input);
    // Create EVM transaction object
    if (!quote.transactionRequest) {
      return NextResponse.json({ error: "No route found" }, { status: 400 });
    }

    const { to, value, data } = quote.transactionRequest;
    const bridgeContract = getAddress(to!);
    const signRequestTransaction = signRequestFor({
      chainId: input.srcChain,
      metaTransactions: [
        {
          to: buyToken.address,
          value: "0x0",
          data: encodeFunctionData({
            abi: erc20Abi,
            functionName: "approve",
            args: [bridgeContract, bridgeAmount],
          }),
        }, // Approve Source token
        { to: bridgeContract, value: value || "0x00", data: data || "0x" },
      ],
    });
    console.log("Responding with", signRequestTransaction);
    return NextResponse.json(
      { transaction: signRequestTransaction, meta: quote },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error generating EVM transaction:", error);
    return NextResponse.json(
      { error: "Failed to generate EVM transaction" },
      { status: 500 },
    );
  }
}

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
