# Backend API services

Base URL: `https://ai-rise.onrender.com/api`. Override with `EXPO_PUBLIC_API_URL` in `.env.local`.
The live backend was not contacted, at the user's request.

## Structure and use

- `src/api/api.ts`: shared Axios client, bearer authentication, 20-second timeout, 401 callback, readable error helper, and multipart handling.
- `src/api/tokenStorage.ts`: SecureStore on native; memory-only tokens on web.
- `src/utils/config.ts`: URL and token keys.
- `src/types/`: API request/response types.
- `src/services/`: `authService`, `passengerService`, `driverService`, `rescueService`, `communityReportService`, `dashboardService`, and `reportingService`.

Services follow `const response = await api.get<Type>(route); return response.data;`.
They propagate errors so screens can handle them with `try/catch` and `getApiErrorMessage(error)`.
Do not call service functions during render. Disable submit buttons while awaiting mutations.
Register `setUnauthorizedCallback` from the session owner, clear its user data on logout, and unregister on unmount.

Screens/session still use local mock data. Services are prepared separately and are not called by the reporting screens.
The Report tab now offers Request Help, Request Supplies, and Report Community Issue. Existing home SOS remains available.
No route migration is included.

## Authentication

Login uses `authService.login({ username, password })`. Tokens are saved automatically.
Refresh uses `authService.refreshToken()` and saves the rotated refresh token when returned.
The client follows the requested 401 logout flow; it does not automatically refresh or retry requests.
`authService.logout()` deletes local tokens. Server revocation is not available.
Role mapping is exported as `ROLE_MAP`: resident -> passenger, volunteer -> driver.
Account and profile IDs are Django User IDs. The selected UI role is not proof of the authenticated role; verify the returned JWT/profile before entering role-specific screens.

## Existing routes

All paths below are relative to `/api`. Preserve trailing slashes.

| Service | Routes |
| --- | --- |
| authService | POST `/token/`, POST `/token/refresh/` |
| passengerService | GET/POST `/passenger/`, GET/PATCH/DELETE `/passenger/{userId}/` |
| driverService | GET/POST `/driver/`, GET/PATCH/DELETE `/driver/{userId}/`, PATCH `/drivers/{userId}/approve/` |
| rescueService | GET/POST `/rescue/markers/`, GET/PATCH/DELETE `/rescue/markers/{id}/`, GET `/rescue/my-rescues/`, GET `/rescue/assigned-rescues/`, POST `/rescue/markers/{id}/assign-rescuer/`, POST `/rescue/markers/{id}/complete-rescue/`, GET `/rescue/available-drivers/` |
| communityReportService | GET/POST `/community/reports/`, GET/PATCH/DELETE `/community/reports/{id}/`, POST `verify/`, `reject/`, `mark-duplicate/`, `resolve/` below each report |
| dashboardService | GET `/dashboard/barangays/`, `/dashboard/barangays/geojson/`, `/dashboard/predict/{barangay}/`, `/dashboard/predict/`, `/dashboard/predict/by-location/`, `/dashboard/admin/rescue-priority/`, `/dashboard/weekly-flood-insights/` |

Registration, login, refresh, and public dashboard requests omit stored bearer tokens.
Protected requests attach them. Approval/moderation methods are for authorized admin flows, not resident/volunteer controls.
List types reflect the ZIP's unpaginated settings. If deployment enables pagination, update the response contracts before using them.

## Uploads and coordinates

Use nested JSON for registrations without images. For images use FormData with keys such as `driver_profile.vehicle_front_picture` or `passenger_profile.profile_picture`. Rescue images use `evidence`; report images use `image`.
Native FormData needs the original image URI, name, and MIME type. Browser FormData needs a File/Blob. The client removes the JSON content type for FormData.
Profile/rescue coordinates use `{ lat, lng }`. Available drivers and priority results instead use `{ latitude, longitude }`.
Do not assume a selected category means one person; rescue APIs require actual counts (`childrens`, `elderly`, `pwd`, `adults`).

## Backend fixes required

Source references refer to files inside the supplied backend.zip. These are source findings, not live test results.

