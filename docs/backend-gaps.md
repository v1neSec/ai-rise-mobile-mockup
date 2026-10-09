# Backend gaps for the mobile app

The mobile app uses the documented API for sign-in, passenger/driver registration, flood forecasts, barangay boundaries, resident rescue and supply requests, community reports, resident status, volunteer assigned tasks, volunteer GPS updates, availability, and task completion.

The following UI behavior remains local or needs backend support because the supplied API has no matching endpoint or field:

- **Safe check-in and contact broadcast:** no endpoint records a resident's safe status, location, or sends a detail message to contacts.
- **Notifications and flood alerts:** dashboard forecasts are available, but there is no alert/notification feed or push notification registration endpoint.
- **Report analysis:** the report screen's AI scan is a UI mock; no image/hazard analysis endpoint is documented.
- **Exact community-report pin:** report create accepts address and barangay, while report latitude/longitude are documented read-only. Add writable coordinates (or a `location: { lat, lng }` field) if the backend should retain the selected map pin.
- **SOS context and household headcount:** rescue requests accept group counts, flood depth, and medical assistance, but no nature/follow-up/access fields. The SOS wizard also does not collect a total headcount; it sends selected vulnerable-person counts and a minimal adult count. Add corresponding fields and a total-person input if dispatch needs this context.
- **Pregnancy as a separate vulnerable category:** rescue/supply schemas have no pregnancy count; the current SOS request includes a pregnant person in `adults`.
- **Volunteer mission queue and claiming:** there is no general available-task list or accept/claim endpoint. Rescue and supply requests auto-assign the nearest active available driver; the app lists those assigned tasks and opens their deployment view.
- **Deployment progress and issue reporting:** the API only supports completing a rescue/delivery. Arrival, start, intermediate stages, and field issue reports are currently local UI state.
- **Team broadcasts:** the WebSocket documentation only describes connection authentication and the initial handshake, with no broadcast/event payload contract. The broadcast panel therefore has no live server messages.
- **Volunteers without vehicles:** driver registration requires a unique vehicle plate. Vehicle type and passenger capacity shown in the UI are not accepted by the documented driver profile API. Decide whether to add profile fields and make plate optional for volunteers without vehicles.

Android production map builds also need a Google Maps API key configured through Expo app config; no key was provided, so none is embedded in the project.
