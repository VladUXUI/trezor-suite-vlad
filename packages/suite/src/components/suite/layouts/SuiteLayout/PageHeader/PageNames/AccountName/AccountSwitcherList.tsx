import { useMemo } from 'react';

import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import {
    type AccountGroup,
    getAccountGroupKey,
    getPrimaryAccount,
    groupAccountsByAddress,
    isOtherAccountGroup,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { Box, GhostContainer, Icon, Row, Text } from '@trezor/components';
import { CoinLogo, NetworkIcon } from '@trezor/product-components';
import { spacingsPx } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { useSelector } from 'src/hooks/suite';

const ListContainer = styled.div`
    width: 360px;
    max-height: 480px;
    overflow-y: auto;
    padding: ${spacingsPx.xs};
    background: ${({ theme }) => theme.surfaceFillModeless};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    border-radius: 12px;
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
`;

type AccountSwitcherListProps = {
    accounts: Account[];
    selectedAccountKey: string;
    onSelected: () => void;
};

const groupContainsAccountKey = (group: AccountGroup, accountKey: string): boolean =>
    group.kind === 'single'
        ? group.account.key === accountKey
        : group.accounts.some(a => a.key === accountKey);

const AccountSwitcherItem = ({
    group,
    isSelected,
    onSelected,
}: {
    group: AccountGroup;
    isSelected: boolean;
    onSelected: () => void;
}) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const primaryAccount = getPrimaryAccount(group);
    const goToWithAnalytics = useGoToWithAnalytics(primaryAccount);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const accounts = group.kind === 'single' ? [group.account] : group.accounts;

    // Sum fiat balance across the group so multi-chain addresses show their
    // aggregated total (matches the Accounts page row behavior).
    const totalFiat = accounts.reduce<ReturnType<typeof getAccountFiatBalance>>((sum, account) => {
        const fiat = getAccountFiatBalance({
            account,
            baseCurrencyCode,
            rates: currentFiatRates,
            shouldIncludeTokens: true,
            shouldIncludeStaking: true,
        });
        if (!fiat) return sum;

        return sum ? (sum.plus(fiat) as typeof sum) : fiat;
    }, null);

    const handleClick = () => {
        if (!isSelected) {
            goToWithAnalytics({
                routeName: 'wallet-index',
                params: {
                    symbol: primaryAccount.symbol,
                    accountIndex: primaryAccount.index,
                    accountType: primaryAccount.accountType,
                },
            });
        }
        onSelected();
    };

    return (
        <GhostContainer
            onClick={handleClick}
            isActive={isSelected}
            tabIndex={0}
            padding={{ vertical: 8, horizontal: 12 }}
        >
            <Row gap={12} alignItems="center">
                <CoinLogo size={28} symbol={primaryAccount.symbol} type="token" />
                <Box flex="1" overflow="hidden">
                    <Row gap={6} alignItems="center" overflow="hidden">
                        <AccountLabel
                            account={primaryAccount}
                            showAccountTypeBadge={group.kind === 'single'}
                            accountTypeBadgeSize="small"
                            typographyStyle="body-md-strong"
                        />
                        {group.kind === 'evm' && group.accounts.length > 1 && (
                            <Row gap={2} alignItems="center">
                                {group.accounts.map(a => (
                                    <NetworkIcon
                                        key={a.symbol}
                                        networkSymbol={a.symbol}
                                        size={12}
                                    />
                                ))}
                            </Row>
                        )}
                    </Row>
                </Box>
                {totalFiat ? (
                    <HiddenPlaceholder>
                        <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                            <BaseCurrencyAmountFormatter
                                currency={baseCurrencyCode.toUpperCase()}
                                value={totalFiat}
                            />
                        </Text>
                    </HiddenPlaceholder>
                ) : null}
                {isSelected && <Icon name="check" intent="brand" size={16} />}
            </Row>
        </GhostContainer>
    );
};

export const AccountSwitcherList = ({
    accounts,
    selectedAccountKey,
    onSelected,
}: AccountSwitcherListProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);

    // Group EVM sub-accounts by address (mirrors the Accounts page) and hide
    // "Other" groups (BTC taproot/legacy/Legacy SegWit + empty $0 groups) —
    // those are only reachable from the Accounts page itself. The one
    // exception: if the user is currently *viewing* a hidden account, keep its
    // group in the list so the highlighted row matches what's on screen.
    const visibleGroups = useMemo(() => {
        const grouped = groupAccountsByAddress(accounts);

        return grouped.filter(group => {
            if (!isOtherAccountGroup(group, baseCurrencyCode, currentFiatRates)) {
                return true;
            }

            // Exception for the currently-active hidden account.
            return groupContainsAccountKey(group, selectedAccountKey);
        });
    }, [accounts, baseCurrencyCode, currentFiatRates, selectedAccountKey]);

    return (
        <ListContainer data-testid="@wallet/account/switcher-list">
            {visibleGroups.map(group => (
                <AccountSwitcherItem
                    key={getAccountGroupKey(group)}
                    group={group}
                    isSelected={groupContainsAccountKey(group, selectedAccountKey)}
                    onSelected={onSelected}
                />
            ))}
        </ListContainer>
    );
};
