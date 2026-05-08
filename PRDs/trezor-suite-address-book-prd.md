# PRD: Address Book — Trezor Suite Desktop

**Status:** Draft  
**Author:** Vlad  
**Platform:** Desktop (Electron)  
**Storage:** Local only (no sync)  
**Last updated:** 2026-05-05

---

## 1. Problem Statement

Trezor Suite users regularly send and receive crypto to/from the same counterparties — exchanges, colleagues, personal wallets, and DeFi contracts. Today, there is no way to label or save these addresses. Every transaction requires the user to manually locate the address again, increasing both cognitive load and the risk of copy-paste errors or clipboard-hijacking attacks.

A local address book removes this friction and adds a meaningful safety layer: users can verify a saved, trusted address instead of pasting a raw string from an untrusted source.

---

## 2. Goals

| Goal                                              | Metric                                               |
| ------------------------------------------------- | ---------------------------------------------------- |
| Reduce send-flow friction for repeat recipients   | Address selectable in ≤ 2 clicks from the Send modal |
| Reduce clipboard-hijack risk for known recipients | 0 raw pastes required for saved contacts             |
| Keep data fully private                           | Zero network egress; all data in local store         |
| Stay consistent with Suite's design language      | No new design tokens or component styles introduced  |

**Non-goals (v1)**

- Cloud sync or Trezor Connect integration
- Address verification / ENS resolution
- Import/export of contacts
- Shared address books across multiple accounts
- Mobile or web platform

---

## 3. User Stories

### Core flows

| ID    | As a…      | I want to…                                           | So that…                                          |
| ----- | ---------- | ---------------------------------------------------- | ------------------------------------------------- |
| US-01 | Suite user | Save a recipient address with a human-readable label | I don't have to find it again next time           |
| US-02 | Suite user | See my saved contacts when initiating a Send         | I can select instead of pasting                   |
| US-03 | Suite user | Edit a contact's label or address                    | I can correct a typo or update a changed address  |
| US-04 | Suite user | Delete a contact                                     | I can keep my book clean                          |
| US-05 | Suite user | See which network/coin a saved address belongs to    | I don't accidentally send BTC to an ETH address   |
| US-06 | Suite user | Add a contact directly from a completed transaction  | I can save the sender/recipient without re-typing |
| US-07 | Suite user | Search/filter contacts by name or address            | I can find the right one quickly when I have many |

### Edge cases

| ID    | Scenario                                                                                           |
| ----- | -------------------------------------------------------------------------------------------------- |
| US-08 | User tries to save a duplicate address — should warn, not silently block                           |
| US-09 | User saves an address then switches coin network — address should be greyed out / filtered in Send |
| US-10 | Address book is empty — show empty state with a clear CTA, not a blank panel                       |

---

## 4. Functional Specification

### 4.1 Data Model

Each address book entry is a plain object stored locally.

```typescript
// packages/suite/src/types/addressBook.ts

export interface AddressBookEntry {
    id: string; // uuid v4
    label: string; // max 50 chars, required
    address: string; // coin address string, required
    coin: NetworkSymbol; // e.g. 'btc' | 'eth' | 'sol' — ties to suite's NetworkSymbol type
    note?: string; // optional free text, max 200 chars
    createdAt: number; // unix timestamp ms
    updatedAt: number; // unix timestamp ms
}
```

**Validation rules**

- `label`: required, 1–50 chars, trimmed
- `address`: must pass coin-specific address validation (reuse existing `isAddressValid` util in `@trezor/blockchain-link-utils` or equivalent)
- `coin`: must be a valid `NetworkSymbol` present in the user's enabled networks
- `note`: optional, 0–200 chars

### 4.2 Storage

Use the existing **electron-store** mechanism already in Trezor Suite's main process for persistent local data. Do **not** introduce a new storage dependency.

```
// Suggested key path in electron-store:
// suite.addressBook[]
```

All CRUD should go through Redux actions dispatched from the renderer, with the main process persisting to disk via the existing IPC bridge (`/packages/suite-desktop/src/main/`).

