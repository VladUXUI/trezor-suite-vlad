import { type ReactNode } from 'react';

import {
    selectAccountTransactionsWithNulls,
    selectIsLoadingAccountTransactions,
} from '@suite-common/wallet-core';

import { CoinjoinAccountDiscoveryProgress, WalletLayout } from 'src/components/wallet';
import { SolanaLimitedHistoryBanner } from 'src/components/wallet/WalletLayout/AccountBanners/SolanaLimitedHistoryBanner';
import { useSelector } from 'src/hooks/suite';
import { useSelectedAddressView } from 'src/hooks/wallet/useSelectedAddressView';
import { type AppState } from 'src/types/suite';

import { CoinjoinExplanation } from './CoinjoinExplanation/CoinjoinExplanation';
import { CoinjoinSummary } from './CoinjoinSummary/CoinjoinSummary';
import { TradeBox } from './TradeBox/TradeBox';
import { AggregatedTransactionList } from './TransactionList/AggregatedTransactionList';
import { WalletTransactionList } from './TransactionList/WalletTransactionList';
import { AccountEmpty } from './components/AccountEmpty';
import { NoTransactions } from './components/NoTransactions';
import { TransactionSummary } from './components/TransactionSummary';
import { TronResources } from './components/TronResources';
import { CardanoNewProviderCard } from '../staking/components/AdaStakingDashboard/CardanoNewProviderCard';

interface LayoutProps {
    selectedAccount: AppState['wallet']['selectedAccount'];
    children?: ReactNode;
}

const Layout = ({ selectedAccount, children }: LayoutProps) => (
    <WalletLayout title="TR_NAV_TRANSACTIONS" account={selectedAccount}>
        {children}
    </WalletLayout>
);

export const Transactions = () => {
    const selectedAccount = useSelector(state => state.wallet.selectedAccount);
    const transactionsIsLoading = useSelector(state =>
        selectIsLoadingAccountTransactions(state, selectedAccount.account?.key || null),
    );
    const accountTransactions = useSelector(state =>
        selectAccountTransactionsWithNulls(state, selectedAccount.account?.key || null),
    );
    const addressView = useSelectedAddressView();

    if (selectedAccount.status !== 'loaded') {
        return <Layout selectedAccount={selectedAccount} />;
    }

    const { account } = selectedAccount;

    // Aggregate (multi-chain EVM): show the per-primary-chain summary card on
    // top (`TransactionSummary` is single-chain today; aggregating it across
    // chains is a future-pass), then a single chronological merged feed for
    // every transaction across every sibling chain.
    if (addressView?.kind === 'aggregate') {
        return (
            <Layout selectedAccount={selectedAccount}>
                <TransactionSummary account={addressView.primary} />
                <TradeBox account={addressView.primary} />
                <AggregatedTransactionList
                    accounts={addressView.accounts}
                    descriptor={addressView.descriptor}
                    deviceState={addressView.primary.deviceState}
                />
            </Layout>
        );
    }

    if (account.backendType === 'coinjoin') {
        const isLoading = account.status === 'out-of-sync' && !!account.syncing;
        const isEmpty = !accountTransactions.length;

        return (
            <Layout selectedAccount={selectedAccount}>
                {isLoading && <CoinjoinAccountDiscoveryProgress />}

                {!isLoading && (
                    <>
                        <CoinjoinSummary accountKey={account.key} />

                        {isEmpty ? (
                            <CoinjoinExplanation />
                        ) : (
                            <WalletTransactionList account={account} symbol={account.symbol} />
                        )}
                    </>
                )}
            </Layout>
        );
    }

    if (accountTransactions.length > 0 || transactionsIsLoading) {
        return (
            <Layout selectedAccount={selectedAccount}>
                <CardanoNewProviderCard account={account} />
                <TronResources account={account} />
                <TransactionSummary account={account} />
                <TradeBox account={account} />
                <SolanaLimitedHistoryBanner account={account} />
                <WalletTransactionList account={account} symbol={account.symbol} />
            </Layout>
        );
    }

    if (account.empty) {
        return (
            <Layout selectedAccount={selectedAccount}>
                <AccountEmpty account={selectedAccount.account} />
                <TradeBox account={account} />
            </Layout>
        );
    }

    return (
        <Layout selectedAccount={selectedAccount}>
            <NoTransactions account={account} />
            <TradeBox account={account} />
        </Layout>
    );
};
