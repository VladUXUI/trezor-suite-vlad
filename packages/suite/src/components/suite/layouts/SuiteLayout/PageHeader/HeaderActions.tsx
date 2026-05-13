import { useState } from 'react';

import { useDevice } from '@suite/device';
import { Translation } from '@suite/intl';
import { selectRouterParams } from '@suite/router';
import { Row } from '@trezor/components';
import { ButtonGroup } from '@trezor/components/src/components/buttons/ButtonGroup/ButtonGroup';

import { AppNavigationTooltip } from 'src/components/suite/AppNavigation/AppNavigationTooltip';
import { HeaderActionButton } from 'src/components/suite/layouts/SuiteLayout/PageHeader/HeaderActionButton';
import { TradeActions } from 'src/components/suite/layouts/SuiteLayout/PageHeader/TradeActions';
import { useSelector } from 'src/hooks/suite';
import { useSelectedAddressView } from 'src/hooks/wallet/useSelectedAddressView';
import { selectFullSelectedAccount } from 'src/reducers/wallet/selectedAccountReducer';
import { type WalletParams } from 'src/types/wallet';
import { NetworkSelectModal } from 'src/views/wallet/send/Outputs/NetworkSelect/NetworkSelectModal';

import { HeaderDropdown } from './HeaderDropdown';
import { useGoToWithAnalytics } from './useGoToWithAnalytics';

export const HeaderActions = () => {
    const goToWithAnalytics = useGoToWithAnalytics();
    const selectedAccount = useSelector(selectFullSelectedAccount);
    const routerParams = useSelector(selectRouterParams) as WalletParams;
    const { device } = useDevice();
    const addressView = useSelectedAddressView();

    const [isSendPickerOpen, setIsSendPickerOpen] = useState(false);

    const accountType = selectedAccount.account?.accountType || routerParams?.accountType || '';
    const isTradingAvailable = !['coinjoin'].includes(accountType);
    const isAccountLoading = selectedAccount.status === 'loading';
    const isDeviceConnected = device?.connected && device?.available;

    const isAggregate = addressView?.kind === 'aggregate';

    const handleSendClick = () => {
        if (isAggregate) {
            setIsSendPickerOpen(true);
        } else {
            goToWithAnalytics({
                routeName: 'wallet-send',
                preserveParams: true,
            });
        }
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

                    {sendButton}
                    {isAggregate && isSendPickerOpen && (
                        <NetworkSelectModal
                            account={addressView.primary}
                            onClose={() => setIsSendPickerOpen(false)}
                        />
                    )}
                </ButtonGroup>
            </AppNavigationTooltip>
        </Row>
    );
};
