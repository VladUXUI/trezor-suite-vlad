import styled from 'styled-components';

import { type Account } from '@suite-common/wallet-types';
import { Row } from '@trezor/components';
import { AssetLogo } from '@trezor/product-components';
import { borders, spacingsPx, typography } from '@trezor/theme';

const OverlapIcons = styled.div`
    display: flex;
    align-items: center;
`;

const OverlapIcon = styled.div<{ $size: number }>`
    border-radius: ${borders.radii.full};
    width: ${({ $size }) => $size}px;
    height: ${({ $size }) => $size}px;
    flex-shrink: 0;

    &:not(:first-child) {
        margin-left: -8px;
        mask: radial-gradient(
            circle at calc(50% - 14px) 50%,
            transparent calc(${({ $size }) => $size / 2}px + 1px),
            black calc(${({ $size }) => $size / 2}px + 1px)
        );
    }
`;

const ExtraCountPill = styled.div`
    margin-left: ${spacingsPx.xs};
    padding: 2px 8px;
    border-radius: ${borders.radii.full};
    border: 1px solid ${({ theme }) => theme.borderNeutral};
    background: ${({ theme }) => theme.legacyBackgroundTertiaryDefaultOnElevationNegative};
    ${typography['body-xs']}
    color: ${({ theme }) => theme.contentSecondary};
    white-space: nowrap;
    flex-shrink: 0;
`;

const MAX_TOKEN_ICONS = 5;
const TOKEN_ICON_SIZE = 24;

export type TokenStripItem = {
    contract: string;
    symbol?: string;
    networkSymbol: Account['symbol'];
};

export const TokenStrip = ({ allTokens }: { allTokens: TokenStripItem[] }) => {
    if (allTokens.length === 0) return null;

    const visible = allTokens.slice(0, MAX_TOKEN_ICONS);
    const extra = allTokens.length - MAX_TOKEN_ICONS;

    return (
        <Row gap={0} alignItems="center">
            <OverlapIcons>
                {visible.map(token => (
                    <OverlapIcon
                        key={`${token.networkSymbol}:${token.contract}`}
                        $size={TOKEN_ICON_SIZE}
                    >
                        <AssetLogo
                            size={TOKEN_ICON_SIZE}
                            symbol={token.networkSymbol}
                            contractAddress={token.contract}
                            placeholder={token.symbol ?? ''}
                            placeholderWithTooltip={false}
                        />
                    </OverlapIcon>
                ))}
            </OverlapIcons>
            {extra > 0 && <ExtraCountPill>+{extra}</ExtraCountPill>}
        </Row>
    );
};
