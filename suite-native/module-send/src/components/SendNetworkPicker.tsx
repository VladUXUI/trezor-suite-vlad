import { useState } from 'react';
import { useSelector } from 'react-redux';

import { type NetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import {
    type NativeAccountsRootState,
    SelectableNetworkItem,
    selectSendAvailableNetworkSymbols,
} from '@suite-native/accounts';
import {
    BottomSheetFlashList,
    Box,
    Card,
    PressableOpacity,
    RoundedIcon,
    Text,
} from '@suite-native/atoms';
import { Icon } from '@suite-native/icons';
import { Translation } from '@suite-native/intl';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type SendNetworkPickerProps = {
    selectedNetworkSymbol: NetworkSymbol | null;
    onSelectNetwork: (symbol: NetworkSymbol) => void;
};

const triggerStyle = prepareNativeStyle(utils => ({
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: utils.spacings.sp12,
    paddingHorizontal: utils.spacings.sp16,
}));

const contentStyle = prepareNativeStyle(utils => ({
    flex: 1,
    marginLeft: utils.spacings.sp16,
}));

const ESTIMATED_ITEM_SIZE = 60;

export const SendNetworkPicker = ({
    selectedNetworkSymbol,
    onSelectNetwork,
}: SendNetworkPickerProps) => {
    const { applyStyle } = useNativeStyles();
    const [isVisible, setIsVisible] = useState(false);

    const networkSymbols = useSelector((state: NativeAccountsRootState) =>
        selectSendAvailableNetworkSymbols(state),
    );

    const handlePress = () => setIsVisible(true);
    const handleClose = () => setIsVisible(false);

    const handleSelectNetwork = (symbol: NetworkSymbol) => {
        setIsVisible(false);
        onSelectNetwork(symbol);
    };

    const selectedNetwork = selectedNetworkSymbol ? getNetwork(selectedNetworkSymbol) : null;

    return (
        <>
            <Card noPadding>
                <PressableOpacity onPress={handlePress}>
                    <Box style={applyStyle(triggerStyle)}>
                        {selectedNetwork ? (
                            <RoundedIcon symbol={selectedNetworkSymbol!} size={40} />
                        ) : (
                            <RoundedIcon name="globeSimple" size={40} intent="neutral" />
                        )}
                        <Box style={applyStyle(contentStyle)}>
                            {selectedNetwork ? (
                                <>
                                    <Text variant="body-md-strong">{selectedNetwork.name}</Text>
                                    <Text variant="body-sm" color="contentSecondary">
                                        {selectedNetwork.symbol.toUpperCase()}
                                    </Text>
                                </>
                            ) : (
                                <Text variant="body-md" color="contentSecondary">
                                    <Translation id="moduleSend.accountsList.selectNetwork" />
                                </Text>
                            )}
                        </Box>
                        <Icon name="caretDown" size="medium" color="contentSecondary" />
                    </Box>
                </PressableOpacity>
            </Card>

            <BottomSheetFlashList<NetworkSymbol>
                isVisible={isVisible}
                onClose={handleClose}
                data={networkSymbols}
                keyExtractor={item => item}
                renderItem={({ item }) => (
                    <SelectableNetworkItem symbol={item} onPress={handleSelectNetwork} />
                )}
                estimatedItemSize={ESTIMATED_ITEM_SIZE}
                estimatedListHeight={ESTIMATED_ITEM_SIZE * networkSymbols.length * 1.5}
            />
        </>
    );
};
