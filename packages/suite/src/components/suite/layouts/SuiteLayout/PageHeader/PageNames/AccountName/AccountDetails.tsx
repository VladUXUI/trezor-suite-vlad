import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { motion, useAnimation } from 'framer-motion';
import styled from 'styled-components';

import { useTranslation } from '@suite/intl';
import { selectIsLegacyLabelingVisible, selectLabelingDataForAccount } from '@suite/metadata';
import { selectIsSuiteSyncEnabled, selectSuiteSyncAccountLabel } from '@suite-common/suite-sync';
import { selectAllAccountsToList, useDisplayBaseCurrency } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { parseDeviceStaticSessionId } from '@suite-common/wallet-utils';
import {
    Column,
    H2,
    Icon,
    Popover,
    type PopoverRef,
    Row,
    Text,
    motionEasing,
} from '@trezor/components';
import { CoinLogo, type EditableTextRef } from '@trezor/product-components';

import { AccountTypeBadge } from 'src/components/suite/AccountTypeBadge';
import { AmountUnitSwitchWrapper } from 'src/components/suite/AmountUnitSwitchWrapper';
import { BaseCurrencyValue } from 'src/components/suite/BaseCurrencyValue';
import { FormattedCryptoAmount } from 'src/components/suite/FormattedCryptoAmount';
import { Labeling } from 'src/components/suite/labeling';
import { useDefaultAccountLabel, useSelector } from 'src/hooks/suite';
import { useIsContentBelowBreakpoint } from 'src/support/suite/ContentFlex';

import { AccountSwitcherList } from './AccountSwitcherList';
import { useRenameAccount } from './RenameAccountContext';

const DetailsContainer = styled(motion.div)`
    -webkit-app-region: no-drag;
    overflow: hidden;
`;

const SwitcherTrigger = styled.button`
    -webkit-app-region: no-drag;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: ${({ theme }) => theme.elementFillNeutralSoft};
    border: none;
    padding: 4px 10px 4px 8px;
    border-radius: 12px;
    cursor: pointer;
    color: inherit;
    font: inherit;
    overflow: hidden;
    max-width: 100%;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.elementFillNeutralSoftHovered};
    }
`;

const TriggerLabel = styled.span`
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
`;

type AccountDetailsProps = {
    selectedAccount: Account;
    isBalanceShown: boolean;
};

