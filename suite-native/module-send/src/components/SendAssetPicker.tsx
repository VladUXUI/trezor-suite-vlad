import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountsRootState, selectAccountByKey } from '@suite-common/wallet-core';
import { type AccountKey, type TokenAddress } from '@suite-common/wallet-types';
import {
    AccountSelectBottomSheet,
    type NativeAccountsRootState,
    type OnSelectAccount,
    selectSendAssetSectionsForNetwork,
} from '@suite-native/accounts';
import { Box, Card, PressableOpacity, RoundedIcon, Text } from '@suite-native/atoms';
import { CryptoIcon, CryptoIconWithNetwork, Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { type TokensRootState, selectAccountTokenInfo } from '@suite-native/tokens';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type SendAssetPickerProps = {
    selectedNetworkSymbol: NetworkSymbol | null;
    selectedAccountKey: AccountKey | null;
    selectedTokenContract: TokenAddress | undefined;
    onSelectAccount: OnSelectAccount;
};

const triggerStyle = prepareNativeStyle<{ disabled: boolean }>((utils, { disabled }) => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp16,
    opacity: disabled ? 0.4 : 1,
}));

const contentStyle = prepareNativeStyle(utils => ({
    flex: 1,
    marginLeft: utils.spacings.sp16,
}));

export const SendAssetPicker = ({
    selectedNetworkSymbol,
    selectedAccountKey,
    selectedTokenContract,
    onSelectAccount,
}: SendAssetPickerProps) => {
    const { applyStyle } = useNativeStyles();
    const [isVisible, setIsVisible] = useState(false);

    const sections = useSelector((state: NativeAccountsRootState) =>
        selectSendAssetSectionsForNetwork(state, selectedNetworkSymbol),
    );

    const selectedAccount = useSelector((state: AccountsRootState) =>
        selectedAccountKey ? selectAccountByKey(state, selectedAccountKey) : null,
    );

    const selectedTokenInfo = useSelector((state: TokensRootState) =>
        selectedAccountKey && selectedTokenContract
            ? selectAccountTokenInfo(state, selectedAccountKey, selectedTokenContract)
            : null,
    );

    const isDisabled = !selectedNetworkSymbol;

    const handlePress = () => {
        if (!isDisabled) setIsVisible(true);
    };

    const handleClose = () => setIsVisible(false);

    const handleSelectAccount: OnSelectAccount = params => {
        setIsVisible(false);
        onSelectAccount(params);
    };

    const renderIcon = () => {
        if (selectedAccount && selectedTokenInfo) {
            return (
                <CryptoIconWithNetwork
                    symbol={selectedAccount.symbol}
                    contractAddress={selectedTokenInfo.contract}
                />
            );
        }
        if (selectedAccount) {
            return <CryptoIcon symbol={selectedAccount.symbol} />;
        }

        return <RoundedIcon name="coin" size={40} intent="neutral" />;
    };

    const renderContent = () => {
        if (selectedTokenInfo) {
            return (
                <>
                    <Text variant="body-md-strong">
                        {selectedTokenInfo.name ?? selectedTokenInfo.symbol}
                    </Text>
                    <Text variant="body-sm" color="contentSecondary">
                        {selectedTokenInfo.symbol?.toUpperCase()}
                    </Text>
                </>
            );
        }
        if (selectedAccount) {
            return (
                <>
                    <Text variant="body-md-strong">
                        {selectedAccount.accountLabel ?? selectedAccount.symbol.toUpperCase()}
                    </Text>
                    <Text variant="body-sm" color="contentSecondary">
                        {selectedAccount.symbol.toUpperCase()}
                    </Text>
                </>
            );
        }

        return (
            <Text variant="body-md" color="contentSecondary">
                <Translation id="moduleSend.accountsList.selectAsset" />
            </Text>
        );
    };

    return (
        <>
            <Card noPadding>
                <PressableOpacity onPress={handlePress} disabled={isDisabled}>
                    <Box style={applyStyle(triggerStyle, { disabled: isDisabled })}>
                        {renderIcon()}
                        <Box style={applyStyle(contentStyle)}>{renderContent()}</Box>
                        <Icon name="caretDown" size="medium" color="contentSecondary" />
                    </Box>
                </PressableOpacity>
            </Card>

            <AccountSelectBottomSheet
                data={sections}
                isVisible={isVisible}
                onClose={handleClose}
                onSelectAccount={handleSelectAccount}
            />
        </>
    );
};
