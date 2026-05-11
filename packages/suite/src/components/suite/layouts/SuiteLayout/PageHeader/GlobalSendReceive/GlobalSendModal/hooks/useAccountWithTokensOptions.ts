import { useMemo } from 'react';
import { useThrottle } from 'react-use';

import { selectAccountsWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { type AccountWithSuiteSyncLabel } from '@suite-common/suite-sync';
import { selectTokenDefinitions } from '@suite-common/token-definitions';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import {
    getPrimaryAccount,
    groupAccountsByAddress,
    selectBaseCurrency,
    selectCurrentFiatRates,
    selectVisibleDeviceAccounts,
} from '@suite-common/wallet-core';
import { type Account, type AccountKey } from '@suite-common/wallet-types';
import {
    accountsFiatBalanceInDescOrderComparator,
    filterAccountsByNetworkSymbol,
} from '@suite-common/wallet-utils';
import { type StaticSessionId } from '@trezor/connect';
import { useCurrentRef } from '@trezor/react-utils';

import { type AccountWithTokensOption } from 'src/components/suite/asset-picker/types';
import {
    createAccountOption,
    createHiddenTokensOption,
    createTokenOption,
} from 'src/components/suite/asset-picker/utils';
import { useSelector } from 'src/hooks/suite';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

export interface UseAccountWithTokensOptionsProps {
    networkSymbolFilter: NetworkSymbol | undefined;
    staticSessionId: StaticSessionId | null;

    /**
     * Each account might have expandable hidden token group.
     */
    expandedHiddenTokensGroups: AccountKey[];
}

export function useAccountWithTokensOptions({
    networkSymbolFilter,
    expandedHiddenTokensGroups,
    staticSessionId,
}: UseAccountWithTokensOptionsProps): AccountWithTokensOption[] {
    const baseAccounts = useSelector(selectVisibleDeviceAccounts);

    const accounts = useSelector(state =>
        selectAccountsWithSuiteSyncLabel(state, baseAccounts, staticSessionId),
    );

    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const tokenDefinitions = useSelector(selectTokenDefinitions);

    // Accounts are constantly being updated in Redux. So throttle them to significantly reduce re-renders
    const throttledAccounts = useThrottle(accounts, 1000);
    const fiatRatesRef = useCurrentRef(fiatRates);

    const accountsAndTokensSortedByFiatBalance = useMemo(() => {
        const fiatRates = fiatRatesRef.current;

        if (!fiatRates) {
            return [];
        }

        const networkAccounts = filterAccountsByNetworkSymbol(
            throttledAccounts,
            networkSymbolFilter,
        );

        const sortedAccounts = networkAccounts.toSorted(
            function sortByFiatBalanceInDescOrder(accountA, accountB) {
                return accountsFiatBalanceInDescOrderComparator({
                    accountA,
                    accountB,
                    baseCurrencyCode,
                    fiatRates,
                });
            },
        );

        const getTokensForAccount = (account: Account) => {
            const { shownWithBalance, hiddenWithBalance } = getTokens({
                tokens: account.tokens ?? [],
                symbol: account.symbol,
                tokenDefinitions: tokenDefinitions?.[account.symbol]?.coin,
            });

            return {
                tokens: enhanceTokensWithRates(
                    shownWithBalance,
                    baseCurrencyCode,
                    account.symbol,
                    fiatRates,
                ).sort(sortTokensWithRates),
                hiddenTokens: enhanceTokensWithRates(
                    hiddenWithBalance,
                    baseCurrencyCode,
                    account.symbol,
                    fiatRates,
                ).sort(sortTokensWithRates),
            };
        };

        // groupAccountsByAddress narrows to Account; cast back since input was AccountWithSuiteSyncLabel[].
        return groupAccountsByAddress(sortedAccounts).map(group => {
            if (group.kind === 'single') {
                const account = group.account as AccountWithSuiteSyncLabel;
                const { tokens, hiddenTokens } = getTokensForAccount(account);

                return { account, siblingAccounts: undefined, tokens, hiddenTokens };
            }

            // EVM group: primary account is the highest-balance sibling (first after fiat-desc sort).
            const siblings = group.accounts as AccountWithSuiteSyncLabel[];
            const primary = getPrimaryAccount(group) as AccountWithSuiteSyncLabel;
            const allTokens = siblings.flatMap(a => getTokensForAccount(a).tokens);
            const allHiddenTokens = siblings.flatMap(a => getTokensForAccount(a).hiddenTokens);

            return {
                account: primary,
                siblingAccounts: siblings,
                tokens: allTokens.sort(sortTokensWithRates),
                hiddenTokens: allHiddenTokens.sort(sortTokensWithRates),
            };
        });
    }, [fiatRatesRef, throttledAccounts, networkSymbolFilter, baseCurrencyCode, tokenDefinitions]);

    return useMemo(() => {
        const accountsWithTokens: AccountWithTokensOption[] = [];

        for (const {
            account,
            siblingAccounts,
            tokens,
            hiddenTokens,
        } of accountsAndTokensSortedByFiatBalance) {
            accountsWithTokens.push(createAccountOption(account, siblingAccounts));

            tokens.forEach(token => {
                accountsWithTokens.push(createTokenOption(account, token));
            });

            if (hiddenTokens.length > 0) {
                accountsWithTokens.push(
                    createHiddenTokensOption({ account, hiddenTokens, expandedHiddenTokensGroups }),
                );
            }
        }

        return accountsWithTokens;
    }, [accountsAndTokensSortedByFiatBalance, expandedHiddenTokensGroups]);
}
