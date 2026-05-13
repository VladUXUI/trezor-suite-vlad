import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    AccountSelectBottomSheet,
    type NativeAccountsRootState,
    type OnSelectAccount,
    selectSendAvailableAccountsByNetworkSymbol,
} from '@suite-native/accounts';
import { events } from '@suite-native/analytics';
import { Button, VStack } from '@suite-native/atoms';
import { Translation } from '@suite-native/intl';
import {
    Screen,
    ScreenHeader,
    type SendStackParamList,
    SendStackRoutes,
    type StackProps,
    useNavigateToInitialScreen,
} from '@suite-native/navigation';
import { useAnalytics } from '@suite-native/services';
import { isNetworkWithTokens } from '@suite-native/tokens';

import { SendAssetPicker } from '../components/SendAssetPicker';
import { SendNetworkPicker } from '../components/SendNetworkPicker';

export const SendAccountsScreen = ({
    navigation,
    route,
}: StackProps<SendStackParamList, SendStackRoutes.SendAccounts>) => {
    const { accountKey: prefillAccountKey, tokenContract: prefillTokenContract } =
        route.params ?? {};

    const navigateToInitialScreen = useNavigateToInitialScreen();
    const analytics = useAnalytics();

    const prefillAccount = useSelector((state: AccountsRootState) =>
        prefillAccountKey ? selectAccountByKey(state, prefillAccountKey) : null,
    );

    const [selectedNetworkSymbol, setSelectedNetworkSymbol] = useState<NetworkSymbol | null>(
        prefillAccount?.symbol ?? null,
    );
    const [selectedAccountKey, setSelectedAccountKey] = useState<AccountKey | null>(
        prefillAccountKey ?? null,
    );
    const [selectedTokenContract, setSelectedTokenContract] = useState<TokenAddress | undefined>(
        prefillTokenContract,
    );
    const [nonTokenPickerVisible, setNonTokenPickerVisible] = useState(false);

    const nonTokenAccounts = useSelector((state: NativeAccountsRootState) =>
        selectSendAvailableAccountsByNetworkSymbol(state, selectedNetworkSymbol),
    );

    const handleSelectNetwork = (symbol: NetworkSymbol) => {
        setSelectedAccountKey(null);
        setSelectedTokenContract(undefined);
        setSelectedNetworkSymbol(symbol);

        if (!isNetworkWithTokens(symbol)) {
            // For non-token networks (BTC, LTC etc.) open the account picker immediately.
            // If there's only one account it will be visible in the sheet for a quick confirm.
            setNonTokenPickerVisible(true);
        }
    };

    const handleSelectAccount: OnSelectAccount = ({ account, tokenAddress, tokenSymbol }) => {
        setNonTokenPickerVisible(false);
        analytics.report({
            type: events.sendFlowEnteredEvent.name,
            payload: {
                location: 'dashboard',
                assetSymbol: account.symbol,
                tokenContract: tokenAddress,
                tokenSymbol,
            },
        });
        navigation.navigate(SendStackRoutes.SendOutputs, {
            accountKey: account.key,
            tokenContract: tokenAddress,
        });
    };

    const isPrefilled = !!prefillAccountKey;
    const isTokenNetwork = selectedNetworkSymbol
        ? isNetworkWithTokens(selectedNetworkSymbol)
        : false;

    const handleContinue = () => {
        if (selectedAccountKey) {
            navigation.navigate(SendStackRoutes.SendOutputs, {
                accountKey: selectedAccountKey,
                tokenContract: selectedTokenContract,
            });
        }
    };

    return (
        <Screen
            header={
                <ScreenHeader
                    title={<Translation id="moduleSend.accountsList.title" />}
                    closeActionType="close"
                    closeAction={navigateToInitialScreen}
                />
            }
        >
            <VStack marginTop="sp8" spacing="sp16">
                <SendNetworkPicker
                    selectedNetworkSymbol={selectedNetworkSymbol}
                    onSelectNetwork={handleSelectNetwork}
                />

                {isTokenNetwork && (
                    <SendAssetPicker
                        selectedNetworkSymbol={selectedNetworkSymbol}
                        selectedAccountKey={selectedAccountKey}
                        selectedTokenContract={selectedTokenContract}
                        onSelectAccount={handleSelectAccount}
                    />
                )}

                {isPrefilled && selectedAccountKey && (
                    <Button onPress={handleContinue}>
                        <Translation id="moduleSend.accountsList.title" />
                    </Button>
                )}
            </VStack>

            <AccountSelectBottomSheet
                data={nonTokenAccounts.map(account => ({
                    type: 'account' as const,
                    account,
                    hasAnyKnownTokens: false,
                    isFirst: nonTokenAccounts.indexOf(account) === 0,
                    isLast: nonTokenAccounts.indexOf(account) === nonTokenAccounts.length - 1,
                }))}
                isVisible={nonTokenPickerVisible}
                onClose={() => setNonTokenPickerVisible(false)}
                onSelectAccount={handleSelectAccount}
            />
        </Screen>
    );
};
