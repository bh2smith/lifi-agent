import { logic } from '@/src/app/api/tools/bridge/route';
import { getTokenMap } from '@/src/app/api/tools/bridge/util';
import { getAddress } from 'viem';

const WETH_ADDRESS = getAddress("0x4200000000000000000000000000000000000006");
const mockTokenInfo = {
  symbol: 'weth',
  address: WETH_ADDRESS,
  decimals: 18,
};

const mockTokenMap = {10: {"weth": mockTokenInfo}, 8453: {"weth": mockTokenInfo}};

describe('logic', () => {
  it('returns quote, buyToken, and bridgeAmount', async () => {
    const input = {
      amount: 0.0025,
      dstChain: 10,
      dstToken: 'WETH',
      srcChain: 8453,
      srcToken: 'WETH',
      evmAddress: getAddress('0xB00b4C1e371DEe4F6F32072641430656D3F7c064'),
    };

    const result = await logic(mockTokenMap, input);
    console.log(result)
  });
});