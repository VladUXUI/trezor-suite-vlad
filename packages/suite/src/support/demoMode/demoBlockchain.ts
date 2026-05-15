import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type Blockchain } from '@suite-common/wallet-types';

// Marking each demoed network's blockchain connection as healthy so we don't
// flash "Reconnecting to <chain>..." banners on the demo deploy. The reducer
// already pre-fills entries for every network; we only override the chains we
// care about.
const stub: Blockchain = {
    connected: true,
    blockHash: '0xdemo',
    blockHeight: 18_000_000,
    version: '0.0.0',
    backends: {},
};

const symbols: NetworkSymbol[] = ['eth', 'op', 'arb', 'base', 'pol', 'btc', 'sol'];

export const demoBlockchain: Partial<Record<NetworkSymbol, Blockchain>> = symbols.reduce(
    (acc, symbol) => {
        acc[symbol] = stub;

        return acc;
    },
    {} as Partial<Record<NetworkSymbol, Blockchain>>,
);
