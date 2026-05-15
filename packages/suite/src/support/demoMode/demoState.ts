import { demoAccounts } from './demoAccounts';
import { demoBlockchain } from './demoBlockchain';
import { DEMO_DEVICE_ID } from './demoConstants';
import { demoDevice } from './demoDevice';
import { demoDiscovery } from './demoDiscovery';
import { demoFiatCurrent, demoFiatLastWeek } from './demoFiatRates';
import { demoGraphData } from './demoGraph';
import { demoTransactions } from './demoTransactions';

// Composed state patch consumed by initStore's `statePatch` option. Uses dot
// notation keys per mergeDeepObject's `dotNotation` mode so each slice gets a
// surgical merge rather than a full overwrite.
export const demoStatePatch: Record<string, unknown> = {
    'device.devices': [demoDevice],
    'device.selectedDevice': demoDevice,
    // Pre-dismiss the firmware-authenticity prompt — otherwise on first boot
    // we hit "Let's check your device", clicking Start dispatches a real
    // TrezorConnect call which fails ("Device not found").
    'device.dismissedSecurityChecks': { firmwareAuthenticity: [DEMO_DEVICE_ID] },
    // `initialRun: false` short-circuits the SecurityCheck onboarding step
    // that runs at /start for fresh installs. Other flags here just close
    // some promo banners so the demo looks cleaner.
    'flags.initialRun': false,
    'flags.securityStepsHidden': true,
    'wallet.accounts': demoAccounts,
    // selectAllAccountsToList filters accounts by enabledNetworks (default = []).
    // Without this our seeded accounts are present but invisible everywhere.
    'wallet.settings.enabledNetworks': ['eth', 'op', 'arb', 'base', 'pol', 'btc', 'sol'],
    'wallet.discovery': demoDiscovery,
    'wallet.fiat.current': demoFiatCurrent,
    'wallet.fiat.lastWeek': demoFiatLastWeek,
    'wallet.transactions.transactions': demoTransactions,
    'wallet.blockchain': demoBlockchain,
    // 6 monthly samples per account, ending at "now". The dashboard graph
    // aggregates these across accounts to draw the portfolio history line.
    'wallet.graph.data': demoGraphData,
};
