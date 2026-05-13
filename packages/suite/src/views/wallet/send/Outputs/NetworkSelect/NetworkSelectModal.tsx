import styled from 'styled-components';

import { goto } from '@suite/router';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkDisplaySymbolName,
} from '@suite-common/wallet-config';
import {
    selectAllNetworkSymbolsOfVisibleAccounts,
    selectVisibleDeviceAccountsByNetworkSymbol,
} from '@suite-common/wallet-core';
import { type Account } from '@suite-common/wallet-types';
import { Column, Modal, Row, Text } from '@trezor/components';
import { CoinLogo } from '@trezor/product-components';
import { spacings, spacingsPx } from '@trezor/theme';

import { TokenIconSetWrapper } from 'src/components/wallet/TokenIconSetWrapper';
import { useDispatch, useSelector } from 'src/hooks/suite';

const RowButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: ${spacingsPx.sm} ${spacingsPx.md};
    background: none;
    border: none;
    cursor: pointer;
    border-radius: 8px;

    &:hover {
        background: ${({ theme }) => theme.surfaceFillActionHovered};
    }
`;

type NetworkRowProps = {
    symbol: NetworkSymbol;
    currentAccountIndex: number;
    currentAccountType: string;
    onClose: () => void;
};

const NetworkRow = ({
    symbol,
    currentAccountIndex,
    currentAccountType,
    onClose,
}: NetworkRowProps) => {
    const dispatch = useDispatch();
    const accounts = useSelector(state =>
        selectVisibleDeviceAccountsByNetworkSymbol(state, symbol),
    );
    const targetAccount =
        accounts.find(
            a => a.index === currentAccountIndex && a.accountType === currentAccountType,
        ) ?? accounts[0];

    const handleSelect = () => {
        if (!targetAccount) return;
        onClose();
        dispatch(
            goto({
                routeName: 'wallet-send',
                params: {
                    symbol: targetAccount.symbol,
                    accountIndex: targetAccount.index,
                    accountType: targetAccount.accountType,
                },
            }),
        );
    };

    return (
        <RowButton onClick={handleSelect}>
            <Row gap={spacings.sm} alignItems="center">
                <CoinLogo symbol={symbol} size={36} type="network" />
                <Text typographyStyle="body-md">{getNetworkDisplaySymbolName(symbol)}</Text>
            </Row>
            <TokenIconSetWrapper accounts={accounts} symbol={symbol} />
        </RowButton>
    );
};

type NetworkSelectModalProps = {
    account: Account;
    onClose: () => void;
};

export const NetworkSelectModal = ({ account, onClose }: NetworkSelectModalProps) => {
    const allNetworkSymbols = useSelector(selectAllNetworkSymbolsOfVisibleAccounts);
    const networkSymbols = allNetworkSymbols.filter(
        symbol => getNetwork(symbol).networkType === account.networkType,
    );

    return (
        <Modal heading="Select Network" onCancel={onClose} width={480}>
            <Column>
                {networkSymbols.map(symbol => (
                    <NetworkRow
                        key={symbol}
                        symbol={symbol}
                        currentAccountIndex={account.index}
                        currentAccountType={account.accountType}
                        onClose={onClose}
                    />
                ))}
            </Column>
        </Modal>
    );
};
