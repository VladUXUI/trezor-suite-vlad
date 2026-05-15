// Demo mode constants used to fabricate a fake "connected" Trezor and the accounts
// hanging off it. None of these strings touch real wallet data — this whole branch
// is for the Vercel preview demo.

export const DEMO_DEVICE_ID = 'demo-device-id';
export const DEMO_DEVICE_STATE = `state@${DEMO_DEVICE_ID}:1`;
export const DEMO_DEVICE_PATH = 'demo-1';
export const DEMO_DEVICE_LABEL = "Vlad's Trezor";

// Each EVM "address" is a unique descriptor; all sub-accounts under the same
// descriptor (eth/op/arb/...) get grouped together on /all-accounts.
export const DEMO_EVM_DESCRIPTOR_1 = '0xDe11069A55005Ea5005ea5005EA5005Ea5005EA5';
export const DEMO_EVM_DESCRIPTOR_2 = '0xCa11ED0DDeE5C0Ca11Ed0DdEE5c0CA11ED0DDeE5';
export const DEMO_EVM_DESCRIPTOR_3 = '0xB01dC0FfEe5C0FfEe5C0FfEe5C0FfEe5C0FfEe5C';

/** @deprecated use DEMO_EVM_DESCRIPTOR_1 — kept temporarily for back-compat imports */
export const DEMO_EVM_DESCRIPTOR = DEMO_EVM_DESCRIPTOR_1;

// BTC keeps its own descriptor (different address format anyway).
export const DEMO_BTC_DESCRIPTOR = 'bc1qdemozx7g2tgmu6r5x83a8m6m3pq5p2u4xvxhcg';

// Solana — different address family, not multichain.
export const DEMO_SOL_DESCRIPTOR = '7EYnhQoR9YM3N7UoaKRoA44Uy8JeaZV3qyouov87awMs';