export const AccountDetails = ({ selectedAccount, isBalanceShown }: AccountDetailsProps) => {
    const hasMountedRef = useRef(false);
    const controls = useAnimation();
    const popoverRef = useRef<PopoverRef>(null);
    const labelingRef = useRef<EditableTextRef>(null);
    const [isRenaming, setIsRenaming] = useState(false);

    const isSuiteSyncEnabled = useSelector(selectIsSuiteSyncEnabled);
    const isLegacyLabelingVisible = useSelector(selectIsLegacyLabelingVisible);
    const allAccounts = useSelector(selectAllAccountsToList);

    const selectedAccountLegacyLabels = useSelector(state =>
        selectLabelingDataForAccount(state, selectedAccount.key),
    );
    const { getDefaultAccountLabel } = useDefaultAccountLabel();

    const isContentBelowBreakpoint = useIsContentBelowBreakpoint();
    const { translationString } = useTranslation();
    const { walletDescriptor } = parseDeviceStaticSessionId(selectedAccount.deviceState);

    const suiteSyncAccountLabel = useSelector(state =>
        selectSuiteSyncAccountLabel(
            state,
            walletDescriptor,
            selectedAccount.descriptor,
            selectedAccount.symbol,
        ),
    );

    const renameContext = useRenameAccount();

    const { symbol, key, path, index, accountType, formattedBalance, deviceState, networkType } =
        selectedAccount;
    const logoSymbol = networkType === 'ethereum' ? 'eth' : symbol;
    const { shallDisplayBaseCurrency } = useDisplayBaseCurrency(symbol);

    const defaultLabel = getDefaultAccountLabel({ accountType, symbol, index });

    const label =
        (isSuiteSyncEnabled ? suiteSyncAccountLabel : null) ||
        (isLegacyLabelingVisible ? selectedAccountLegacyLabels.accountLabel : null) ||
        defaultLabel;

    const handleAfterSubmit = useCallback((success: boolean) => {
        if (success) {
            setIsRenaming(false);
        }
    }, []);

    const handleCancel = useCallback(() => {
        setIsRenaming(false);
    }, []);

    useEffect(() => {
        const startRename = () => {
            setIsRenaming(true);
        };

        renameContext?.setTrigger(startRename);

        return () => {
            renameContext?.setTrigger(null);
        };
    }, [renameContext, key]);

    // When rename mode is entered, focus the editable input.
    useEffect(() => {
        if (isRenaming) {
            labelingRef.current?.startEditing();
        }
    }, [isRenaming]);

    const getTypographyStyle = () => {
        if (isBalanceShown) {
            return 'body-md-strong';
        } else if (isContentBelowBreakpoint) {
            return 'headline-sm';
        }

        return 'headline-md';
    };

    const labelingElement = useMemo(
        () => (
            <Labeling
                ref={labelingRef}
                key={`account-label-${key}`}
                payload={{
                    type: 'accountLabel',
                    entityKey: key,
                    defaultValue: path,
                    value: label,
                }}
                deviceStaticSessionId={deviceState}
                defaultValue={defaultLabel}
                rightAddon={
                    <AccountTypeBadge
                        accountType={accountType}
                        path={path}
                        networkType={networkType}
                        size={isBalanceShown ? 'small' : 'medium'}
                    />
                }
                gap={8}
                isEditActionHidden
                placeholder={translationString('TR_LABELING_ACCOUNT_LABEL')}
                onAfterSubmit={handleAfterSubmit}
                onCancel={handleCancel}
            >
                {label}
            </Labeling>
        ),
        [
            key,
            path,
            label,
            deviceState,
            defaultLabel,
            accountType,
            networkType,
            isBalanceShown,
            translationString,
            handleAfterSubmit,
            handleCancel,
        ],
    );

    useEffect(() => {
        if (!hasMountedRef.current) {
            hasMountedRef.current = true;

            return;
        }

        controls.start({
            y: isBalanceShown ? ['100%', '0%'] : ['-100%', '0%'],
            opacity: [0, 1],
            transition: { duration: 0.3, ease: motionEasing.enter },
        });
    }, [controls, isBalanceShown]);

    return (
        <DetailsContainer initial={false} animate={controls}>
            <Column overflow="hidden">
                <H2 typographyStyle={getTypographyStyle()}>
                    {isRenaming ? (
                        <Row gap={8} alignItems="center">
                            <CoinLogo size={36} symbol={logoSymbol} type="token" />
                            {labelingElement}
                        </Row>
                    ) : (
                        <Popover
                            ref={popoverRef}
                            placement={{ position: 'bottom', alignment: 'start' }}
                            content={
                                <AccountSwitcherList
                                    accounts={allAccounts}
                                    selectedAccountKey={key}
                                    onSelected={() => popoverRef.current?.close()}
                                />
                            }
                        >
                            <SwitcherTrigger
                                type="button"
                                data-testid="@wallet/account/switcher-trigger"
                            >
                                <CoinLogo size={36} symbol={logoSymbol} type="token" />
                                <TriggerLabel>{label}</TriggerLabel>
                                <AccountTypeBadge
                                    accountType={accountType}
                                    path={path}
                                    networkType={networkType}
                                    size={isBalanceShown ? 'small' : 'medium'}
                                />
                                <Icon name="caretDown" size={20} />
                            </SwitcherTrigger>
                        </Popover>
                    )}
                </H2>
                {isBalanceShown && (
                    <Text intent="neutral" priority="secondary" typographyStyle="body-xs" as="div">
                        <Row gap={4}>
                            <AmountUnitSwitchWrapper symbol={symbol}>
                                <FormattedCryptoAmount
                                    data-testid="@wallet/account/crypto-balance"
                                    value={formattedBalance}
                                    symbol={symbol}
                                />
                            </AmountUnitSwitchWrapper>
                            {shallDisplayBaseCurrency && (
                                <span data-testid="@wallet/account/fiat-amount">
                                    <BaseCurrencyValue
                                        amount={formattedBalance}
                                        symbol={symbol}
                                        showApproximationIndicator
                                    />
                                </span>
                            )}
                        </Row>
                    </Text>
                )}
            </Column>
        </DetailsContainer>
    );
};
