import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    type CryptoBaseCurrencyPair,
    type Rate,
    type RatesByKey,
    type TokenAddress,
    asCryptoBaseCurrencyCode,
    asTimestamp,
} from '@suite-common/wallet-types';
import { getFiatRateKey } from '@suite-common/wallet-utils';

import {
    ARB_CONTRACT_ON_ARB,
    OP_CONTRACT_ON_OP,
    USDC_CONTRACTS,
    USDC_SOLANA_MINT,
    USDT_CONTRACTS,
} from './demoAccounts';

const NOW = asTimestamp(Date.now());
const WEEK_AGO = asTimestamp(Date.now() - 7 * 24 * 60 * 60 * 1000);

const buildRate = (
    symbol: NetworkSymbol,
    rate: number,
    tokenAddress?: string,
    timestamp: ReturnType<typeof asTimestamp> = NOW,
): Rate => ({
    rate,
    lastTickerTimestamp: timestamp,
    lastSuccessfulFetchTimestamp: timestamp,
    isLoading: false,
    error: null,
    ticker: {
        symbol,
        tokenAddress: tokenAddress ? (tokenAddress as TokenAddress) : undefined,
    },
});

const key = (symbol: NetworkSymbol, tokenAddress?: string): CryptoBaseCurrencyPair =>
    getFiatRateKey(symbol, 'usd', tokenAddress as TokenAddress | undefined);

const buildRates = (timestamp: ReturnType<typeof asTimestamp>): RatesByKey => {
    const rates: Partial<Record<CryptoBaseCurrencyPair, Rate>> = {};

    // Native coin rates
    rates[key('eth')] = buildRate('eth', 4000, undefined, timestamp);
    rates[key('op')] = buildRate('op', 4000, undefined, timestamp); // OP chain uses ETH as native
    rates[key('arb')] = buildRate('arb', 4000, undefined, timestamp);
    rates[key('base')] = buildRate('base', 4000, undefined, timestamp);
    rates[key('pol')] = buildRate('pol', 0.75, undefined, timestamp);
    rates[key('btc')] = buildRate('btc', 85000, undefined, timestamp);
    rates[key('sol')] = buildRate('sol', 210, undefined, timestamp);

    // Token rates — same dollar value across chains, keyed by (chain, contract).
    const stable = (symbol: NetworkSymbol, contract: string) => {
        rates[key(symbol, contract)] = buildRate(symbol, 1.0, contract, timestamp);
    };

    if (USDC_CONTRACTS.eth) stable('eth', USDC_CONTRACTS.eth);
    if (USDC_CONTRACTS.op) stable('op', USDC_CONTRACTS.op);
    if (USDC_CONTRACTS.arb) stable('arb', USDC_CONTRACTS.arb);
    if (USDC_CONTRACTS.base) stable('base', USDC_CONTRACTS.base);
    if (USDC_CONTRACTS.pol) stable('pol', USDC_CONTRACTS.pol);
    if (USDT_CONTRACTS.eth) stable('eth', USDT_CONTRACTS.eth);
    if (USDT_CONTRACTS.pol) stable('pol', USDT_CONTRACTS.pol);

    rates[key('arb', ARB_CONTRACT_ON_ARB)] = buildRate('arb', 1.1, ARB_CONTRACT_ON_ARB, timestamp);
    rates[key('op', OP_CONTRACT_ON_OP)] = buildRate('op', 2.15, OP_CONTRACT_ON_OP, timestamp);

    // USDC on Solana
    rates[key('sol', USDC_SOLANA_MINT)] = buildRate('sol', 1.0, USDC_SOLANA_MINT, timestamp);

    return rates as RatesByKey;
};

export const demoFiatCurrent: RatesByKey = buildRates(NOW);
export const demoFiatLastWeek: RatesByKey = buildRates(WEEK_AGO);

// Silence unused-import linting when only the value is used.
void asCryptoBaseCurrencyCode;
