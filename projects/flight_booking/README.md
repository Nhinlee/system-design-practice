✈️ Flight Booking System
==========================================================

## 1. Scope Definition
- **Target Airline:** Vietnam Airlines only; no multi-carrier aggregation.
- **Target User:** Guest travelers; account creation is out of scope for the MVP.
- **Core Flows:** Flight search and itinerary booking.

## 2. Functional Requirements

### 2.1 Search Logic
- **Itinerary types:**
	- Direct flights limited to a single leg.
	- Transit itineraries may include multiple legs, capped at 3 (e.g., SGN → DAD → HAN → NRT).
- **Round trips:** Clients issue two one-way searches; backend optimizes strictly for the single one-way problem.
- **Search filters (MVP):** Origin airport, destination airport, departure date.
- **Out of scope filters:** Flexible dates, fare ranges, alliances.

### 2.2 Booking & Pricing Logic
- **Pricing:** Static admin-managed fares; no demand-based adjustments.
- **Hold mechanism:** Selecting an itinerary locks seats and fare for 10 minutes while traveler supplies details.
- **Expiration:** Holds auto-expire after 10 minutes if not confirmed, releasing inventory back to the pool.
- **Consistency:** Strong consistency required to avoid overbooking across every leg.
- **Passenger data collected:** First name, last name, email, phone, date of birth (no passport/visa data).

## 3. Non-Functional Requirements

### 3.1 Scale & Data Volume
- **Inventory horizon:** 365-day searchable window.
- **Network footprint:** About 100 airports spanning ~500 unique routes.
- **Active records:** Roughly 365k flight-leg entries (500 routes × 365 days × ~2 flights/day).

### 3.2 Traffic & Load
- **Daily active users:** ~1M.
- **Search throughput:** Average 12 RPS, peak 200 RPS.
- **Booking throughput:** Look-to-book ratio 100:1 with peak writes around 2 RPS.

### 3.3 Performance Targets
- **Search latency:** p95 ≤ 3 s while evaluating multi-leg paths.
- **Booking latency:** p95 ≤ 1 s once payment is confirmed.

## 4. Explicit Non-Goals
- Payment processing (delegated to external gateway).
- Check-in and boarding pass generation.
- Loyalty program management.
- Ancillary services (meals, baggage, etc.).