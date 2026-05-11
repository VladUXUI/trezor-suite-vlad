import { useMemo } from 'react';

import { Translation } from '@suite/intl';
import { TokenManagementAction, selectCoinDefinitions } from '@suite-common/token-definitions';
import { type Network, getNetwork } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account, type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { isErc4626, isTestnet } from '@suite-common/wallet-utils';
import { Column, Row, Text } from '@trezor/components';
import { NetworkIcon } from '@trezor/product-components';

import { useSelector } from 'src/hooks/suite';
import { useSelectedAddressView } from 'src/hooks/wallet/useSelectedAddressView';
import {
    enhanceTokensWithRates,
    getTokens,
    sortTokensWithRates,
} from 'src/utils/wallet/tokenUtils';

import { NoTokens } from '../common/NoTokens';
import { TokensTable } from '../common/TokensTable/TokensTable';

interface CoinsTableProps {
    selectedAccount: SelectedAccountLoaded;
    searchQuery: string;
}

/**
 * Renders one full Tokens-table for a single sub-account in the aggregated
 * view. Each section is preceded by a small chain header so the user can tell
 * which chain a block of tokens lives on, even when the per-row network badge
 * is also visible.
 *
 * We use the same `getTokens` / `enhanceTokensWithRates` machinery as the
 * single-account path — just per sub-account — so behavior (hidden tokens,
 * search filtering, ERC-4626 stripping, sorting) stays consistent. Returns
 * `null` when the chain has no shown tokens *and* the user isn't searching;
 * the parent can then suppress empty chains entirely.
 */
const PerChainTokensSection = ({
    account,
    network,
    searchQuery,
}: {
    account: Account;
    network: Network;
    searchQuery: string;
}) => {
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const enhancedTokens = useMemo(() => {
        const accountTokens = account.tokens?.filter(token => !isErc4626(token));
        const tokensWithRates = enhanceTokensWithRates(
            accountTokens,
            baseCurrencyCode,
            account.symbol,
            fiatRates,
        );

        return tokensWithRates.sort(sortTokensWithRates);
    }, [account.tokens, account.symbol, baseCurrencyCode, fiatRates]);

    const tokens = useMemo(
        () =>
            getTokens({
                tokens: enhancedTokens,
                symbol: account.symbol,
                tokenDefinitions: coinDefinitions,
                searchQuery,
            }),
        [enhancedTokens, account.symbol, coinDefinitions, searchQuery],
    );

    const hasContent = tokens.shownWithBalance.length > 0 || tokens.shownWithoutBalance.length > 0;
    if (!hasContent && !searchQuery) {
        return null;
    }

    return (
        <Column gap={8}>
            <Row gap={8} alignItems="center">
                <NetworkIcon networkSymbol={account.symbol} size={16} />
                <Text typographyStyle="body-md-strong">{network.name}</Text>
            </Row>
            <TokensTable
                account={account}
                hideRates={isTestnet(account.symbol)}
                tokenStatusType={TokenManagementAction.HIDE}
                tokensWithBalance={tokens.shownWithBalance}
                tokensWithoutBalance={tokens.shownWithoutBalance}
                network={network}
                searchQuery={searchQuery}
                showNetworkIcon
            />
        </Column>
    );
};

export const CoinsTable = ({ selectedAccount, searchQuery }: CoinsTableProps) => {
    const fiatRates = useSelector(selectCurrentFiatRates);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const addressView = useSelectedAddressView();

    const { account, network } = selectedAccount;

    const coinDefinitions = useSelector(state => selectCoinDefinitions(state, account.symbol));

    const enhancedTokens = useMemo(() => {
        const accountTokens = account.tokens?.filter(token => !isErc4626(token));

        const tokensWithRates = enhanceTokensWithRates(
            accountTokens,
            baseCurrencyCode,
            account.symbol,
            fiatRates,
        );

        return tokensWithRates.sort(sortTokensWithRates);
    }, [account.tokens, account.symbol, baseCurrencyCode, fiatRates]);

    const tokens = useMemo(
        () =>
            getTokens({
                tokens: enhancedTokens,
                symbol: account.symbol,
                tokenDefinitions: coinDefinitions,
                searchQuery,
            }),
        [enhancedTokens, account.symbol, coinDefinitions, searchQuery],
    );

    // Aggregated (multi-chain EVM) tokens view: stack a `TokensTable` per
    // sub-account with a small chain header and per-row network badges. We
    // render one section per chain rather than a single merged table because
    // `TokenRow` carries per-account invariants (the unused-receive-address
    // for trading buttons, the per-chain definition lookup) that don't unify
    // cleanly across chains. Stacked sections keep those invariants intact
    // while making the page chain-agnostic from the user's POV.
    if (addressView?.kind === 'aggregate') {
        const sections = addressView.accounts
            .map(siblingAccount => ({
                account: siblingAccount,
                network: getNetwork(siblingAccount.symbol),
            }))
            .filter(s => !!s.network) as { account: Account; network: Network }[];

        const anySectionHasTokens = sections.some(s => (s.account.tokens?.length ?? 0) > 0);

        if (!anySectionHasTokens && !searchQuery) {
            return (
                <NoTokens
                    title={
                        <Translation
                            id="TR_ADDRESS_BALANCE_ACROSS_CHAINS"
                            values={{ count: addressView.accounts.length }}
                        />
                    }
                />
            );
        }

        return (
            <Column gap={24}>
                {sections.map(({ account: siblingAccount, network: siblingNetwork }) => (
                    <PerChainTokensSection
                        key={siblingAccount.key}
                        account={siblingAccount}
                        network={siblingNetwork}
                        searchQuery={searchQuery}
                    />
                ))}
            </Column>
        );
    }

    const hiddenTokensCount =
        tokens.unverifiedWithBalance.length +
        tokens.hiddenWithBalance.length +
        tokens.unverifiedWithoutBalance.length +
        tokens.hiddenWithoutBalance.length;

    return tokens.shownWithBalance.length > 0 ||
        tokens.shownWithoutBalance.length > 0 ||
        searchQuery ? (
        <TokensTable
            account={account}
            hideRates={isTestnet(account.symbol)}
            tokenStatusType={TokenManagementAction.HIDE}
            tokensWithBalance={tokens.shownWithBalance}
            tokensWithoutBalance={tokens.shownWithoutBalance}
            network={network}
            searchQuery={searchQuery}
        />
    ) : (
        <NoTokens
            title={
                <Translation
                    id={hiddenTokensCount > 0 ? 'TR_TOKENS_EMPTY_CHECK_HIDDEN' : 'TR_TOKENS_EMPTY'}
                />
            }
        />
    );
};
