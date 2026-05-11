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
import { Column, GhostContainer, Icon, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { borders, typography } from '@trezor/theme';

import { AccountLabel } from 'src/components/suite';
import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useGoToWithAnalytics } from 'src/components/suite/layouts/SuiteLayout/PageHeader/useGoToWithAnalytics';
import { useSelector } from 'src/hooks/suite';

import { TokenStrip } from './TokenStrip';

const NameCell = styled.div`
    flex: 1 1 auto;
    min-width: 0;
`;

const TokensCell = styled.div`
    flex: 0 0 auto;
    min-width: 96px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    border-radius: ${borders.radii.xs};
    padding: 4px;
    margin: -4px;
    transition: background 0.15s;

    &:hover {
        background: ${({ theme }) => theme.legacyBackgroundNeutralSubtleOnElevation1};
        outline: 1.5px solid ${({ theme }) => theme.borderNeutral};
    }
`;

const FiatCell = styled.div`
    flex: 0 0 auto;
    min-width: 120px;
    text-align: right;
`;

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

type AccountRowProps = {
    group: AccountGroup;
};

export const AccountRow = ({ group }: AccountRowProps) => {
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
        if (!fiat) {
            return sum;
        }

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

    const renderFiatCell = () => {
        if (isFailed && !totalFiat) {
            return <Icon name="warning" intent="warning" size={16} />;
        }

        if (!totalFiat) {
            return (
                <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                    —
                </Text>
            );
        }

        return (
            <HiddenPlaceholder>
                <Text typographyStyle="body-md-strong" intent="neutral">
                    <BaseCurrencyAmountFormatter
                        currency={baseCurrencyCode.toUpperCase()}
                        value={totalFiat}
                    />
                </Text>
            </HiddenPlaceholder>
        );
    };

    const allTokens = accounts.flatMap(a =>
        (a.tokens ?? []).map(t => ({
            contract: t.contract,
            symbol: t.symbol,
            networkSymbol: a.symbol,
        })),
    );

    const truncatedAddress = `${primaryAccount.descriptor.slice(0, 4)}...${primaryAccount.descriptor.slice(-4)}`;

    return (
        <GhostContainer
            onClick={handleClick}
            tabIndex={0}
            padding={{ vertical: 12, horizontal: 16 }}
            data-testid={`@accounts-page/row/${primaryAccount.key}`}
        >
            <Row gap={16} alignItems="center">
                <CoinLogo size={32} symbol={primaryAccount.symbol} type="token" />

                <NameCell>
                    <Column gap={2} alignItems="flex-start">
                        <Row gap={8} alignItems="center" overflow="hidden" maxWidth="100%">
                            <AccountLabel
                                account={primaryAccount}
                                showAccountTypeBadge={group.kind === 'single'}
                                accountTypeBadgeSize="small"
                                typographyStyle="body-md-strong"
                                rowProps={{ gap: 8 }}
                            />
                            {group.kind === 'evm' && group.accounts.length > 1 && (
                                <Row gap={4} alignItems="center">
                                    {group.accounts.map(a => (
                                        <NetworkChip key={a.symbol}>
                                            {networks[a.symbol]?.name ?? a.symbol}
                                        </NetworkChip>
                                    ))}
                                </Row>
                            )}
                        </Row>
                        <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                            {truncatedAddress}
                        </Text>
                    </Column>
                </NameCell>

                <TokensCell onClick={handleTokensClick}>
                    <TokenStrip allTokens={allTokens} />
                </TokensCell>

                <FiatCell>{renderFiatCell()}</FiatCell>
            </Row>
        </GhostContainer>
    );
};
