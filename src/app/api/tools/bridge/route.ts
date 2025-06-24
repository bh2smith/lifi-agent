import { NextResponse } from "next/server";
import {
  addressField,
  addressOrSymbolField,
  FieldParser,
  getTokenDetails,
  numberField,
  signRequestFor,
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
    const { srcChain, srcToken, dstChain, dstToken, amount, evmAddress } =
      validateInput<Input>(searchParams, parsers);
    const tokenMap = await getTokenMap();

    const [buyToken, sellToken] = await Promise.all([
      getTokenDetails(dstChain, dstToken, tokenMap),
      getTokenDetails(srcChain, srcToken, tokenMap),
    ]);
    if (!(buyToken && sellToken)) {
      return NextResponse.json(
        {
          error: `buy OR sell token not found: buy=${buyToken}, sell=${sellToken}`,
        },
        { status: 400 },
      );
    }
    console.log(`Tokens: sell=${sellToken}, buy=${buyToken}`);
    const bridgeAmount = parseUnits(amount.toString(), sellToken.decimals);
    console.log("Bridge Amount", bridgeAmount);
    const quote = await bridgeQuote({
      account: getAddress(evmAddress),
      amount: bridgeAmount,
      src: { chain: srcChain, address: sellToken.address },
      dest: { chain: dstChain, address: buyToken.address },
    });
    console.log("got Quote with ID", quote.id);
    // Create EVM transaction object
    if (!quote.transactionRequest) {
      return NextResponse.json({ error: "No route found" }, { status: 400 });
    }

    const { to, value, data } = quote.transactionRequest;
    const bridgeContract = getAddress(to!);
    const signRequestTransaction = signRequestFor({
      chainId: srcChain,
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
