import { type AccountKey, type WalletAccountTransaction } from '@suite-common/wallet-types';

import { demoAccounts } from './demoAccounts';
import { DEMO_DEVICE_STATE } from './demoConstants';

const DAY = 24 * 60 * 60;

const randomHex = (length: number) => {
    let out = '';
    for (let i = 0; i < length; i++) {
        out += Math.floor(Math.random() * 16).toString(16);
    }

    return out;
};

const txid = () => `0x${randomHex(64)}`;

type TxSpec = {
    type: 'sent' | 'recv' | 'self';
    daysAgo: number;
    amount: string;
    fee: string;
    counterparty: string;
};

const evmTxSpecs: TxSpec[] = [
    {
        type: 'recv',
        daysAgo: 2,
        amount: '50000000000000000',
        fee: '210000000000000',
        counterparty: '0x7C7F8e3F2147A23a445eaC9D26b8a716D8c52D45',
    },
    {
        type: 'sent',
        daysAgo: 8,
        amount: '25000000000000000',
        fee: '180000000000000',
        counterparty: '0xc02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    },
    {
        type: 'recv',
        daysAgo: 15,
        amount: '100000000000000000',
        fee: '210000000000000',
        counterparty: '0xa0b86991c6218B36C1d19D4A2E9eB0Ce3606Eb48',
    },
    {
        type: 'sent',
        daysAgo: 23,
        amount: '12000000000000000',
        fee: '150000000000000',
        counterparty: '0x6B175474E89094c44Da98b954EedeAC495271d0F',
    },
];

const solTxSpecs: TxSpec[] = [
    {
        type: 'recv',
        daysAgo: 3,
        amount: '1500000000', // 1.5 SOL
        fee: '5000',
        counterparty: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    },
    {
        type: 'sent',
        daysAgo: 9,
        amount: '500000000', // 0.5 SOL
        fee: '5000',
        counterparty: '5q544ko3y4D4tJg6yLqfqEsohjQyHKKBhRrtRYzx9pX2',
    },
    {
        type: 'recv',
        daysAgo: 17,
        amount: '2000000000',
        fee: '5000',
        counterparty: 'EQwHbALCgsvtwAh4o5fXkBwzqUbGFTV1Fb3CkpKsphCq',
    },
    {
        type: 'sent',
        daysAgo: 24,
        amount: '300000000',
        fee: '5000',
        counterparty: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
    },
];

const btcTxSpecs: TxSpec[] = [
    {
        type: 'recv',
        daysAgo: 1,
        amount: '350000',
        fee: '1200',
        counterparty: 'bc1q9zpgru4xkyu5p6yqz8s7lwfvqr9k7zydmkjry3',
    },
    {
        type: 'sent',
        daysAgo: 5,
        amount: '125000',
        fee: '1500',
        counterparty: '3FZbgi29cpjq2GjdwV8eyHuJJnkLtktZc5',
    },
    {
        type: 'recv',
        daysAgo: 11,
        amount: '500000',
        fee: '1100',
        counterparty: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
    },
    {
        type: 'self',
        daysAgo: 18,
        amount: '80000',
        fee: '900',
        counterparty: 'bc1qchangeaddrxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
    },
    {
        type: 'sent',
        daysAgo: 27,
        amount: '200000',
        fee: '1300',
        counterparty: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
    },
];

const buildTx = (
    account: (typeof demoAccounts)[number],
    spec: TxSpec,
    index: number,
): WalletAccountTransaction => {
    const nowSec = Math.floor(Date.now() / 1000);
    const blockTime = nowSec - spec.daysAgo * DAY;
    const blockHeight = 18_000_000 - spec.daysAgo * 100 - index;

    return {
        type: spec.type,
        txid: txid(),
        blockHeight,
        blockHash: `0x${randomHex(64)}`,
        blockTime,
        amount: spec.amount,
        fee: spec.fee,
        targets: [
            {
                addresses: [spec.counterparty],
                amount: spec.amount,
                isAddress: true,
                n: 0,
            },
        ],
        tokens: [],
        internalTransfers: [],
        details: {
            vin: [],
            vout: [],
            size: 0,
            totalInput: '0',
            totalOutput: '0',
        },
        descriptor: account.descriptor,
        deviceState: DEMO_DEVICE_STATE,
        symbol: account.symbol,
    } as WalletAccountTransaction;
};

const specsByNetwork = (account: (typeof demoAccounts)[number]): TxSpec[] => {
    if (account.networkType === 'bitcoin') return btcTxSpecs;
    if (account.networkType === 'solana') return solTxSpecs;

    return evmTxSpecs;
};

export const demoTransactions: Record<AccountKey, WalletAccountTransaction[]> = demoAccounts.reduce(
    (acc, account) => {
        acc[account.key] = specsByNetwork(account).map((spec, i) => buildTx(account, spec, i));

        return acc;
    },
    {} as Record<AccountKey, WalletAccountTransaction[]>,
);
