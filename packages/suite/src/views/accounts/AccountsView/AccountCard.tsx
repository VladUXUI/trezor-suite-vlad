import React from 'react';

import styled from 'styled-components';

import { useFormatters } from '@suite-common/formatters';
import { networks } from '@suite-common/wallet-config';
import {
    type AccountGroup,
    getGroupAccounts,
    getPrimaryAccount,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { type BaseCurrencyAmount, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { Card, Column, Icon, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders, spacingsPx, typography } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { useSelector } from 'src/hooks/suite';

import { TokenStrip } from './TokenStrip';

const NetworkChip = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 1px 6px;
    border-radius: ${borders.radii.xxs};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    ${typography['body-xs']}
    color: ${({ theme }) => theme.contentSecondary};
    white-space: nowrap;
    flex-shrink: 0;
`;

const TokensArea = styled.div`
    border-radius: ${borders.radii.xs};
    padding: ${spacingsPx.xs};
    margin: -${spacingsPx.xs};
    transition: background 0.15s;

    &:hover {
        background: ${({ theme }) => theme.legacyBackgroundNeutralSubtleOnElevation1};
    }
`;

type AccountCardProps = {
    group: AccountGroup;
};

export const AccountCard = ({ group }: AccountCardProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);

    const primaryAccount = getPrimaryAccount(group);
    const accounts = getGroupAccounts(group);

    const goToWithAnalytics = useGoToWithAnalytics(primaryAccount);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const isFailed = accounts.some(a => a.failed);

    const totalFiat = accounts.reduce<BaseCurrencyAmount | null>((sum, account) => {
        const fiat = getAccountFiatBalance({
            account,
            baseCurrencyCode,
            rates: currentFiatRates,
            shouldIncludeTokens: true,
            shouldIncludeStaking: true,
        });
        if (!fiat) return sum;

        return sum ? asBaseCurrencyAmount(sum.plus(fiat)) : fiat;
    }, null);

    const handleClick = () => {
        goToWithAnalytics({
            routeName: 'wallet-index',
            params: {
                symbol: primaryAccount.symbol,
                accountIndex: primaryAccount.index,
                accountType: primaryAccount.accountType,
            },
        });
    };

    const handleTokensClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        goToWithAnalytics({
            routeName: 'wallet-tokens',
            params: {
                symbol: primaryAccount.symbol,
                accountIndex: primaryAccount.index,
                accountType: primaryAccount.accountType,
            },
        });
    };

    const allTokens = accounts.flatMap(a =>
        (a.tokens ?? []).map(t => ({
            contract: t.contract,
            symbol: t.symbol,
            networkSymbol: a.symbol,
        })),
    );

    const truncatedAddress = `${primaryAccount.descriptor.slice(0, 4)}...${primaryAccount.descriptor.slice(-4)}`;

    const renderBalance = () => {
        if (isFailed && !totalFiat) {
            return <Icon name="warning" intent="warning" size={16} />;
        }

        if (!totalFiat) {
            return (
                <Text typographyStyle="headline-sm" intent="neutral" priority="secondary">
                    —
                </Text>
            );
        }

        return (
            <HiddenPlaceholder>
                <Text typographyStyle="headline-sm" intent="neutral">
                    <BaseCurrencyAmountFormatter
                        currency={baseCurrencyCode.toUpperCase()}
                        value={totalFiat}
                    />
                </Text>
            </HiddenPlaceholder>
        );
    };

    return (
        <Card
            paddingType="small"
            onClick={handleClick}
            data-testid={`@accounts-page/card/${primaryAccount.key}`}
        >
            <Column gap={16} height="100%">
                <Row justifyContent="space-between" alignItems="flex-start">
                    <Row gap={12} alignItems="center">
                        <CoinLogo size={40} symbol={primaryAccount.symbol} type="token" />
                        <Column gap={2} alignItems="flex-start">
                            <AccountLabel
                                account={primaryAccount}
                                showAccountTypeBadge={group.kind === 'single'}
                                accountTypeBadgeSize="small"
                                typographyStyle="body-md-strong"
                                rowProps={{ gap: 8 }}
                            />
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                {truncatedAddress}
                            </Text>
                        </Column>
                    </Row>
                    <Icon size={16} name="arrowRight" isDisabled />
                </Row>

                {group.kind === 'evm' && group.accounts.length > 1 && (
                    <Row gap={4} alignItems="center" flexWrap="wrap">
                        {group.accounts.map(a => (
                            <NetworkChip key={a.symbol}>
                                {networks[a.symbol]?.name ?? a.symbol}
                            </NetworkChip>
                        ))}
                    </Row>
                )}

                <Column gap={4} flex="1" justifyContent="flex-end">
                    {renderBalance()}
                    <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                        {primaryAccount.formattedBalance} {primaryAccount.symbol.toUpperCase()}
                    </Text>
                </Column>

                {allTokens.length > 0 && (
                    <TokensArea onClick={handleTokensClick}>
                        <TokenStrip allTokens={allTokens} />
                    </TokensArea>
                )}
            </Column>
        </Card>
    );
};
