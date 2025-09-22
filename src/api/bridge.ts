import { Router, Request, Response } from "express";
import { validateInput } from "@bitte-ai/agent-sdk";
import { encodeFunctionData, erc20Abi, getAddress, Hex } from "viem";
import { getTokenMap, Input, logic, parsers } from "../util";
import { SignRequest } from "@bitte-ai/agent-sdk/evm";

const bridgeHandler = Router();

bridgeHandler.get("/", async (req: Request, res: Response) => {
  const search = new URL(req.url).searchParams;
  console.log("quote/", search);
  const input = validateInput<Input>(search, parsers);
  console.log("Parsed Input", input);

  const { quote, buyToken, bridgeAmount } = await logic(
    await getTokenMap(),
    input,
  );
  // Create EVM transaction object
  if (!quote.transactionRequest) {
    res.status(400).json({ error: "No route found" });
    return;
  }
  const { to, value, data } = quote.transactionRequest;
  const bridgeContract = getAddress(to!);
  const signRequestTransaction: SignRequest = {
    method: "eth_sendTransaction",
    chainId: input.srcChain,
    params: [
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
  };
  console.log("Responding with", signRequestTransaction);
  return res
    .status(200)
    .json({ transaction: signRequestTransaction, meta: quote });
});

export default bridgeHandler;
