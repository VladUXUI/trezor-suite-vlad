import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type Account,
    type AccountKey,
    asAccountDescriptor,
    createAccountKey,
} from '@suite-common/wallet-types';
import { type AccountAddresses } from '@trezor/connect';

import {
    DEMO_BTC_DESCRIPTOR,
    DEMO_DEVICE_STATE,
    DEMO_EVM_DESCRIPTOR_1,
    DEMO_EVM_DESCRIPTOR_2,
    DEMO_EVM_DESCRIPTOR_3,
    DEMO_SOL_DESCRIPTOR,
} from './demoConstants';

// Token contracts — real mainnet addresses so logos resolve from the
// token-icons package, balances are fake.
export const USDC_CONTRACTS: Partial<Record<NetworkSymbol, string>> = {
    eth: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    op: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    arb: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    base: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    pol: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
};

export const USDT_CONTRACTS: Partial<Record<NetworkSymbol, string>> = {
    eth: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    pol: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
};

export const ARB_CONTRACT_ON_ARB = '0x912CE59144191C1204E64559FE8253a0e49E6548';
export const OP_CONTRACT_ON_OP = '0x4200000000000000000000000000000000000042';

// Solana USDC mint
export const USDC_SOLANA_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';

type Token = {
    contract: string;
    symbol: string;
    name: string;
    decimals: number;
    // MAJOR units (e.g. "250" for 250 USDC), not raw smallest units. The normal
    // codepath in `accountsActions.createAccount` runs `enhanceTokens` which
    // converts subunits→major; our seed bypasses that, so we store major up front.
    balance: string;
};

const buildEvmAccount = ({
    descriptor: descriptorString,
    index,
    symbol,
    formattedBalance,
    balanceWei,
    tokens,
}: {
    descriptor: string;
    index: number;
    symbol: NetworkSymbol;
    formattedBalance: string;
    balanceWei: string;
    tokens: Token[];
}): Account => {
    const descriptor = asAccountDescriptor(descriptorString);
    const key: AccountKey = createAccountKey({
        accountDescriptor: descriptor,
        networkSymbol: symbol,
        deviceStaticSessionId: DEMO_DEVICE_STATE,
    });

    return {
        deviceState: DEMO_DEVICE_STATE,
        key,
        index,
        path: `m/44'/60'/${index}'/0/0`,
        descriptor,
        accountType: 'normal',
        symbol,
        networkType: 'ethereum',
        empty: false,
        visible: true,
        balance: balanceWei,
        availableBalance: balanceWei,
        formattedBalance,
        tokens: tokens.map(t => ({
            standard: 'ERC20',
            contract: t.contract,
            name: t.name,
            symbol: t.symbol,
            decimals: t.decimals,
            balance: t.balance,
        })),
        utxo: undefined,
        history: { total: 4, unconfirmed: 0, tokens: tokens.length },
        metadata: { key: descriptor as unknown as string },
        ts: Date.now(),
        misc: { nonce: '0' },
        marker: undefined,
        stellarCursor: undefined,
        page: undefined,
    } as Account;
};

