# Project PULSE — Security & Privacy Architecture

## 1. Zero-Surveillance Privacy Guarantee

Project PULSE is an activity metric platform, not employee monitoring or keystroke-logging software.

1. **No Keystrokes or Characters**: Only raw `WM_KEYDOWN` count messages are incremented. The Virtual Key codes (`VKey`), Make Codes, character conversions, and scan-codes are discarded immediately in memory.
2. **No Screen Coordinates**: The absolute cursor location `(X, Y)` on the screen is never inspected or stored. Only relative displacements `(dx, dy)` are converted into Euclidean movement distance `sqrt(dx^2 + dy^2)`.
3. **No Clipboard Capture**: Clipboard access APIs are never invoked.
4. **No Screenshots or Audio**: No graphics or capture APIs are included.

---

## 2. Windows DPAPI Credential Protection

Local authentication tokens (JWT Access Token and Refresh Token) are protected via the Windows Data Protection API (`ProtectedData.Protect`):

- **Key Derivation**: Uses the Windows user's encrypted master key tied to their Windows login profile.
- **Entropy**: Combined with application-specific entropy (`ProjectPulse_WindowsAgent_v1`).
- **Isolation**: Other Windows users or processes cannot decrypt the stored tokens.

---

## 3. Row Level Security & Service Role Safeguard

- **No Service Role Keys**: The Supabase `service_role` secret is never packaged with the desktop Agent or embedded into web dashboard bundles.
- **Strict User Isolation**: All tables implement PostgreSQL RLS enforcing `auth.uid() = user_id`.
- **Revocation Check**: The sync RPC validates that `devices.is_active = true` and `devices.revoked_at IS NULL`.
