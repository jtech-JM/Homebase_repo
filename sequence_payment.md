User Initiates Payment:

The user starts the payment process on the frontend (Next.js app). If not logged in, they must authenticate first.
User Authentication:

The frontend sends a login request to the backend (POST /api/auth/login).
The backend forwards the credentials to the authentication service.
The authentication service queries the database for the user.
If credentials are valid, the authentication service returns a success response and an authentication token.
The backend sends the token back to the frontend.
User Submits Payment Details:

The user enters payment details and submits them via the frontend.
The frontend sends a payment request to the backend (POST /api/payments).
Backend Validates Payment Request:

The backend passes the request to the payments service.
The payments service checks the user’s authentication token with the authentication service.
The authentication service queries the database to validate the user.
If valid, the payments service proceeds.
Payment Record Creation:

The payments service creates a new payment record in the database.
Payment Processing:

The payments service sends the payment details to the external payment gateway.
The payment gateway processes the payment and returns a confirmation.
Confirmation:

The payments service informs the backend of the payment result.
The backend sends the result to the frontend.