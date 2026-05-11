import { useMemo } from 'react';

import styled from 'styled-components';

import { selectFlags, setFlag } from '@suite/flags';
import { Translation } from '@suite/intl';
import { openModal } from '@suite/modal';
import { selectSelectedDevice } from '@suite-common/device';
import {
    type AccountGroup,
    getAccountGroupKey,
    groupAccountsByAddress,
    isOtherAccountGroup,
    selectAllAccountsToList,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { Button, Card, Collapsible, Column, IconButton, Row, Text } from '@trezor/components';
import { spacingsPx } from '@trezor/theme';

import { DashboardSection } from 'src/components/dashboard';
import { useDiscovery, useDispatch, useLayoutSize, useSelector } from 'src/hooks/suite';

import { AccountCard } from './AccountCard';
import { AccountRow } from './AccountRow';

const OtherAccountsHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: ${spacingsPx.md} ${spacingsPx.lg};
`;

const GridWrapper = styled.div`
    display: grid;
    gap: ${spacingsPx.sm};
    grid-template-columns: repeat(auto-fill, minmax(285px, 1fr));
`;

export const AccountsView = () => {
    const accounts = useSelector(selectAllAccountsToList);
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const currentFiatRates = useSelector(selectCurrentFiatRates);
    const device = useSelector(selectSelectedDevice);
    const { isDiscoveryRunning } = useDiscovery();
    const dispatch = useDispatch();
    const { accountsGridMode } = useSelector(selectFlags);
    const { isBelowTablet } = useLayoutSize();

    const showCards = isBelowTablet || accountsGridMode;

    const setTable = () => dispatch(setFlag({ key: 'accountsGridMode', value: false }));
    const setGrid = () => dispatch(setFlag({ key: 'accountsGridMode', value: true }));

    const { mainGroups, otherGroups } = useMemo(() => {
        const grouped = groupAccountsByAddress(accounts);
        const main: AccountGroup[] = [];
        const other: AccountGroup[] = [];

        for (const group of grouped) {
            if (isOtherAccountGroup(group, baseCurrencyCode, currentFiatRates)) {
                other.push(group);
            } else {
                main.push(group);
            }
        }

        return { mainGroups: main, otherGroups: other };
    }, [accounts, baseCurrencyCode, currentFiatRates]);

    if (accounts.length === 0 && !isDiscoveryRunning) {
        return null;
    }

    const isAddAccountDisabled = isDiscoveryRunning || !device || !device.connected;
    const handleAddAccountClick = () => {
        if (!device) {
            return;
        }
        dispatch(openModal({ type: 'add-account', device }));
    };

    return (
        <DashboardSection
            data-testid="@accounts-page"
            actions={
                isBelowTablet ? undefined : (
                    <Row gap={4}>
                        <IconButton
                            icon="rowsFilled"
                            data-testid="@accounts-page/list-icon"
                            onClick={setTable}
                            intent={accountsGridMode ? 'neutral' : 'brand'}
                            priority="secondary"
                        />
                        <IconButton
                            icon="gridNineFilled"
                            data-testid="@accounts-page/grid-icon"
                            onClick={setGrid}
                            intent={accountsGridMode ? 'brand' : 'neutral'}
                            priority="secondary"
                        />
                    </Row>
                )
            }
        >
            <Column gap={16}>
                {showCards ? (
                    <GridWrapper>
                        {mainGroups.map(group => (
                            <AccountCard key={getAccountGroupKey(group)} group={group} />
                        ))}
                    </GridWrapper>
                ) : (
                    <Card paddingType="none">
                        <Column>
                            {mainGroups.map(group => (
                                <AccountRow key={getAccountGroupKey(group)} group={group} />
                            ))}
                        </Column>
                    </Card>
                )}

                {otherGroups.length > 0 && (
                    <Card paddingType="none">
                        <Collapsible defaultIsOpen={false}>
                            <Collapsible.Toggle data-testid="@accounts-page/other-accounts-toggle">
                                <OtherAccountsHeader>
                                    <Text typographyStyle="body-md-strong">
                                        <Translation id="TR_OTHER_ACCOUNTS" />
                                    </Text>
                                    <Collapsible.ToggleIcon size={24} iconName="caretCircleDown" />
                                </OtherAccountsHeader>
                            </Collapsible.Toggle>
                            <Collapsible.Content>
                                {showCards ? (
                                    <GridWrapper style={{ padding: spacingsPx.md }}>
                                        {otherGroups.map(group => (
                                            <AccountCard
                                                key={getAccountGroupKey(group)}
                                                group={group}
                                            />
                                        ))}
                                    </GridWrapper>
                                ) : (
                                    <Column>
                                        {otherGroups.map(group => (
                                            <AccountRow
                                                key={getAccountGroupKey(group)}
                                                group={group}
                                            />
                                        ))}
                                    </Column>
                                )}
                            </Collapsible.Content>
                        </Collapsible>
                    </Card>
                )}

                <Row justifyContent="flex-start">
                    <Button
                        onClick={handleAddAccountClick}
                        iconLeft="plus"
                        isDisabled={isAddAccountDisabled}
                        intent="neutral"
                        priority="secondary"
                        data-testid="@accounts-page/add-account"
                    >
                        <Translation id="TR_ADD_ACCOUNT_BUTTON" />
                    </Button>
                </Row>
            </Column>
        </DashboardSection>
    );
};