const buildBtcAccount = (): Account => {
    const descriptor = asAccountDescriptor(DEMO_BTC_DESCRIPTOR);
    const key: AccountKey = createAccountKey({
        accountDescriptor: descriptor,
        networkSymbol: 'btc',
        deviceStaticSessionId: DEMO_DEVICE_STATE,
    });
    const addresses: AccountAddresses = {
        used: [],
        unused: [
            {
                address: DEMO_BTC_DESCRIPTOR,
                path: "m/84'/0'/0'/0/0",
                transfers: 0,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
        change: [
            {
                address: 'bc1qchangeaddrxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
                path: "m/84'/0'/0'/1/0",
                transfers: 0,
                balance: '0',
                sent: '0',
                received: '0',
            },
        ],
    };

    return {
        deviceState: DEMO_DEVICE_STATE,
        key,
        index: 0,
        path: "m/84'/0'/0'",
        descriptor,
        accountType: 'normal',
        symbol: 'btc',
        networkType: 'bitcoin',
        empty: false,
        visible: true,
        balance: '1200000',
        availableBalance: '1200000',
        formattedBalance: '0.012',
        tokens: undefined,
        addresses,
        utxo: [],
        history: { total: 5, unconfirmed: 0 },
        metadata: { key: descriptor as unknown as string },
        ts: Date.now(),
        misc: undefined,
        marker: undefined,
        stellarCursor: undefined,
        page: undefined,
    } as Account;
};

const buildSolAccount = (): Account => {
    const descriptor = asAccountDescriptor(DEMO_SOL_DESCRIPTOR);
    const key: AccountKey = createAccountKey({
        accountDescriptor: descriptor,
        networkSymbol: 'sol',
        deviceStaticSessionId: DEMO_DEVICE_STATE,
    });

    return {
        deviceState: DEMO_DEVICE_STATE,
        key,
        index: 0,
        path: "m/44'/501'/0'/0'",
        descriptor,
        accountType: 'normal',
        symbol: 'sol',
        networkType: 'solana',
        empty: false,
        visible: true,
        balance: '5000000000', // 5 SOL in lamports
        availableBalance: '5000000000',
        formattedBalance: '5',
        tokens: [
            {
                standard: 'SPL',
                contract: USDC_SOLANA_MINT,
                name: 'USD Coin',
                symbol: 'USDC',
                decimals: 6,
                balance: '200',
            },
        ],
        utxo: undefined,
        history: { total: 4, unconfirmed: 0, tokens: 1 },
        metadata: { key: descriptor as unknown as string },
        ts: Date.now(),
        misc: undefined,
        marker: undefined,
        stellarCursor: undefined,
        page: undefined,
    } as Account;
};

// Account #1 — the "main" EVM wallet. Five chains, ~$3.6k total.
const evmAccount1: Account[] = [
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_1,
        index: 0,
        symbol: 'eth',
        formattedBalance: '0.35',
        balanceWei: '350000000000000000',
        tokens: [
            {
                contract: USDC_CONTRACTS.eth!,
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                balance: '250',
            },
            {
                contract: USDT_CONTRACTS.eth!,
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 6,
                balance: '100',
            },
        ],
    }),
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_1,
        index: 0,
        symbol: 'op',
        formattedBalance: '0.05',
        balanceWei: '50000000000000000',
        tokens: [
            {
                contract: USDC_CONTRACTS.op!,
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                balance: '80',
            },
            {
                contract: OP_CONTRACT_ON_OP,
                symbol: 'OP',
                name: 'Optimism',
                decimals: 18,
                balance: '65',
            },
        ],
    }),
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_1,
        index: 0,
        symbol: 'arb',
        formattedBalance: '0.08',
        balanceWei: '80000000000000000',
        tokens: [
            {
                contract: USDC_CONTRACTS.arb!,
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                balance: '150',
            },
            {
                contract: ARB_CONTRACT_ON_ARB,
                symbol: 'ARB',
                name: 'Arbitrum',
                decimals: 18,
                balance: '100',
            },
        ],
    }),
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_1,
        index: 0,
        symbol: 'base',
        formattedBalance: '0.10',
        balanceWei: '100000000000000000',
        tokens: [
            {
                contract: USDC_CONTRACTS.base!,
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                balance: '200',
            },
        ],
    }),
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_1,
        index: 0,
        symbol: 'pol',
        formattedBalance: '80',
        balanceWei: '80000000000000000000',
        tokens: [
            {
                contract: USDC_CONTRACTS.pol!,
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                balance: '50',
            },
            {
                contract: USDT_CONTRACTS.pol!,
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 6,
                balance: '30',
            },
        ],
    }),
];

// Account #2 — "DeFi side wallet". Three chains, smaller balances, ~$1.1k.
const evmAccount2: Account[] = [
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_2,
        index: 1,
        symbol: 'eth',
        formattedBalance: '0.02',
        balanceWei: '20000000000000000',
        tokens: [
            {
                contract: USDC_CONTRACTS.eth!,
                symbol: 'USDC',
                name: 'USD Coin',
                decimals: 6,
                balance: '500',
            },
        ],
    }),
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_2,
        index: 1,
        symbol: 'arb',
        formattedBalance: '0.04',
        balanceWei: '40000000000000000',
        tokens: [
            {
                contract: ARB_CONTRACT_ON_ARB,
                symbol: 'ARB',
                name: 'Arbitrum',
                decimals: 18,
                balance: '250',
            },
        ],
    }),
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_2,
        index: 1,
        symbol: 'base',
        formattedBalance: '0.03',
        balanceWei: '30000000000000000',
        tokens: [],
    }),
];

// Account #3 — "savings". Two chains, low balances, ~$300.
const evmAccount3: Account[] = [
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_3,
        index: 2,
        symbol: 'eth',
        formattedBalance: '0.01',
        balanceWei: '10000000000000000',
        tokens: [],
    }),
    buildEvmAccount({
        descriptor: DEMO_EVM_DESCRIPTOR_3,
        index: 2,
        symbol: 'pol',
        formattedBalance: '200',
        balanceWei: '200000000000000000000',
        tokens: [
            {
                contract: USDT_CONTRACTS.pol!,
                symbol: 'USDT',
                name: 'Tether USD',
                decimals: 6,
                balance: '100',
            },
        ],
    }),
];

export const demoAccounts: Account[] = [
    ...evmAccount1,
    ...evmAccount2,
    ...evmAccount3,
    buildBtcAccount(),
    buildSolAccount(),
];
