import { NextResponse } from "next/server";
import { ACCOUNT_ID, PLUGIN_URL } from "../../config";

// sharedParameters.ts
const chainIdParam = {
  name: "chainId",
  in: "query",
  required: true,
  description: "EVM Network (aka chain ID)",
  schema: { type: "number" },
  example: 100,
};

const addressOrSymbolParam = {
  name: "address",
  in: "query",
  required: true,
  description:
    "The ERC-20 token symbol or address to be sold, if provided with the symbol do not try to infer the address.",
  schema: { type: "string" },
  example: "0x6810e776880c02933d47db1b9fc05908e5386b96",
};

const addressParam = {
  name: "address",
  in: "query",
  required: true,
  description: "20 byte Ethereum address with 0x prefix",
  schema: { type: "string" },
};

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
          "You create near and evm transactions related to bridging.",
        tools: [{ type: "generate-evm-tx" }],
        chainIds: [
          1, // Mainnet
          10, // Optimism
          56, // Binance Smart Chain (BSC)
          137, // Polygon
          8453, // Base (Coinbase L2)
          42161, // Arbitrum One
          42220, // CELO
          43114, // Avalanche
          81457, // Blast
        ],
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
        amount: {
          name: "amount",
          in: "query",
          description: "amount in Units",
          required: true,
          schema: {
            type: "number",
          },
          example: 0.123,
        },
        address: addressParam,
        evmAddress: { ...addressOrSymbolParam, name: "evmAddress" },
      },
      responses: {
        SignRequestResponse200: {
          description:
            "Transaction Payload along with some additional metadata related to the transaction bytes.",
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  transaction: {
                    $ref: "#/components/schemas/SignRequest",
                  },
                  meta: {
                    type: "object",
                    description:
                      "Additional metadata related to the transaction",
                    additionalProperties: true,
                    example: {
                      message: "Order submitted successfully",
                    },
                  },
                },
                required: ["transaction"],
              },
            },
          },
        },
      },
      schemas: {
        Address: {
          description:
            "20 byte Ethereum address encoded as a hex with `0x` prefix.",
          type: "string",
          example: "0x6810e776880c02933d47db1b9fc05908e5386b96",
        },
        MetaTransaction: {
          description: "Sufficient data representing an EVM transaction",
          type: "object",
          properties: {
            to: {
              $ref: "#/components/schemas/Address",
              description: "Recipient address",
            },
            data: {
              type: "string",
              description: "Transaction calldata",
              example: "0xd0e30db0",
            },
            value: {
              type: "string",
              description: "Transaction value",
              example: "0x1b4fbd92b5f8000",
            },
          },
          required: ["to", "data", "value"],
        },
        SignRequest: {
          type: "object",
          required: ["method", "chainId", "params"],
          properties: {
            method: {
              type: "string",
              enum: [
                "eth_sign",
                "personal_sign",
                "eth_sendTransaction",
                "eth_signTypedData",
                "eth_signTypedData_v4",
              ],
              description: "The signing method to be used.",
              example: "eth_sendTransaction",
            },
            chainId: {
              type: "integer",
              description:
                "The ID of the Ethereum chain where the transaction or signing is taking place.",
              example: 100,
            },
            params: {
              oneOf: [
                {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/MetaTransaction",
                  },
                  description: "An array of Ethereum transaction parameters.",
                },
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Parameters for personal_sign request",
                  example: [
                    "0x4578616d706c65206d657373616765",
                    "0x0000000000000000000000000000000000000001",
                  ],
                },
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Parameters for eth_sign request",
                  example: [
                    "0x0000000000000000000000000000000000000001",
                    "0x4578616d706c65206d657373616765",
                  ],
                },
                {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description:
                    "Parameters for signing structured data (TypedDataParams)",
                  example: [
                    "0x0000000000000000000000000000000000000001",
                    '{"data": {"types": {"EIP712Domain": [{"name": "name","type": "string"}]}}}',
                  ],
                },
              ],
            },
          },
        },
      },
    },
  };

  return NextResponse.json(pluginData);
}
