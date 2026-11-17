# Project PULSE — Test Suite & Verification Matrix

## 1. Automated Test Execution

### Windows Agent Test Suite
Run from repository root:
```powershell
./scripts/run-tests.ps1
```
Or with .NET CLI:
```powershell
cd apps/windows-agent
dotnet test Pulse.Tests/Pulse.Tests.csproj
```

### Verified Test Cases (13 Automated Tests)
1. `RecordMouse_ShouldAccumulateAllClickTypes`: Verifies Left, Right, Middle, X1, and X2 button counting.
2. `RecordKeyboard_ShouldCountOnlyKeyDownEvents`: Verifies key-downs and repeat counting without key-up duplication.
3. `RecordScrollAndMovement_ShouldAccumulateDeltaAndDistance`: Verifies vertical/horizontal scroll delta and Euclidean pixel distance.
4. `FlushCurrentBucket_ShouldResetCountsForNextWindow`: Verifies 60-second window reset behavior.
5. `RecordInput_WhenIdle_ShouldTriggerResumeState`: Verifies transition from Idle to Active when input resumes.
6. `ThresholdProperty_ShouldEnforceMinimumSafeValue`: Verifies minimum idle threshold boundaries.
7. `SaveSummaryAsync_ShouldInsertAndRetrievePendingSummaries`: Verifies local SQLite persistence.
8. `SaveSummaryAsync_DuplicateBucket_ShouldUpdateWithoutDuplication`: Verifies batch idempotency and duplicate rejection.
9. `MarkSummariesSyncedAsync_ShouldExcludeFromPending`: Verifies synchronization queue transitions.
10. `DeviceRegistration_SaveAndRetrieve_ShouldMatch`: Verifies local device identity persistence.
11. `Settings_SaveAndRetrieve_ShouldWork`: Verifies local settings storage.
12. `ProtectAndUnprotect_ShouldMatchOriginalPlainText`: Verifies Windows DPAPI cryptographic roundtrip.
13. `Protect_EmptyString_ShouldReturnEmpty`: Verifies boundary conditions.

---

## 2. Web Dashboard Typecheck & Production Build Verification
```bash
cd apps/web
npm run typecheck
npm run build
```
Verifies zero TypeScript errors and generates all 8 static pages.
