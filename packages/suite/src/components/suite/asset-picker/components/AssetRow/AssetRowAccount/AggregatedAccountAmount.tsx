import { useFormatters } from '@suite-common/formatters';
import { selectBaseCurrency, selectCurrentFiatRates } from '@suite-common/wallet-core';
import { type Account, asBaseCurrencyAmount } from '@suite-common/wallet-types';
import { getAccountFiatBalance } from '@suite-common/wallet-utils';
import { Column, Text } from '@trezor/components';

import { HiddenPlaceholder } from 'src/components/suite/HiddenPlaceholder';
import { useSelector } from 'src/hooks/suite';

interface AggregatedAccountAmountProps {
    accounts: Account[];
}

export function AggregatedAccountAmount({ accounts }: AggregatedAccountAmountProps) {
    const baseCurrencyCode = useSelector(selectBaseCurrency);
    const rates = useSelector(selectCurrentFiatRates);
    const { BaseCurrencyAmountFormatter } = useFormatters();

    const totalFiat = accounts.reduce<ReturnType<typeof getAccountFiatBalance>>((sum, account) => {
        const fiat = getAccountFiatBalance({
            account,
            baseCurrencyCode,
            rates,
            shouldIncludeTokens: true,
            shouldIncludeStaking: true,
        });
        if (!fiat) return sum;

        return sum ? asBaseCurrencyAmount(sum.plus(fiat)) : fiat;
    }, null);

    if (!totalFiat) return null;

    return (
        <HiddenPlaceholder>
            <Column alignItems="flex-end">
                <Text intent="neutral" priority="secondary" typographyStyle="body-sm">
                    <BaseCurrencyAmountFormatter
                        currency={baseCurrencyCode.toUpperCase()}
                        value={totalFiat}
                    />
                </Text>
            </Column>
        </HiddenPlaceholder>
    );
}
