import { NextResponse } from "next/server";
import { ACCOUNT_ID, PLUGIN_URL, SUPPORTED_CHAIN_IDS } from "../../config";
import {
  chainIdParam,
  addressParam,
  addressOrSymbolParam,
  SignRequestResponse200,
  SignRequestSchema,
  AddressSchema,
  MetaTransactionSchema,
  amountParam,
} from "@bitte-ai/agent-sdk";
export async function GET() {
  const pluginData = {
    openapi: "3.0.0",
    info: {
      title: "EVM Bridge Agent",
      description: "API exposing bridge router transaciton payloads",
      version: "1.0.0",
    },
    servers: [
      {
        url: PLUGIN_URL,
      },
    ],
    "x-mb": {
      "account-id": ACCOUNT_ID,
      assistant: {
        name: "LiFi Bridge Agent",
        description: "An agent facilitating brige transaction.",
        instructions:
          "You create near and evm transactions related to bridging. You should not infer token decimals and always send the units for amount as specified by the user.",
        tools: [{ type: "generate-evm-tx" }],
        image: `${PLUGIN_URL}/lifi.png`,
        categories: ["defi", "bridge"],
        chainIds: SUPPORTED_CHAIN_IDS,
      },
    },
    paths: {
      "/api/tools/bridge": {
        get: {
          summary: "get bridge quote and transaction payload",
          description:
            "Responds with a LiFi bridge quote and transaction payload.",
          operationId: "bridge",
          parameters: [
            { $ref: "#/components/parameters/srcChain" },
            { $ref: "#/components/parameters/dstChain" },
            { $ref: "#/components/parameters/amount" },
            { $ref: "#/components/parameters/srcToken" },
            { $ref: "#/components/parameters/dstToken" },
            { $ref: "#/components/parameters/evmAddress" },
          ],
          responses: {
            "200": { $ref: "#/components/responses/SignRequestResponse200" },
          },
        },
      },
    },
    components: {
      parameters: {
        srcChain: { ...chainIdParam, name: "srcChain" },
        dstChain: { ...chainIdParam, name: "dstChain" },
        chainId: chainIdParam,
        srcToken: { ...addressOrSymbolParam, name: "srcToken" },
        dstToken: { ...addressOrSymbolParam, name: "dstToken" },
        amount: amountParam,
        address: addressParam,
        evmAddress: { ...addressOrSymbolParam, name: "evmAddress" },
      },
      responses: {
        SignRequestResponse200,
      },
      schemas: {
        Address: AddressSchema,
        MetaTransaction: MetaTransactionSchema,
        SignRequest: SignRequestSchema,
      },
    },
  };

  return NextResponse.json(pluginData);
}