**Approximate storage path reference:**

- Redux slice: `packages/suite/src/reducers/suite/addressBookReducer.ts` (new file)
- Actions: `packages/suite/src/actions/suite/addressBookActions.ts` (new file)
- Selectors: `packages/suite/src/selectors/addressBookSelectors.ts` (new file)
- IPC persistence: extend existing `db` / electron-store calls in `packages/suite-desktop/src/main/modules/`

### 4.3 Redux State Shape

```typescript
// slice shape
interface AddressBookState {
    entries: AddressBookEntry[];
    // no loading/error states needed for v1 — all ops are synchronous local writes
}
```

### 4.4 Feature Areas & UI Entry Points

#### A. Address Book Management Page

**Route:** `/address-book` (new route, add to `suite/src/router/`)

**Layout:** Sidebar nav entry under Settings or as a top-level nav item (to be decided with design — recommended: under the account sidebar, accessible globally).

**Components:**

- Contact list (virtualized if >50 entries)
- Search input (filter by label or address, client-side)
- "Add contact" button → opens AddContactModal
- Each row: label, truncated address, coin badge, edit/delete actions
- Empty state component with CTA

#### B. Add / Edit Contact Modal

**Trigger:** "Add contact" button OR "Edit" on existing row OR "Save to address book" from transaction detail

**Fields:**

- Label (text input, required)
- Address (text input, required — validate on blur)
- Network/Coin (dropdown, pre-filled when opening from Send or Tx context)
- Note (textarea, optional)

**Actions:** Save / Cancel. On save, dispatch `addAddressBookEntry` or `updateAddressBookEntry`.

**Validation:** Inline error messages. Save button disabled until form is valid.

#### C. Send Flow Integration

In the existing Send form (`packages/suite/src/views/wallet/send/`):

- Add an "Address book" icon/button adjacent to the recipient address input
- Clicking opens a **ContactPicker** dropdown/modal: searchable list of contacts filtered to the current coin/network
- Selecting a contact populates the address field and shows the contact label as a badge/hint above the field
- User can still type a raw address — the address book is additive, not gating

**Contact label hint in send form:**

```
[Label: "Bitstamp Withdrawal"] [address: 1A2b...xyz]   ← greyed badge, not editable
```

#### D. Transaction Detail — "Save to Address Book"

In the transaction detail panel (`packages/suite/src/components/wallet/TransactionDetail/`):

- Add a "Save address" affordance next to sender/recipient address
- Pre-fills Add Contact modal with the address and coin; label left blank for user input

### 4.5 Actions / Reducers

```typescript
// addressBookActions.ts
addAddressBookEntry(entry: Omit<AddressBookEntry, 'id' | 'createdAt' | 'updatedAt'>)
updateAddressBookEntry(id: string, changes: Partial<Pick<AddressBookEntry, 'label' | 'address' | 'note'>>)
deleteAddressBookEntry(id: string)
```

All actions should trigger persistence to electron-store via the existing IPC mechanism.

### 4.6 Selectors

```typescript
selectAllAddressBookEntries(state): AddressBookEntry[]
selectAddressBookEntriesByCoin(state, coin: NetworkSymbol): AddressBookEntry[]
selectAddressBookEntryByAddress(state, address: string): AddressBookEntry | undefined
```

---

## 5. Security Considerations

- **No network access.** Address book data never leaves the device. No analytics events should include contact labels or addresses.
- **Clipboard hijack mitigation.** When a user selects a contact from the address book in the Send flow, the address is injected directly into the input — no clipboard involved. This is a key security benefit to communicate in-product.
- **Address validation.** Always validate the address format against the selected coin before saving. Reuse existing Suite validation utilities; do not roll a new validator.
- **Label sanitisation.** Strip or escape any HTML/script content from labels before rendering (should be handled by React naturally, but worth an explicit note for code review).
- **No passwords or seeds are stored.** The address book contains no sensitive cryptographic material.

---

## 6. Out of Scope (Future Iterations)

