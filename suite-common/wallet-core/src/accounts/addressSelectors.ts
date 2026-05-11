import { A, pipe } from '@mobily/ts-belt';

import { type DeviceRootState } from '@suite-common/device';
import { createWeakMapSelector, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { getNetworkType } from '@suite-common/wallet-config';
import {
    type Account,
    type BaseCurrencyAmount,
    type WalletAccountTransaction,
    asBaseCurrencyAmount,
} from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type StaticSessionId } from '@trezor/connect';

import { type AccountsRootState } from './accountsReducer';
import { selectDeviceAccounts } from './accountsSelectors';
import { selectCurrentFiatRates } from '../fiat-rates/fiatRatesSelectors';
import { type FiatRatesRootState } from '../fiat-rates/fiatRatesTypes';
import { type TransactionsRootState } from '../transactions/transactionsReducerTypes';
import { selectAccountTransactions } from '../transactions/transactionsSelectors';

type AddressSelectorState = AccountsRootState &
    DeviceRootState &
    TransactionsRootState &
    FiatRatesRootState;

const createMemoizedSelector = createWeakMapSelector.withTypes<AddressSelectorState>();

/**
 * All EVM accounts on the selected device that share a 0x descriptor — i.e. the
 * same address on Ethereum + Arbitrum + Optimism + ... The result keeps the
 * order produced by `selectDeviceAccounts`, so the first element is the
 * "primary" sub-account (typically Ethereum mainnet after `sortByCoin`).
 *
 * Returns an empty array if the descriptor doesn't match any EVM account on
 * the device (e.g. for non-EVM addresses or unknown descriptors).
 */
export const selectSiblingEvmAccounts = createMemoizedSelector(
    [
        selectDeviceAccounts,
        (_state, descriptor: string) => descriptor,
        (_state, _descriptor: string, deviceState: StaticSessionId | undefined) => deviceState,
    ],
    (accounts, descriptor, deviceState) => {
        if (!deviceState) return returnStableArrayIfEmpty<Account>([]);

        return pipe(
            accounts,
            A.filter(
                account =>
                    account.descriptor === descriptor &&
                    account.deviceState === deviceState &&
                    getNetworkType(account.symbol) === 'ethereum',
            ),
            returnStableArrayIfEmpty,
        );
    },
);

/**
 * A token entry in the merged address-level token list. The `sourceAccount`
 * field tells the UI which chain the token lives on so it can render a
 * `NetworkIcon` badge next to the token logo.
 */
export type AddressToken = {
    sourceAccount: Account;
    contract: string;
    symbol?: string;
    name?: string;
    decimals: number;
    balance?: string;
};

/**
 * Flatten all tokens across an address's sibling EVM sub-accounts into a single
 * list, each entry tagged with the sub-account it came from. Sort: largest
 * balances first (by raw balance string parsed as a number — fiat sort would
 * require rates which we keep out of this selector for simplicity), then by
 * symbol alphabetically.
 *
 * Note: tokens are NOT deduplicated across chains (USDC-on-Ethereum and
 * USDC-on-Arbitrum stay as separate rows — they're separate balances).
 */
export const selectAddressTokens = createMemoizedSelector(
    [selectSiblingEvmAccounts],
    (accounts): AddressToken[] => {
        const merged: AddressToken[] = [];

        for (const account of accounts) {
            for (const token of account.tokens ?? []) {
                merged.push({
                    sourceAccount: account,
                    contract: token.contract,
                    symbol: token.symbol,
                    name: token.name,
                    decimals: token.decimals,
                    balance: token.balance,
                });
            }
        }

        return merged.sort((a, b) => {
            const aBal = Number(a.balance ?? '0');
            const bBal = Number(b.balance ?? '0');
            if (aBal !== bBal) return bBal - aBal;

            return (a.symbol ?? '').localeCompare(b.symbol ?? '');
        });
    },
);

/**
 * A transaction in the merged address-level transaction list. Each entry is
 * tagged with the source account (and therefore source chain) so the UI can
 * render a chain badge per row.
 */
export type AddressTransaction = WalletAccountTransaction & {
    sourceAccount: Account;
};

const EMPTY_STABLE_TRANSACTIONS: AddressTransaction[] = [];

/**
 * Merge transactions across an address's sibling EVM sub-accounts, sorted by
 * `blockTime` descending (newest first). Transactions still pending (no
 * blockTime) are floated to the top, preserving their per-account order.
 *
 * The selector is keyed on the merged accounts list (memoized) so it only
 * recomputes when sibling accounts change.
 */
export const selectAddressTransactions = (
    state: AddressSelectorState,
    descriptor: string,
    deviceState: StaticSessionId | undefined,
): AddressTransaction[] => {
    const accounts = selectSiblingEvmAccounts(state, descriptor, deviceState);
    if (accounts.length === 0) return EMPTY_STABLE_TRANSACTIONS;

    const merged: AddressTransaction[] = [];

    for (const account of accounts) {
        const txs = selectAccountTransactions(state, account.key);
        for (const tx of txs) {
            merged.push({ ...tx, sourceAccount: account });
        }
    }

    return merged.sort((a, b) => {
        // Pending transactions (no blockTime) bubble to the top.
        const aTime = a.blockTime ?? Number.POSITIVE_INFINITY;
        const bTime = b.blockTime ?? Number.POSITIVE_INFINITY;

        return bTime - aTime;
    });
};

/**
 * Sum of fiat balances across all sibling EVM sub-accounts. Returns null if
 * none of the sub-accounts has a fiat rate (matches the per-account fallback
 * — the UI shows `—` in that case).
 */
export const selectAddressFiatTotal = (
    state: AddressSelectorState,
    descriptor: string,
    deviceState: StaticSessionId | undefined,
    baseCurrencyCode: BaseCurrencyCode,
): BaseCurrencyAmount | null => {
    const accounts = selectSiblingEvmAccounts(state, descriptor, deviceState);
    const rates = selectCurrentFiatRates(state);

    let total: BaseCurrencyAmount | null = null;

    for (const account of accounts) {
        const fiat = getAccountFiatBalance({
            account,
            baseCurrencyCode,
            rates,
            shouldIncludeTokens: true,
            shouldIncludeStaking: true,
        });
        if (!fiat) continue;
        total = total ? asBaseCurrencyAmount(total.plus(fiat)) : fiat;
    }

    return total;
};

/**
 * Pick the sub-account with the highest fiat balance — the default selection
 * for the chain-picker popover on Send / Receive / Trade actions. Falls back
 * to the first sub-account (the "primary") if no rates are available or all
 * balances are zero.
 */
export const selectHighestBalanceSiblingAccount = (
    state: AddressSelectorState,
    descriptor: string,
    deviceState: StaticSessionId | undefined,
    baseCurrencyCode: BaseCurrencyCode,
): Account | undefined => {
    const accounts = selectSiblingEvmAccounts(state, descriptor, deviceState);
    if (accounts.length === 0) return undefined;
    if (accounts.length === 1) return accounts[0];

    const rates = selectCurrentFiatRates(state);
    let best: Account | undefined;
    let bestFiat: BaseCurrencyAmount | null = null;

    for (const account of accounts) {
        const fiat = getAccountFiatBalance({
            account,
            baseCurrencyCode,
            rates,
            shouldIncludeTokens: true,
            shouldIncludeStaking: true,
        });
        if (!fiat) continue;
        if (!bestFiat || fiat.gt(bestFiat)) {
            best = account;
            bestFiat = fiat;
        }
    }

    return best ?? accounts[0];
};
