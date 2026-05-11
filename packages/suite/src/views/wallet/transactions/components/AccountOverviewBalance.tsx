import { Translation } from '@suite/intl';
import { useFormatters } from '@suite-common/formatters';
import { type NetworkSymbol, getNetworkFeatures, networks } from '@suite-common/wallet-config';
import {
    selectAddressFiatTotal,
    selectBaseCurrency,
    selectCurrentFiatRates,
} from '@suite-common/wallet-core';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { BASE_CURRENCY_ZERO, getAccountFiatBalance, isTestnet } from '@suite-common/wallet-utils';
import {
    Column,
    Icon,
    Paragraph,
    Row,
    SkeletonCircle,
    SkeletonRectangle,
    Text,
    Tooltip,
} from '@trezor/components';
import { CoinLogo, NetworkIcon } from '@trezor/product-components';
import { BigNumber } from '@trezor/utils';

import {
    AmountUnitSwitchWrapper,
    FormattedCryptoAmount,
    HiddenPlaceholder,
} from 'src/components/suite';
import { BigAmountValue } from 'src/components/wallet/BigAmountValue';
import { FiatHeader } from 'src/components/wallet/FiatHeader';
import { useSelector } from 'src/hooks/suite';
import { useSelectedAddressView } from 'src/hooks/wallet/useSelectedAddressView';
import { useAccountHeaderContext } from 'src/support/suite/AccountHeaderProvider';
import { type AppState } from 'src/types/suite';

type AccountOverviewBalanceSkeletonProps = {
    animate?: boolean;
    symbol?: NetworkSymbol;
};

const AccountOverviewBalanceSkeleton = ({
    animate,
    symbol,
}: AccountOverviewBalanceSkeletonProps) => (
    <Column gap={4}>
        <SkeletonRectangle width={100} height={50} animate={animate} />
        <Row gap={4}>
            {symbol ? <CoinLogo size={16} symbol={symbol} /> : <SkeletonCircle size="20px" />}
            <SkeletonRectangle height={20} animate={animate} />
        </Row>
    </Column>
);

const getBalanceExcludesTranslationId = (hasTokens: boolean, hasStaking: boolean) => {
    if (hasTokens && hasStaking) return 'TR_BALANCE_EXCLUDES_TOKENS_AND_STAKING' as const;
    if (hasTokens) return 'TR_BALANCE_EXCLUDES_TOKENS' as const;
    if (hasStaking) return 'TR_BALANCE_EXCLUDES_STAKING' as const;

    return null;
};

/**
 * Per-chain row inside the aggregated-balance hover-expand tooltip. Shows the
 * chain icon, name, native balance (with ticker), and converted fiat — so the
 * user can see exactly where the aggregated total comes from.
 */
const PerChainBreakdownRow = ({ account }: { account: Account }) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);
    const network = networks[account.symbol];
    const fiat = getAccountFiatBalance({
        account,
        baseCurrencyCode: baseCurrency,
        rates,
        shouldIncludeTokens: true,
        shouldIncludeStaking: true,
    });
    const { BaseCurrencyAmountFormatter } = useFormatters();

    return (
        <Row gap={8} alignItems="center" justifyContent="space-between">
            <Row gap={6} alignItems="center">
                <NetworkIcon networkSymbol={account.symbol} size={16} />
                <Text typographyStyle="body-sm">{network?.name ?? account.symbol}</Text>
            </Row>
            <Column alignItems="flex-end">
                <Text typographyStyle="body-sm-strong">
                    {account.formattedBalance} {network?.displaySymbol ?? account.symbol}
                </Text>
                {fiat && (
                    <Text typographyStyle="body-xs" intent="neutral" priority="secondary">
                        <BaseCurrencyAmountFormatter
                            currency={baseCurrency.toUpperCase()}
                            value={fiat}
                        />
                    </Text>
                )}
            </Column>
        </Row>
    );
};

/**
 * Aggregated balance UI for a chain-agnostic EVM address. Shows the summed
 * fiat total as the headline, then a single line "X.XXX TOKEN across N chains"
 * with chain icons. Hovering the line reveals a tooltip with the per-chain
 * breakdown.
 */
