import { NextResponse } from "next/server";
import { signRequestFor, validateInput } from "@bitte-ai/agent-sdk";
import { encodeFunctionData, erc20Abi, getAddress, Hex } from "viem";
import { getTokenMap, Input, logic, parsers } from "./util";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    console.log("quote/", searchParams);
    const input = validateInput<Input>(searchParams, parsers);
    console.log("Parsed Input", input);
    const { quote, buyToken, bridgeAmount } = await logic(
      await getTokenMap(),
      input,
    );
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
        {
          to: bridgeContract,
          value: (value || "0x00") as Hex,
          data: (data || "0x") as Hex,
        },
      ],
    });
    console.log("Responding with", signRequestTransaction);
    return NextResponse.json(
      { transaction: signRequestTransaction, meta: quote },
      { status: 200 },
    );
  } catch (error) {
    const message = `Error generating EVM transaction: ${error}`;
    console.error(message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
