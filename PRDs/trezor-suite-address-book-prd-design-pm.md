# Address Book — Product & Design Brief

### Trezor Suite Desktop · v1.0 Draft

**Status:** Draft  
**Author:** Vlad  
**Audience:** Product Managers, Designers  
**Platform:** Desktop (Electron)  
**Last updated:** 2026-05-05

---

## 1. Why We're Building This

### The problem in plain language

Every time a Trezor user sends crypto to someone they've sent to before — their exchange withdrawal address, a colleague's wallet, their own cold storage — they have to find that address again from scratch. There's nowhere to save it in Suite.

This creates two real costs:

**Friction.** Users dig through emails, notes apps, or browser history to retrieve an address they've already used. For power users transacting weekly, this compounds fast.

**Risk.** The most dangerous moment in a crypto transaction is when an address is on the clipboard. Clipboard-hijacking malware silently replaces copied addresses. A user who could select a pre-saved, trusted address instead of pasting would bypass this attack entirely — but today there's no mechanism to do that.

### Who this is for

**Primary user:** The self-custodian who transacts regularly — weekly or more — to a fixed set of destinations. They know what they're doing; they just want less friction and more confidence.

**Secondary user:** The cautious holder who sends infrequently but wants to verify they're sending to the right place every time. For them, a saved label ("My Ledger backup", "Bitstamp withdrawal") provides peace of mind.

---

## 2. Goals & Success Metrics

| Goal                                            | How we measure it                                                    |
| ----------------------------------------------- | -------------------------------------------------------------------- |
| Reduce send-flow friction for repeat recipients | Address selectable in ≤ 2 interactions from Send form                |
| Increase user confidence at point of send       | Qualitative: usability testing; 0 "wrong address" errors in sessions |
| Keep data private by default                    | No data leaves the device; verified in security review               |
| Fit naturally into existing Suite UX            | No new nav patterns or design tokens introduced                      |

---

## 3. User Flows

### Flow 1 — Add a contact (standalone)

```
Address Book page → [+ Add contact] → Add Contact modal →
Fill label + address + coin → [Save] → Contact appears in list
```

### Flow 2 — Add a contact from a transaction

```
Transaction detail panel → [Save address] → Add Contact modal
(address + coin pre-filled) → User adds label → [Save]
```

### Flow 3 — Use address book in Send

```
Send form → recipient field → [Address book icon] →
Contact Picker overlay → Search / browse → Select contact →
Address populates field + label badge appears → Continue send
```

### Flow 4 — Edit a contact

```
Address Book page → contact row → [Edit] →
Edit Contact modal (pre-filled) → Make changes → [Save]
```

### Flow 5 — Delete a contact

```
Address Book page → contact row → [Delete] →
Confirmation dialog → [Confirm] → Contact removed
```

---

## 4. Screen-by-Screen Breakdown

---

### Screen 1 — Address Book Page (empty state)

**When shown:** User navigates to Address Book for the first time, or after deleting all contacts.

**Layout:**

- Page title: "Address Book"
- Centered empty state illustration (use existing Suite empty state pattern)
- Headline: "No saved addresses yet"
- Body: "Save addresses you send to often. Select them instantly in the Send form — no copy-pasting needed."
- Primary CTA button: "Add your first contact"

**Design notes:**

- Empty state should feel encouraging, not like an error
- Do not show the search bar or table header in empty state — they're meaningless with no data
- Illustration: consider a simple address card / contact icon consistent with Suite's icon style

---

### Screen 2 — Address Book Page (populated)

**When shown:** User has ≥1 saved contact.

**Layout — top bar:**

- Page title: "Address Book" (left)
- Search input: placeholder "Search by name or address" (centre or right, TBD with design)
- "+ Add contact" button (right, primary)

**Layout — contact list:**

Each row contains:

| Element          | Detail                                                                              |
| ---------------- | ----------------------------------------------------------------------------------- |
| Avatar / initial | Single letter from label, coloured circle — consistent with Suite's account avatars |
| Label            | Full label text, semibold, truncated at ~30 chars with ellipsis                     |
| Address          | Monospace, truncated: first 8 … last 6 chars                                        |
| Coin badge       | Coin symbol pill (e.g. "BTC", "ETH") using existing Suite network badge component   |
| Edit icon        | Pencil icon, visible on row hover                                                   |
| Delete icon      | Trash icon, visible on row hover, destructive colour on hover                       |

**Interaction states:**

