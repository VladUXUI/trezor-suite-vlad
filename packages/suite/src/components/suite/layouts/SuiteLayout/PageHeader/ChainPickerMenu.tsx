import { type KeyboardEvent, useEffect, useMemo, useRef } from 'react';

import styled from 'styled-components';

import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { networks } from '@suite-common/wallet-config';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { Column, GhostContainer, Row, Text } from '@trezor/components';
import { NetworkIcon } from '@trezor/product-components';
import { spacingsPx } from '@trezor/theme';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useSelector } from 'src/hooks/suite';

const MenuContainer = styled.div`
    width: 280px;
    padding: ${spacingsPx.xs};
    background: ${({ theme }) => theme.surfaceFillModeless};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    border-radius: 12px;
    box-shadow: ${({ theme }) => theme.boxShadowElevated};
`;

const TitleRow = styled.div`
    padding: ${spacingsPx.xs} ${spacingsPx.sm} ${spacingsPx.xxs};
`;

const RowFocusWrapper = styled.div`
    outline: none;
`;

type ChainPickerRowProps = {
    account: Account;
    isDefault: boolean;
    onSelect: (account: Account) => void;
    autoFocus: boolean;
};

const ChainPickerRow = ({ account, isDefault, onSelect, autoFocus }: ChainPickerRowProps) => {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);
    const { BaseCurrencyAmountFormatter } = useFormatters();
    const ref = useRef<HTMLDivElement>(null);
    const network = networks[account.symbol];

    const fiat = getAccountFiatBalance({
        account,
        baseCurrencyCode,
        rates,
        shouldIncludeTokens: true,
        shouldIncludeStaking: true,
    });

    // Auto-focus the default row so the user can press Enter to confirm. The
    // popover's FloatingFocusManager would otherwise pull focus to the first
    // focusable element, which isn't necessarily the default chain. We wrap
    // GhostContainer in a focusable div instead of trying to add ref/keyDown
    // directly because GhostContainer's prop surface doesn't expose them.
    useEffect(() => {
        if (autoFocus && ref.current) {
            ref.current.focus();
        }
    }, [autoFocus]);

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelect(account);
        }
    };

    return (
        <RowFocusWrapper ref={ref} tabIndex={0} onKeyDown={handleKeyDown} role="option">
            <GhostContainer
                onClick={() => onSelect(account)}
                isActive={isDefault}
                tabIndex={-1}
                padding={{ vertical: 8, horizontal: 12 }}
            >
                <Row gap={12} alignItems="center">
                    <NetworkIcon networkSymbol={account.symbol} size={20} />
                    <Column flex="1" alignItems="flex-start" gap={0}>
                        <Text typographyStyle="body-md-strong">
                            {network?.name ?? account.symbol}
                        </Text>
                        <HiddenPlaceholder>
                            <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                                {account.formattedBalance}{' '}
                                {network?.displaySymbol ?? account.symbol.toUpperCase()}
                            </Text>
                        </HiddenPlaceholder>
                    </Column>
                    {fiat && (
                        <HiddenPlaceholder>
                            <Text typographyStyle="body-sm" intent="neutral" priority="secondary">
                                <BaseCurrencyAmountFormatter
                                    currency={baseCurrencyCode.toUpperCase()}
                                    value={fiat}
                                />
                            </Text>
                        </HiddenPlaceholder>
                    )}
                </Row>
            </GhostContainer>
        </RowFocusWrapper>
    );
};

type ChainPickerMenuProps = {
    accounts: Account[];
    defaultAccount: Account;
    onSelect: (account: Account) => void;
    titleMessageId: 'TR_CHAIN_PICKER_SEND_TITLE';
};

/**
 * Popover content for picking which chain to operate on when an aggregate
 * (multi-chain EVM) address triggers an action that's inherently single-chain
 * (Send). Pure UI — the caller owns open/close state and what to do with the
 * picked account (typically: route to `wallet-send` for that sub-account).
 *
 * The component sorts rows in the same order the parent passes them (which is
 * the post-`sortByCoin` order from `selectSiblingEvmAccounts`), with the
 * `defaultAccount` (typically the highest fiat balance) visually highlighted
 * and keyboard-focused so `Enter` confirms it.
 */
export const ChainPickerMenu = ({
    accounts,
    defaultAccount,
    onSelect,
    titleMessageId,
}: ChainPickerMenuProps) => {
    // Surface the default at the top of the list so the highlighted row is
    // always the first thing the user reads.
    const orderedAccounts = useMemo(() => {
        const rest = accounts.filter(a => a.key !== defaultAccount.key);

        return [defaultAccount, ...rest];
    }, [accounts, defaultAccount]);

    return (
        <MenuContainer
            data-testid="@wallet/header/chain-picker"
            role="listbox"
            aria-label="Pick a chain"
        >
            <TitleRow>
                <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                    <Translation id={titleMessageId} />
                </Text>
            </TitleRow>
            <Column gap={2}>
                {orderedAccounts.map(account => (
                    <ChainPickerRow
                        key={account.key}
                        account={account}
                        isDefault={account.key === defaultAccount.key}
                        onSelect={onSelect}
                    />
                ))}
            </Column>
        </MenuContainer>
    );
};