1. **Registration email/names** — `api/user/serializers.py`: UserSerializer.create indexes `validated_data['email']`, but the enclosing passenger/driver serializers omit email. Define a consistent contract and preserve first/last names.
2. **Rescue serializer assertion** — `api/rescue/serializers.py`: remove redundant `source='location'` from the `location` field.
3. **Rescue edits rejected** — the same serializer checks for an active rescue even on updates, so editing one's active request fails. Exclude the current instance on update.
4. **Geographic SRID** — `api/utils/location.py`: explicitly create Points with SRID 4326; validate finite values and latitude/longitude ranges.
5. **Multipart coordinates** — reconstruct_nested only handles one nesting level; serialized driver coordinates arrive as a string and PointField rejects them. Parse multipart location JSON or define a supported flat coordinate contract.
6. **Report location** — `api/reports/serializers.py` exposes coordinates as read-only; views never save location. Add writable coordinates and resolve the barangay.
7. **Object ownership** — profile, marker, and report viewsets expose unrestricted authenticated querysets. Restrict reads/updates/deletes to permitted owners/admins.
8. **Admin permissions** — assignment, report moderation, and the admin priority dashboard lack appropriate role checks. Approval already checks the Admin profile.
9. **Availability** — DriverProfileSerializer makes is_available read-only. Add an authorized availability endpoint with active-assignment safeguards. Invalidate cached driver profiles on assignment/completion too.
10. **Rescue timestamps** — Marker has created_at but MarkerSerializer omits it. Include it for the resident timeline.
11. **Barangay display names** — Barangay lacks a name-returning __str__; StringRelatedField can return 'Barangay object (...)'. Serialize the name explicitly.
12. **GEMINI_AI_KEY** — api/utils/generate.py requires it at import time, but .env.example omits it. Provide the environment setting and avoid making every API depend on optional insight credentials at startup.
13. **Spatial database** — use PostGIS or another supported spatial backend; ordinary SQLite/PostgreSQL fallbacks do not support these geographic models.
14. **Startup ordering** — backend/asgi.py imports JWT middleware and Django models before setting DJANGO_SETTINGS_MODULE and calling get_asgi_application. Initialize Django before those imports.
15. **Production configuration** — DEBUG is hard-coded True; configure allowed hosts, PORT, media hosting, and production ASGI startup. Replace hard-coded seeded administrator credentials before deployment.
16. **WebSocket events** — the consumer sends only a greeting. Add authorized assignment/status broadcasts; authenticate before joining groups.
17. **Testing** — api/tests.py is empty. Add registration, ownership, assignment concurrency, completion, upload, and error-path tests.

## Missing functionality for current mockup

- Guest SOS and secure guest request tracking.
- Volunteer acceptance/rejection, reassignment, and available-request feed (current backend auto-assigns nearest approved available driver).
- On-the-way, arrived, rescuing, and completion timestamps; the backend currently only stores need_rescue/rescued plus rescuer.
- Safety check-in, undo, emergency-contact sharing and delivery acknowledgments.
- Volunteer availability control.
- Vehicle type/capacity and volunteers without vehicles (vehicle_plate currently required/unique).
- Emergency nature, follow-up answers, pregnancy, and road/boat/air access information.
- Rescue ETA, travel distance, and responder contact details for passenger tracking.
- Volunteer issue reporting and team broadcasts.
- Completed deployment history/counts; assigned-rescues returns active assignments only.
- Relief-delivery missions, briefings, equipment/team tags, and outcomes.
- Personal notification feed and real-time/push status updates.
- User-specific report history/filter; current endpoint lists everyone’s reports.
- Official alerts, typhoon signals, river level, and a current-weather response for the home cards (predictions are not sensor readings).
- Logout/revocation and password recovery.
- Passenger barangay/profile fields required by the UI but not present in the backend contract.
- Priority labels/scores exposed in resident/driver rescue responses (currently score is only in the priority dashboard).

## Reporting mockup and API readiness

The Report tab has three options using the existing app styling and tab navigation:

- **Report Community Issue:** four steps (hazard type, description/photo, location, review). Saves to the local report list. Community reporting retains its resident sign-in gate.
- **Request Help:** three steps (people/extra care, emergency details, review), with a confirmed mock location pin on review. Saves to the local SOS list, with headcount/details visible in Status. Like the existing SOS demo, it is available to guests; the actual backend requires authentication.
- **Request Supplies:** six guided steps (supply types, household counts, flood/medical needs, mock delivery pin/contact, optional photo, review), followed by an animated local confirmation screen. Saves to a separate supply list in Status. No delivery is simulated or automatically marked complete.
- **Scan with AI:** cancellable simulated progress overlay and an explicitly labeled sample flood suggestion. It does not analyze photos or contact an AI service. Timers are cleaned up on cancellation/unmount.

`reportingService.ts` follows the shared Axios service-object format. It prepares only routes confirmed in the ZIP and is not imported by these screens:

All three forms share scoped controls in `src/components/reporting/ReportFormUI.tsx`: blue actions and selections, white cards, soft blue highlights, focused input borders, common step progress, accessible error messages, and loading states. Each step resets scroll position and retains parent-owned answers. Step changes dismiss the keyboard, and form bodies use the existing fade animation. These controls do not change other screens or connect any API.

