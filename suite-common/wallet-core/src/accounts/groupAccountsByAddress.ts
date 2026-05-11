import { type AccountType, getNetworkType } from '@suite-common/wallet-config';
import { type Account, type RatesByKey } from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';

/**
 * A logical "address" the user sees on the Accounts page.
 *
 * - `evm`: one or more EVM sub-accounts that share a 0x descriptor on the same
 *   device (e.g. the same address on Ethereum + Arbitrum + Optimism).
 * - `single`: any non-EVM account, or an EVM account that happens to live on
 *   exactly one chain. Behaves the same as today's per-account model.
 */
export type AccountGroup =
    | { kind: 'evm'; descriptor: string; accounts: Account[] }
    | { kind: 'single'; account: Account };

const OTHER_BTC_ACCOUNT_TYPES = new Set<AccountType>(['taproot', 'legacy', 'segwit']);

/**
 * Bitcoin account types that are kept out of the main address list and tucked
 * under "Other accounts": Taproot (BIP86), Legacy (BIP44), Legacy SegWit
 * (BIP49). The default `normal` (BIP84 native SegWit) stays visible.
 */
export const isOtherBitcoinAccount = (account: Account): boolean =>
    account.symbol === 'btc' && OTHER_BTC_ACCOUNT_TYPES.has(account.accountType);

/**
 * Group a sorted list of accounts so EVM sub-accounts sharing the same
 * descriptor collapse into a single entry. Order of the output matches the
 * first-seen order of the input — feed it a `sortByCoin`-sorted list and EVM
 * groups land where their primary chain (usually mainnet) sat in the original.
 */
export const groupAccountsByAddress = (accounts: readonly Account[]): AccountGroup[] => {
    const evmByDescriptor = new Map<string, Account[]>();
    const result: AccountGroup[] = [];

    for (const account of accounts) {
        const isEvm = getNetworkType(account.symbol) === 'ethereum';
        if (isEvm) {
            const bucket = evmByDescriptor.get(account.descriptor);
            if (bucket) {
                bucket.push(account);
            } else {
                const fresh = [account];
                evmByDescriptor.set(account.descriptor, fresh);
                // Reserve the slot at first sight so EVM groups keep their
                // first-seen order alongside non-EVM accounts.
                result.push({ kind: 'evm', descriptor: account.descriptor, accounts: fresh });
            }
        } else {
            result.push({ kind: 'single', account });
        }
    }

    return result;
};

/**
 * Stable React key for a group. EVM groups use descriptor + deviceState so the
 * same address from two different devices doesn't collide.
 */
export const getAccountGroupKey = (group: AccountGroup): string =>
    group.kind === 'evm'
        ? `evm:${group.descriptor}:${group.accounts[0]?.deviceState ?? ''}`
        : group.account.key;

/**
 * Pick the "primary" account in a group — used to drive the row's display name,
 * route params on click, and any other fallback that needs a single account.
 * For EVM groups, this is the first sub-account in the group, which after
 * `sortByCoin` will typically be the canonical chain (e.g. Ethereum mainnet).
 */
export const getPrimaryAccount = (group: AccountGroup): Account =>
    group.kind === 'single' ? group.account : group.accounts[0];

/**
 * All accounts that belong to a group. For singles, this is a one-element list.
 */
export const getGroupAccounts = (group: AccountGroup): Account[] =>
    group.kind === 'single' ? [group.account] : group.accounts;

const isEmptyAccount = (
    account: Account,
    baseCurrencyCode: Parameters<typeof getAccountFiatBalance>[0]['baseCurrencyCode'],
    rates: RatesByKey | undefined,
): boolean => {
    if ((account.tokens?.length ?? 0) > 0) {
        return false;
    }

    const fiat = getAccountFiatBalance({
        account,
        baseCurrencyCode,
        rates,
        shouldIncludeTokens: true,
        shouldIncludeStaking: true,
    });

    return !fiat || fiat.isZero();
};

/**
 * A group is empty when every sub-account holds no tokens and has a fiat
 * balance of either `null` (no rate) or zero. Empty groups (and "Other"
 * Bitcoin types) are tucked under the collapsible section on the Accounts
 * page and hidden from the address-switcher dropdown.
 */
export const isEmptyGroup = (
    group: AccountGroup,
    baseCurrencyCode: Parameters<typeof getAccountFiatBalance>[0]['baseCurrencyCode'],
    rates: RatesByKey | undefined,
): boolean =>
    getGroupAccounts(group).every(account => isEmptyAccount(account, baseCurrencyCode, rates));

/**
 * Predicate: does this group belong in the "Other accounts" bucket (hidden by
 * default)? True for non-default Bitcoin account types and for empty groups.
 */
export const isOtherAccountGroup = (
    group: AccountGroup,
    baseCurrencyCode: Parameters<typeof getAccountFiatBalance>[0]['baseCurrencyCode'],
    rates: RatesByKey | undefined,
): boolean =>
    (group.kind === 'single' && isOtherBitcoinAccount(group.account)) ||
    isEmptyGroup(group, baseCurrencyCode, rates);
