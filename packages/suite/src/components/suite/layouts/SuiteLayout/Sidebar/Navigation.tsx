import { type FC, useMemo } from 'react';

import { selectIsInitialRun } from '@suite/flags';
import { type Route } from '@suite/router';
import { selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import { Column } from '@trezor/components';

import { useSelector } from 'src/hooks/suite';
import { useResponsiveContext } from 'src/support/suite/ResponsiveContext';

import { NavigationItem, type NavigationItemProps } from './NavigationItem';
import { NotificationDropdown } from './NotificationDropdown';

export const SETTINGS_ROUTES: Route['name'][] = [
    'settings-index',
    'settings-device',
    'settings-coins',
    'settings-debug',
    'settings-connected-apps',
    'settings-address-book',
] as const;

export const WALLET_ROUTES: Route['name'][] = [
    'wallet-index',
    'wallet-send',
    'wallet-receive',
    'wallet-staking',
    'wallet-tokens',
    'wallet-tokens-hidden',
    'wallet-tokens-inactive',
    'wallet-tokens-defi',
    'wallet-nfts',
    'wallet-nfts-hidden',
    'wallet-details',
    'wallet-sign-verify',
    'wallet-anonymize',
    'wallet-trading-buy',
    'wallet-trading-buy-offers',
    'wallet-trading-buy-detail',
    'wallet-trading-buy-confirm',
    'wallet-trading-sell',
    'wallet-trading-sell-offers',
    'wallet-trading-sell-detail',
    'wallet-trading-sell-confirm',
    'wallet-trading-exchange',
    'wallet-trading-exchange-offers',
    'wallet-trading-exchange-detail',
    'wallet-trading-exchange-confirm',
    'wallet-trading-redirect',
    'wallet-trading-transactions',
    'wallet-trading-concierge',
] as const;

type NavigationProps = {
    children?: React.ReactNode;
};

export const Navigation = ({ children }: NavigationProps) => {
    const { isSidebarCollapsed } = useResponsiveContext();

    const isInitialRun = useSelector(selectIsInitialRun);
    const startRoute: Route['name'] = isInitialRun ? 'suite-start' : 'suite-index';

    const isBtcOnly = useSelector(selectHasBitcoinOnlyFirmware);

    const navItems: Array<NavigationItemProps & { CustomComponent?: FC<NavigationItemProps> }> =
        useMemo(
            () => [
                {
                    nameId: 'TR_DASHBOARD',
                    icon: 'house',
                    goToRoute: startRoute,
                    routes: [startRoute],
                },
                {
                    nameId: 'TR_WALLET',
                    icon: 'wallet',
                    goToRoute: 'suite-accounts',
                    routes: ['suite-accounts', ...WALLET_ROUTES],
                },
                ...(!isBtcOnly
                    ? [
                          {
                              nameId: 'TR_EARN',
                              icon: 'piggyBank',
                              goToRoute: 'suite-earn',
                              routes: ['suite-earn', 'earn-supply', 'earn-withdraw', 'earn-claim'],
                          } as NavigationItemProps,
                      ]
                    : []),
                {
                    nameId: 'TR_NOTIFICATIONS',
                    icon: 'bell',
                    CustomComponent: NotificationDropdown,
                },
                {
                    nameId: 'TR_SETTINGS',
                    icon: 'gearSix',
                    goToRoute: 'settings-index',
                    routes: SETTINGS_ROUTES,
                    'data-testid': '@suite/menu/settings',
                },
            ],
            [startRoute, isBtcOnly],
        );

    return (
        <Column alignItems={isSidebarCollapsed ? 'center' : 'stretch'} gap={4} margin={8} as="nav">
            {children ?? null}
            {navItems.map(item => {
                const Component = item.CustomComponent ? item.CustomComponent : NavigationItem;

                return <Component key={item.nameId} {...item} />;
            })}
        </Column>
    );
};
