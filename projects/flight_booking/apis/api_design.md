# API Design

This document outlines the API design for a flight booking system, focusing on key endpoints, request/response structures, and error handling.

## Search Flights API
`GET /api/v1/flights/search`
### Request Parameters
- `origin` (string, required): IATA code of the origin airport (e.g., "SGN").
- `destination` (string, required): IATA code of the destination
- `departure_date` (string, required): Date of departure in YYYY-MM-DD format.
### Response
- `itineraries` (array): List of available flight itineraries.
    - Each itinerary includes:
      - `legs` (array): List of flight legs.
          - Each leg includes:
            - `flight_leg_id` (string): Unique identifier for the flight leg.
            - `flight_number` (string): Flight number (e.g., "VN123").
            - `departure_time` (string, ISO 8601 format)
            - `arrival_time` (string, ISO 8601 format)
            - `origin` (string)
            - `destination` (string)
            - `duration` (integer, minutes)
      - `total_price` (float): Total price for the itinerary.
      - `currency` (string): Currency code (e.g., "VND", "USD").

## Booking Flight API
`POST /api/v1/flights/book`
### Headers
- Idempotency-Key: <unique_key> (to prevent duplicate booking requests)
- ...

### Request Body
- `flight_leg_ids` (array of strings, required): List of IDs of the selected flight legs.
- `passengers` (array, required): List of passenger information.
    - Each passenger object includes:
      - `first_name` (string, required)
      - `last_name` (string, required)
      - `email` (string, required)
      - `phone` (string, required)
      - `date_of_birth` (string, YYYY-MM-DD format, required)
### Response
- `booking_id` (string): Unique identifier for the booking.
- `status` (string): Booking status (e.g., "confirmed", "pending").
- `hold_expiration` (string, ISO 8601 format): Timestamp when the hold expires.
- `total_price` (float): Total price for the booking.
- `currency` (string): Currency code.
- `payment_url` (string): URL for payment processing.
- `expires_at` (string, ISO 8601 format): Timestamp when the booking hold expires.