- Row hover: subtle background tint (Suite's standard hover), reveal edit/delete icons
- Row focus (keyboard nav): Suite's standard focus ring

**Sorting:** Default sort is `createdAt` descending (newest first). No sort controls in v1.

**Search behaviour:**

- Filters in real-time as user types
- Matches against label (partial, case-insensitive) and address (partial)
- If no results: inline empty state "No contacts match '[query]'" — do not show the full empty state CTA

**Pagination / scroll:** Virtualised list if >50 entries. No pagination UI; continuous scroll.

---

### Screen 3 — Add Contact Modal

**Trigger:** "+ Add contact" button on Address Book page.

**Modal size:** Medium — consistent with Suite's existing modal widths (approx 480px).

**Header:** "Add contact"

**Fields (top to bottom):**

**1. Label** _(required)_

- Input type: text
- Placeholder: "e.g. Bitstamp withdrawal, Alice's wallet"
- Max: 50 characters
- Character counter shown when within 10 chars of limit
- Error state: "Label is required" / "Maximum 50 characters"

**2. Network** _(required)_

- Input type: dropdown / select
- Options: user's currently enabled networks in Suite
- Placeholder: "Select network"
- Pre-filled when modal opened from Send or Tx context
- Error state: "Please select a network"

**3. Address** _(required)_

- Input type: text, monospace font
- Placeholder: "Paste or type an address"
- Validation: triggered on blur, validated against selected network's address format
- If Network not yet selected and user enters address: show "Select a network first to validate this address"
- Error states:
    - "Address is required"
    - "This doesn't look like a valid [coin] address" (coin name dynamically inserted)
    - "This address is already saved as '[label]'" (duplicate warning — not a hard block; user can still save)

**4. Note** _(optional)_

- Input type: textarea
- Placeholder: "Add a note (optional)"
- Max: 200 characters
- Character counter shown when within 20 chars of limit
- Label: "Note" with "(optional)" in muted text alongside

**Footer actions:**

- Left: "Cancel" (ghost/text button)
- Right: "Save contact" (primary button, disabled until form is valid)

**Design notes:**

- Field order matters: Label → Network → Address. Network must come before Address so validation has context.
- The duplicate address warning should appear inline below the Address field, not as a modal blocker. User should be able to dismiss and save anyway (some users legitimately label the same address multiple ways).
- Do not auto-close modal on save — show a brief success state (checkmark animation, "Contact saved") then close after ~1s. Avoids jarring instant dismissal.

---

### Screen 4 — Edit Contact Modal

**Trigger:** Edit icon on a contact row.

**Identical to Add Contact Modal with these differences:**

- Header: "Edit contact"
- All fields pre-filled with existing values
- Save button label: "Save changes"
- No duplicate warning for the address currently saved to this contact (only warn if address is changed to match a _different_ existing contact)
- Destructive option: small "Delete contact" text link in the modal footer (left side), so users can delete from within edit without going back to the list

---

### Screen 5 — Delete Confirmation Dialog

**Trigger:** Delete icon on contact row, or "Delete contact" link in Edit modal.

**Type:** Confirmation dialog (not a full modal — use Suite's existing confirmation dialog pattern).

**Content:**

- Title: "Delete contact?"
- Body: "**[Label]** will be removed from your address book. This can't be undone."
    - Label shown in bold for clarity
- Actions:
    - "Cancel" (secondary)
    - "Delete" (destructive/danger button)

**Design notes:**

- Deletion is immediate on confirm — no undo toast in v1 (can reconsider in v2)
- Focus should land on "Cancel" by default (safe default for destructive actions)

---

### Screen 6 — Contact Picker (Send Flow)

**Trigger:** Address book icon button adjacent to the recipient address input in the Send form.

**Presentation:** Inline dropdown anchored to the recipient field (not a full modal — keep the Send form visible and in context).

**Layout:**

- Search input at top of dropdown: "Search contacts"
- Filtered list below: shows only contacts matching the current Send coin/network
    - Each row: label (semibold) + truncated address (monospace, muted)
    - Coin badge not needed here — already filtered to current network
- If no contacts for this network: "No saved [coin] addresses. [+ Add one]" — link opens Add Contact modal with Network pre-filled

**Interaction:**

- Click a contact → populates recipient address field, closes picker
- Keyboard: arrow keys to navigate, Enter to select, Escape to close
- Clicking outside the dropdown closes it without selecting

**After selection — Send form state:**

- Recipient address field: populated with the full address (editable — user can still override)
- Contact label badge: appears above or below the address field, muted style
    - "Saved as: Bitstamp withdrawal" with a small contact icon
    - If user manually edits the address after selecting, badge disappears

**Design notes:**

- The picker should feel like a lightweight typeahead, not a heavy modal. Keep it fast and dismissible.
- If the user has 0 contacts saved at all: show the empty CTA inline in the picker ("Save addresses to find them here")
- Do not replace the address input — augment it. The user must always be able to type a raw address.

---

### Screen 7 — Transaction Detail: Save Address Affordance

**Location:** Transaction detail panel, next to sender or recipient address display.

**Presentation:** Small "Save" or bookmark icon button inline with the address. Tooltip on hover: "Save to address book".

**States:**

- Default: unselected icon (address not yet saved)
- Already saved: filled/active icon variant. Tooltip: "Saved as '[label]'" — clicking opens Edit modal

**On click (unsaved):** Opens Add Contact modal with:

- Address pre-filled (locked, not editable in this context — address comes from the transaction record)
- Network pre-filled
- Label empty, cursor focused in label field

**Design notes:**

- The save icon should be subtle — this is a secondary action in a detail panel. Do not make it a full button.
- "Already saved" state is important UX feedback — prevents users from wondering if they saved it or not.

---

## 5. Component Inventory

These are the net-new components needed. Where a Suite equivalent exists, extend rather than create.

| Component                   | Status          | Notes                                   |
| --------------------------- | --------------- | --------------------------------------- |
| `AddressBookPage`           | New             | Container + list + search               |
| `ContactRow`                | New             | Single row in the list                  |
| `AddContactModal`           | New             | Shared for Add + Edit (mode prop)       |
| `DeleteConfirmDialog`       | Extend existing | Use Suite's confirmation dialog base    |
| `ContactPicker`             | New             | Dropdown for Send flow                  |
| `ContactLabelBadge`         | New             | Label hint in Send form after selection |
| `SaveAddressTrigger`        | New             | Icon button in transaction detail       |
| `EmptyState (address book)` | Extend existing | Use Suite's empty state component       |

---

## 6. Copy & Tone

Trezor Suite's voice is calm, precise, and security-aware — never alarmist, never casual to the point of flippancy. For the address book:

- Use "contact" not "recipient" (more neutral, covers both send and receive)
- Use "address" not "wallet" (a wallet contains many addresses)
- On security-adjacent copy (e.g. Send flow badge): lead with confidence, not warning — "Sending to: Bitstamp withdrawal" not "Warning: verify this address"
- Empty states: warm and instructional, not apologetic

**Key strings to align on (subject to i18n):**

| Context                             | String                                                                                             |
| ----------------------------------- | -------------------------------------------------------------------------------------------------- |
| Page title                          | Address Book                                                                                       |
| Add button                          | Add contact                                                                                        |
| Empty state headline                | No saved addresses yet                                                                             |
| Empty state body                    | Save addresses you send to often. Select them instantly in the Send form — no copy-pasting needed. |
| Picker empty (no contacts for coin) | No saved [coin] addresses                                                                          |
| Send form badge                     | Saved as: [label]                                                                                  |
| Already saved tooltip               | Saved as '[label]'                                                                                 |
| Duplicate address warning           | This address is already saved as '[label]'                                                         |
| Delete dialog title                 | Delete contact?                                                                                    |
| Delete dialog body                  | **[label]** will be removed from your address book. This can't be undone.                          |

---

## 7. Open Questions for PM & Design

| #   | Question                                                                                                                            | Recommended default                                                   | Decision needed by    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | --------------------- |
| 1   | Where does Address Book live in the nav? Global sidebar, or under Settings?                                                         | Global sidebar — this is a transactional tool, not a setting          | Before design kickoff |
| 2   | Is address book global (all coins) or per-account?                                                                                  | Global, filtered by coin in context                                   | Before design kickoff |
| 3   | Does saving an address require the user to verify it on the Trezor device?                                                          | No for v1 — adds friction without a clear security gain at this stage | Before spec lock      |
| 4   | Should the coin badge in the contact list be interactive (click to filter by coin)?                                                 | Nice-to-have; defer to v2                                             | v2 planning           |
| 5   | Undo on delete — toast with undo action?                                                                                            | Defer to v2; confirm in v1 dialog is sufficient                       | v2 planning           |
| 6   | Should the Send form show a warning if the user types an address that matches a saved contact but hasn't selected it from the book? | Yes — low-effort recognition win                                      | Before design kickoff |

---

## 8. What's Not in v1

| Feature                                                     | Why deferred                                                 |
| ----------------------------------------------------------- | ------------------------------------------------------------ |
| Import / export contacts                                    | File handling adds surface area; nail the core first         |
| Cloud sync                                                  | Raises privacy questions; local-only is the right v1 default |
| ENS / domain name resolution                                | Separate system; requires network calls                      |
| Re-verify address on Trezor device when selecting from book | Valuable but adds friction; revisit in v2                    |
| Contact photos                                              | No functional value in v1                                    |
| Bulk delete                                                 | Edge case; can add in v2                                     |
| Sort / filter controls                                      | Default (newest first) is sufficient for v1                  |

---

## 9. Figma Deliverables Checklist

- [ ] Component library additions (see Section 5)
- [ ] Address Book page — empty state
- [ ] Address Book page — populated (with hover states)
- [ ] Add Contact modal — all field states (default, focus, error, character limit, duplicate warning)
- [ ] Edit Contact modal
- [ ] Delete confirmation dialog
- [ ] Contact Picker — closed state / open state / empty state / selected state
- [ ] Send form — with contact selected (label badge visible)
- [ ] Transaction detail — save icon (default / saved states)
- [ ] Responsive: Desktop only (1280px minimum width baseline)

---

_End of Design & PM Brief v1.0_
