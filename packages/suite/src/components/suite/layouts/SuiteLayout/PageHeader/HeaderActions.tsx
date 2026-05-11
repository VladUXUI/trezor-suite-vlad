import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectRouterParams } from '@suite/router';
import { selectBaseCurrency, selectHighestBalanceSiblingAccount } from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Popover, Row } from '@trezor/components';
import { ButtonGroup } from '@trezor/components/src/components/buttons/ButtonGroup/ButtonGroup';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { TradeActions } from 'src/components/suite/layouts/SuiteLayout/PageHeader/TradeActions';
import { useSelector } from 'src/hooks/suite';
import { useSelectedAddressView } from 'src/hooks/wallet/useSelectedAddressView';
import { selectFullSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { type WalletParams } from 'src/types/wallet';

import { ChainPickerMenu } from './ChainPickerMenu';
import { HeaderDropdown } from './HeaderDropdown';
import { useGoToWithAnalytics } from './useGoToWithAnalytics';

export const HeaderActions = () => {
    const goToWithAnalytics = useGoToWithAnalytics();
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const routerParams = useSelector(selectRouterParams) as WalletParams;
    const { device } = useDevice();
    const addressView = useSelectedAddressView();
    const baseCurrencyCode = useSelector(selectBaseCurrency);

    // For multi-chain aggregate addresses, the Send button opens a chain
    // picker. `selectHighestBalanceSiblingAccount` provides the default
    // selection (falls back to the primary sub-account if no rates).
    const highestBalanceAccount = useSelector(state =>
        addressView?.kind === 'aggregate'
            ? selectHighestBalanceSiblingAccount(
                  state,
                  addressView.descriptor,
                  addressView.primary.deviceState,
                  baseCurrencyCode,
              )
            : undefined,
    );

    const [isSendPickerOpen, setIsSendPickerOpen] = useState(false);

    const accountType = selectedAccount.account?.accountType || routerParams?.accountType || '';
    const isTradingAvailable = !['coinjoin'].includes(accountType);
    const isAccountLoading = selectedAccount.status === 'loading';
    const isDeviceConnected = device?.connected && device?.available;

    const isAggregate = addressView?.kind === 'aggregate';

    const routeToSendForAccount = (account: Account) => {
        goToWithAnalytics({
            routeName: 'wallet-send',
            params: {
                symbol: account.symbol,
                accountIndex: account.index,
                accountType: account.accountType,
            },
        });
    };

    const handleSendClick = () => {
        // Single-chain accounts route directly. Aggregate addresses open the
        // chain picker so the user can pick which chain to send from.
        if (isAggregate) {
            setIsSendPickerOpen(true);
        } else {
            goToWithAnalytics({
                routeName: 'wallet-send',
                preserveParams: true,
            });
        }
    };

    const handleChainPicked = (account: Account) => {
        setIsSendPickerOpen(false);
        routeToSendForAccount(account);
    };

    const sendButton = (
        <HeaderActionButton
            key="wallet-send"
            icon="arrowUp"
            onClick={handleSendClick}
            data-testid="@wallet/menu/wallet-send"
        >
            <Translation id="TR_NAV_SEND" />
        </HeaderActionButton>
    );

    return (
        <Row gap={12} alignItems="center">
            <HeaderDropdown
                isDisabled={isAccountLoading}
                isTradingDisabled={!isTradingAvailable}
                showSignAndVerify
            />

            {isTradingAvailable && <TradeActions selectedAccount={selectedAccount} />}

            <AppNavigationTooltip>
                <ButtonGroup
                    isDisabled={isAccountLoading}
                    intent={isDeviceConnected ? 'brand' : 'neutral'}
                    priority={isDeviceConnected ? 'primary' : 'secondary'}
                >
                    <HeaderActionButton
                        key="wallet-receive"
                        icon="arrowDown"
                        onClick={() => {
                            goToWithAnalytics({
                                routeName: 'wallet-receive',
                                preserveParams: true,
                            });
                        }}
                        data-testid="@wallet/menu/wallet-receive"
                    >
                        <Translation id="TR_NAV_RECEIVE" />
                    </HeaderActionButton>

                    {isAggregate && highestBalanceAccount ? (
                        <Popover
                            isOpen={isSendPickerOpen}
                            onOpenChange={setIsSendPickerOpen}
                            placement={{ position: 'bottom', alignment: 'end' }}
                            content={
                                <ChainPickerMenu
                                    accounts={addressView.accounts}
                                    defaultAccount={highestBalanceAccount}
                                    onSelect={handleChainPicked}
                                    titleMessageId="TR_CHAIN_PICKER_SEND_TITLE"
                                />
                            }
                        >
                            {sendButton}
                        </Popover>
                    ) : (
                        sendButton
                    )}
                </ButtonGroup>
            </AppNavigationTooltip>
        </Row>
    );
};
