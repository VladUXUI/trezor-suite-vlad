import { useState } from 'react';

import { goto } from '@suite/router';
import { getNetworkDisplaySymbolName } from '@suite-common/wallet-config';
import { type Account } from '@suite-common/wallet-types';
import { Card, Column, IconButton, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings } from '@trezor/theme';

import { GlobalSendModal } from 'src/components/suite/layouts/SuiteLayout/PageHeader/GlobalSendReceive/GlobalSendModal/GlobalSendModal';
import { useDispatch } from 'src/hooks/suite';
import { useSendFormContext } from 'src/hooks/wallet';
import { globalSendReceiveFilters } from 'src/slices/wallet/globalSendReceiveFilters';

export const NetworkSelect = () => {
    const { account } = useSendFormContext();
    const dispatch = useDispatch();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleOpen = () => {
        dispatch(globalSendReceiveFilters.actions.resetFilters());
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
        dispatch(globalSendReceiveFilters.actions.resetFilters());
    };

    const handleSubmit = (selectedAccount: Account) => {
        setIsModalOpen(false);
        dispatch(globalSendReceiveFilters.actions.resetFilters());
        dispatch(
            goto({
                routeName: 'wallet-send',
                params: {
                    symbol: selectedAccount.symbol,
                    accountIndex: selectedAccount.index,
                    accountType: selectedAccount.accountType,
                },
            }),
        );
    };

    return (
        <>
            {isModalOpen && <GlobalSendModal onCancel={handleCancel} onSubmit={handleSubmit} />}

            <Card fillType="default" paddingType="normal" onClick={handleOpen}>
                <Row justifyContent="space-between" height={64}>
                    <Row justifyContent="flex-start" gap={spacings.sm}>
                        <CoinLogo symbol={account.symbol} size={36} />
                        <Column alignItems="flex-start">
                            <Text intent="neutral" typographyStyle="body-md">
                                {getNetworkDisplaySymbolName(account.symbol)}
                            </Text>
                            <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                                {account.symbol.toUpperCase()}
                            </Text>
                        </Column>
                    </Row>
                    <IconButton icon="caretDown" intent="neutral" priority="secondary" />
                </Row>
            </Card>
        </>
    );
};