const AggregatedBalance = ({ accounts }: { accounts: Account[] }) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const primary = accounts[0];
    const totalFiat = useSelector(state =>
        selectAddressFiatTotal(state, primary.descriptor, primary.deviceState, baseCurrency),
    );

    // Sum native balance across the group (all sub-accounts share a network
    // type, so the same display ticker applies — typically ETH).
    const totalNativeBalance = accounts.reduce(
        (sum, account) => sum.plus(account.balance || '0'),
        new BigNumber(0),
    );
    const primaryNetwork = networks[primary.symbol];
    const displaySymbol = primaryNetwork?.displaySymbol ?? primary.symbol;

    const { BaseCurrencyAmountFormatter } = useFormatters();
    const formattedFiatNode = BaseCurrencyAmountFormatter({
        value: totalFiat ?? asBaseCurrencyAmount(BASE_CURRENCY_ZERO),
        currency: baseCurrency,
    });
    const formattedFiatString = formattedFiatNode?.props.children ?? '';

    return (
        <Column gap={4}>
            <HiddenPlaceholder>
                <BigAmountValue
                    formattedStringAmount={formattedFiatString}
                    size="large"
                    data-testid="@wallet/account/fiat-amount"
                />
            </HiddenPlaceholder>
            <Tooltip
                placement="bottom-start"
                content={
                    <Column gap={8}>
                        {accounts.map(account => (
                            <PerChainBreakdownRow key={account.key} account={account} />
                        ))}
                    </Column>
                }
            >
                <Row gap={6} alignItems="center">
                    <Text intent="neutral" typographyStyle="body-md" priority="secondary">
                        {totalNativeBalance.toFixed()} {displaySymbol}
                    </Text>
                    <Text intent="neutral" typographyStyle="body-sm" priority="secondary">
                        <Translation
                            id="TR_ADDRESS_BALANCE_ACROSS_CHAINS"
                            values={{ count: accounts.length }}
                        />
                    </Text>
                    <Row gap={2} alignItems="center">
                        {accounts.map(account => (
                            <NetworkIcon
                                key={account.symbol}
                                networkSymbol={account.symbol}
                                size={14}
                            />
                        ))}
                    </Row>
                </Row>
            </Tooltip>
        </Column>
    );
};

type AccountOverviewBalanceProps = {
    selectedAccount: AppState['wallet']['selectedAccount'];
};

export const AccountOverviewBalance = ({ selectedAccount }: AccountOverviewBalanceProps) => {
    const baseCurrency = useSelector(selectBaseCurrency);
    const { balanceSectionRef } = useAccountHeaderContext();
    const addressView = useSelectedAddressView();

    const { account, loader, status } = selectedAccount;

    if (status === 'exception') {
        return null;
    }

    if (status !== 'loaded' || !account) {
        return (
            <AccountOverviewBalanceSkeleton
                animate={loader === 'account-loading'}
                symbol={account?.symbol}
            />
        );
    }

    const { symbol, formattedBalance } = account;
    const shouldDisplayBaseCurrency = baseCurrency !== symbol;
    const isMainnet = !isTestnet(symbol);
    const features = getNetworkFeatures(symbol);
    const hasTokens = features.includes('tokens');
    const hasStaking = features.includes('staking');
    const balanceExcludesTranslationId = getBalanceExcludesTranslationId(hasTokens, hasStaking);

    return (
        <Row gap={16} justifyContent="space-between" alignItems="flex-end" flexWrap="wrap">
            <Column ref={balanceSectionRef}>
                {addressView?.kind === 'aggregate' ? (
                    <AggregatedBalance accounts={addressView.accounts} />
                ) : (
                    <>
                        {isMainnet && (
                            <FiatHeader
                                symbol={account.symbol}
                                amount={account.formattedBalance}
                                size="large"
                                localCurrency={baseCurrency}
                                data-testid="@wallet/account/fiat-amount"
                            />
                        )}
                        <AmountUnitSwitchWrapper symbol={symbol}>
                            {shouldDisplayBaseCurrency && (
                                <Text
                                    intent="neutral"
                                    typographyStyle="body-md"
                                    priority="secondary"
                                    as="div"
                                >
                                    <FormattedCryptoAmount
                                        data-testid="@wallet/account/crypto-balance"
                                        value={formattedBalance}
                                        symbol={symbol}
                                    />
                                </Text>
                            )}
                        </AmountUnitSwitchWrapper>
                    </>
                )}
            </Column>
            {balanceExcludesTranslationId && (
                <Row gap={4}>
                    <Icon name="info" size={16} intent="neutral" priority="secondary" />
                    <Paragraph intent="neutral" priority="secondary" typographyStyle="body-sm">
                        <Translation id={balanceExcludesTranslationId} />
                    </Paragraph>
                </Row>
            )}
        </Row>
    );
};
