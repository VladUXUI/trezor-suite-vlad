import { type NetworkSymbol } from '@suite-common/wallet-config';

import { type GraphData } from 'src/types/wallet/graph';

import { demoAccounts } from './demoAccounts';

// Per-network monthly received/sent (in major units). Values picked to look
// like a slowly accumulating portfolio without resembling any real wallet.
const MONTHLY_FLOWS: Partial<
    Record<NetworkSymbol, { received: string[]; sent: string[]; rate: number }>
> = {
    eth: {
        received: ['0.08', '0.05', '0.10', '0.04', '0.06', '0.02'],
        sent: ['0.01', '0.005', '0.02', '0.01', '0.015', '0.005'],
        rate: 4000,
    },
    op: {
        received: ['0.02', '0.01', '0.015', '0.005', '0.008', '0.004'],
        sent: ['0.005', '0.001', '0.002', '0.001', '0.001', '0'],
        rate: 4000,
    },
    arb: {
        received: ['0.03', '0.02', '0.025', '0.01', '0.015', '0.005'],
        sent: ['0.005', '0.002', '0.005', '0.002', '0.003', '0.001'],
        rate: 4000,
    },
    base: {
        received: ['0.03', '0.025', '0.04', '0.015', '0.02', '0.008'],
        sent: ['0.005', '0.003', '0.008', '0.003', '0.005', '0.002'],
        rate: 4000,
    },
    pol: {
        received: ['25', '20', '30', '15', '20', '10'],
        sent: ['5', '3', '6', '2', '5', '1'],
        rate: 0.75,
    },
    btc: {
        received: ['0.004', '0.003', '0.005', '0.002', '0.003', '0.001'],
        sent: ['0.001', '0.0005', '0.001', '0.0003', '0.0008', '0.0002'],
        rate: 85000,
    },
    sol: {
        received: ['1.0', '0.5', '1.2', '0.4', '0.8', '0.3'],
        sent: ['0.2', '0.1', '0.3', '0.05', '0.15', '0.05'],
        rate: 210,
    },
};

const MS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;
const NOW_SEC = Math.floor(Date.now() / 1000);
const SAMPLES = 6;

export const demoGraphData: GraphData[] = demoAccounts.flatMap(account => {
    const flow = MONTHLY_FLOWS[account.symbol];
    if (!flow) return [];

    let runningBalance = 0;
    const data = Array.from({ length: SAMPLES }, (_, i) => {
        const monthsAgo = SAMPLES - i;
        const time = Math.floor((Date.now() - monthsAgo * MS_PER_MONTH) / 1000);
        const received = flow.received[i] ?? '0';
        const sent = flow.sent[i] ?? '0';
        runningBalance += parseFloat(received) - parseFloat(sent);

        return {
            time,
            txs: 1,
            received,
            sent,
            balance: runningBalance.toString(),
            rates: { usd: flow.rate },
        };
    });

    // Final "now" sample so the line ends at the latest balance.
    data.push({
        time: NOW_SEC,
        txs: 0,
        received: '0',
        sent: '0',
        balance: runningBalance.toString(),
        rates: { usd: flow.rate },
    });

    return [
        {
            account: {
                descriptor: account.descriptor,
                deviceState: account.deviceState,
                symbol: account.symbol,
            },
            error: false,
            isLoading: false,
            data,
        },
    ];
});