| Feature                                            | Rationale for deferral                                    |
| -------------------------------------------------- | --------------------------------------------------------- |
| Import/export (CSV, JSON)                          | Adds file handling surface area; prioritise core UX first |
| Cloud sync                                         | Requires auth infrastructure and raises privacy questions |
| ENS / address resolution                           | Separate project; depends on network calls                |
| Address verification (re-confirm on Trezor device) | Valuable but complex; consider for v2                     |
| Contact photos / avatars                           | Nice-to-have, zero functional value in v1                 |
| Multi-device sharing                               | Out of scope for local-only approach                      |

---

## 7. Open Questions

| #   | Question                                                                       | Owner            | Status                                                             |
| --- | ------------------------------------------------------------------------------ | ---------------- | ------------------------------------------------------------------ |
| 1   | Should address book live in the global sidebar nav or be scoped per-account?   | Product / Design | Open                                                               |
| 2   | Do we persist address book entries per Trezor device passphrase, or globally?  | Engineering      | Open — recommend: globally (local machine), not tied to passphrase |
| 3   | What happens to saved addresses if a coin network is disabled by the user?     | Engineering      | Open — recommend: retain entry, grey out in UI                     |
| 4   | Should duplicate addresses (same address, same coin) be blocked or warned?     | Product          | Open — recommend: warn, allow override                             |
| 5   | Analytics: do we want any anonymous usage events (e.g. "address book opened")? | Product          | Open — confirm no PII logged                                       |

---

## 8. Acceptance Criteria

### US-01 — Save an address

- [ ] User can open "Add contact" from the address book page
- [ ] Form validates label (required, max 50 chars) and address (coin-valid)
- [ ] On save, entry appears in the contact list immediately
- [ ] Entry persists after app restart

### US-02 — Select from address book in Send

- [ ] Address book icon is visible in the Send recipient field
- [ ] Clicking it opens a filtered list for the current coin
- [ ] Selecting a contact populates the address field
- [ ] A label badge appears above the address field showing the contact name

### US-03 — Edit a contact

- [ ] Edit icon on each contact row opens pre-filled modal
- [ ] Saving changes updates label/address/note and `updatedAt`
- [ ] Changes persist after restart

### US-04 — Delete a contact

- [ ] Delete action shows a confirmation dialog before removing
- [ ] Deleted entry is removed from list and no longer appears in Send picker
- [ ] Deletion persists after restart

### US-05 — Coin-specific filtering

- [ ] In Send flow, only contacts matching the current coin are shown
- [ ] Coin badge is visible on each contact row in the address book page

### US-06 — Save from transaction

- [ ] "Save address" affordance exists on transaction detail
- [ ] Clicking pre-fills the Add Contact modal with address and coin

### US-07 — Search

- [ ] Search input filters by label (partial match, case-insensitive)
- [ ] Search input filters by address (partial match)
- [ ] Clearing search restores full list

### Edge cases

- [ ] Empty state renders with CTA when no contacts exist
- [ ] Saving a duplicate address shows a warning (not a silent block)
- [ ] Contacts for a disabled network are retained but greyed out in Send

---

## 9. Implementation Notes for Claude Code

- **Follow existing patterns.** Trezor Suite has established Redux Toolkit slice patterns. Model `addressBookReducer` on existing slices like `deviceReducer` or `settingsReducer`.
- **Use existing address validation.** Search for `isAddressValid` or equivalent in `@trezor/blockchain-link-utils` — do not introduce a new validation library.
- **Persistence IPC.** Look at how `suite-desktop` persists settings today (likely via `electron-store` in a main-process module). Extend that pattern rather than creating a new channel.
- **Design tokens.** Use only existing Suite design tokens — no new color/spacing values.
- **Localization.** All user-facing strings must go through Suite's existing i18n mechanism (`@suite-support/messages`). Do not hardcode English strings.
- **Tests.** Unit tests for the reducer and selectors; integration test for the Send flow contact picker at minimum.

---

_End of PRD v1.0_