| Method | Confirmed endpoint | Accepted contract |
| --- | --- | --- |
| `submitCommunityIssue(data)` | POST `/community/reports/` | Existing `ReportPayload` or FormData; requires `title`, supports description/category/address and image upload |
| `requestEmergencyAssistance(data)` | POST `/rescue/markers/` | Existing `RescuePayload` or FormData; requires address and `{ lat, lng }` location; supports actual group counts, flood level, medical-assistance boolean and evidence upload |

These convenience entry points share the existing `communityReportService.createReport` and `rescueService.createRescue` endpoints. They accept backend payloads, not mock form drafts. No new routes were invented.

### Gaps to resolve before connecting these forms

1. **Emergency description:** no rescue field for free-text emergency details, floor level, or road access. Add and expose suitable fields.
2. **Total headcount and group presence:** the mock captures a total and checkboxes; the backend takes separate `childrens`, `elderly`, `pwd`, `adults` counts. Agree on total/group-presence fields or collect actual counts. Never translate a checked group into one person or silently put everyone into `adults`.
3. **Pregnancy:** no rescue pregnancy field; add a presence flag or actual count and define how it overlaps other counts.
4. **Emergency type:** distinguish rescue, evacuation, and medical assistance using explicit form inputs and a supported backend contract; do not infer medical need from free text.
5. **Emergency location/address:** report forms now use sample mock pins without GPS or manual location entry. The help flow stores the sample address in its local SOS record. Before wiring it, retain real numeric coordinates and resolve an address/known barangay with a live pin picker and reverse geocoding. Sample pins are not real user locations.
6. **Community coordinates:** latitude/longitude are read-only and are never persisted by the current report view. Add writable location before integrating device pins. Category is a free string, so the six mock categories fit the current category field.
7. **AI hazard scan:** no registered classification/scan endpoint in the ZIP. Add image input, hazard suggestion, confidence/explanation, failures and cancellation semantics. Dashboard flood prediction/insight routes are not image classification APIs.
8. **Community title:** the backend requires a title; the wizard currently collects category and description. Define a title field or reviewed title generation when integrating.
9. **Guest requests/tracking:** add guest creation and secure tracking if preserving the guest emergency flow in production; current POST `/rescue/markers/` is authenticated.
10. **Form-to-status persistence:** expose rescue headcount/details/pregnancy in read responses, along with ownership-safe history and real status transitions. Current Status uses demo timers, including an automatic progression that is not a backend event.

Existing serializer, ownership and deployment fixes listed above still apply. No service is prepared for the missing AI scan endpoint.

## Supply requests: local mock contract

Based on the supplied example, the mock stores all seven need flags (`needs_food`, `needs_water`, `needs_medicine`, `needs_baby_supplies`, `needs_hygiene`, `needs_clothing_blankets`, `needs_power_light`), `other_supplies`, `childrens`, `elderly`, `pwd`, `adults`, `flood_level`, `medical_assistance`, `barangay`, `address`, `contact_number`, optional `evidence` photo URI, and numeric `{ latitude, longitude }` location.

The wizard validates selections, a nonzero household count, explicit flood/medical answers, a confirmed sample delivery pin, and mobile-number format. Sample pins supply the address, barangay, and numeric coordinates; there is no manual location entry or GPS request in reporting. It preserves answers when moving back between steps and checks all steps again on submission. Submission is explicit and protected against duplicate taps.

`id`, `created_at`, and `status: need_supplies` are set locally; `deliverer` and `delivered_at` remain null. The demo session has no numeric account ID, so `user` is the session name or null; backend integration must use the authenticated numeric ID instead. `evidence` is a device URI, not a server upload URL. Nothing persists across an app restart.

**No supply service endpoint was added:** the provided ZIP has no confirmed supply creation, history, delivery assignment, or fulfillment route. The example JSON describes fields but does not establish an endpoint. Before integration, provide the updated backend routes/serializers and confirm:

- Supply create/read/history routes and ownership/role permissions (resident = passenger; volunteer = driver).
- The request/response coordinate format, writable address/contact fields, barangay lookup, and multipart evidence upload.
- Supply flag/count validation, how household groups avoid double counting, other-item details, and medical-assistance handling.
- Assignment to a deliverer, dispatch/on-the-way/delivered statuses, delivery timestamps, and authorized completion/cancellation.
- Guest access policy, duplicate/active-request rules, notifications, and secure tracking.

## Validation limits

TypeScript and lint are local checks only. No requests were sent to ai-rise.onrender.com.
Backend defects remain in the ZIP; no backend code was changed.

## Mock confirmation and location UI

All three reporting flows show a shared animated checkmark confirmation with View status and Back actions after saving locally. Volunteer deployment completion uses the same animation on an immediately visible completion screen. Reduced-motion preferences are respected by the shared animation. The sent labels are UI mockups; no report/request API is called. Community and help requests store a sample address; supplies also retain the sample coordinates and barangay. Replace these sample pins with a real map selection and address resolution before integration.
