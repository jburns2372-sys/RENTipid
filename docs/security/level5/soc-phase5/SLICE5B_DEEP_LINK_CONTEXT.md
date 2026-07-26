# SOC Phase 5 - Slice 5B: Deep-Linkable Investigation Context

## 1. Description
Added deep-linkable investigation context to the Behavioral Risk Investigation dashboard, allowing authorized users to safely share and bookmark specific investigation states.

## 2. Technical Implementation
- **Server Validation**: The server page (`page.tsx`) extracts and rigorously validates `searchParams` (`subjectRef`, `environment`, `lifecycle`, `limit`, and `assessmentId`) against explicit allowlists and bounds before passing them to the client as an `initialContext` object.
- **Client Hydration**: The client component (`behavioral-risk-investigation-client.tsx`) uses `initialContext` to pre-fill search controls. 
- **Single Initial Load**: If a valid `subjectRef`, `environment`, and `lifecycle` are provided, the client performs exactly one initial fetch to load the investigation context. If `assessmentId` is present, it fetches the assessment details without polling.
- **History Synchronization**: Manual searches, assessment selections, and clear actions are synced directly to the browser's URL using `window.history.replaceState` for bookmarkability, ensuring sensitive response fields like `score` and `rawEventMetadata` are kept entirely out of the URL.
- **No Polling**: No automated polling was introduced. Data is loaded strictly on demand or once upon hydration with sufficient context.

## 3. Test Coverage (20 Total Dashboard Tests)
Added 9 specific Deep-Linked Context tests targeting:
- `S5B.1`: Valid initial URL context prefills controls and performs one initial load.
- `S5B.2`: Incomplete context does not fetch.
- `S5B.3`: Invalid environment/lifecycle is safely ignored and limit bounded on server.
- `S5B.4`: Initial assessmentId loads details.
- `S5B.5`: Manual search updates URL with sanitized values, no sensitive response fields.
- `S5B.6`: Assessment selection updates assessmentId.
- `S5B.7`: Clear removes investigation parameters.
- `S5B.8`: Stale initial response cannot overwrite a newer manual search.
- `S5B.9`: Server page enforces authorization independently of initial context.

All 20 tests pass successfully.

## 4. Integrity and Boundaries
- Existing permissions, routing, persistence, and scoring mechanisms were untouched.
- No automatic polling was introduced.
- Strict Next.js `searchParams` parsing compatibility was maintained (handling `Promise` behavior in Next 15+).
