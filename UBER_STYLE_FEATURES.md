new# Uber/DoorDash-Style Service Marketplace Features

This application now implements a first-come-first-served service marketplace similar to Uber and DoorDash, where customers can request services and providers compete to claim them.

## Key Features

### 1. First-Come-First-Served Claiming System

- **Real-time Request Availability**: Service requests are immediately available to all providers
- **Instant Claiming**: Providers can claim requests instantly with a single click
- **5-Minute Response Window**: Once claimed, providers have 5 minutes to accept or decline
- **Automatic Expiration**: Unclaimed requests automatically expire and become available again

### 2. Real-time Notifications

- **Notification Bell**: Users see real-time notifications in the header
- **Request Status Updates**: Customers are notified when their requests are claimed, accepted, or declined
- **Provider Notifications**: Providers are notified of new available requests
- **Auto-refresh**: Notifications update every 10 seconds

### 3. Provider Dashboard Enhancements

#### Available Requests Tab
- Browse all unclaimed service requests
- Real-time availability indicators
- One-click claiming system
- First-come-first-served competition

#### My Claims Tab
- View all currently claimed requests
- 5-minute countdown timer for each claim
- Accept/Decline buttons with expiration handling
- Automatic status updates

#### Dashboard Overview
- Real-time metrics showing available requests
- Claim count and status tracking
- Quick action buttons for navigation

### 4. Customer Experience

#### Request Submission
- Submit service requests without specifying a provider
- Requests immediately appear in the marketplace
- Real-time status updates via notifications

#### Request Tracking
- View all submitted requests with current status
- See when requests are claimed by providers
- Track acceptance/decline status

## Database Schema Updates

### New Tables
- **notifications**: Stores real-time notifications for users
- **Enhanced service_requests**: Added claiming fields (claimed_at, claimed_by, expires_at)

### New Status Types
- **pending**: Request is available for claiming
- **claimed**: Request has been claimed by a provider (5-minute window)
- **accepted**: Provider has accepted the request
- **declined**: Provider has declined the request
- **completed**: Service has been completed

### Database Functions
- **claim_service_request()**: Handles the claiming process with race condition protection
- **accept_claimed_request()**: Accepts a claimed request within the time window
- **decline_claimed_request()**: Declines a claimed request and makes it available again
- **cleanup_expired_claims()**: Automatically cleans up expired claims

## Technical Implementation

### Race Condition Protection
The claiming system uses database-level functions to prevent race conditions when multiple providers try to claim the same request simultaneously.

### Real-time Updates
- Polling-based notification system (10-second intervals)
- Automatic cleanup of expired claims (5-minute intervals)
- Real-time status updates in the UI

### User Experience
- Loading states during claiming process
- Disabled buttons for expired claims
- Clear visual indicators for claim status and time remaining
- Intuitive navigation between different request states

## How It Works

### For Customers
1. Submit a service request through the marketplace
2. Request immediately appears in the provider marketplace
3. Receive notifications when providers claim/accept/decline
4. Track request status in real-time

### For Providers
1. Browse available requests in the marketplace
2. Click "Claim This Request" to secure it
3. You have 5 minutes to accept or decline
4. If you accept, the request becomes an active service
5. If you decline or time expires, the request becomes available again

## Benefits

- **Fair Competition**: First-come-first-served ensures fair access
- **Quick Response**: 5-minute window encourages quick decisions
- **Real-time Updates**: Users always know the current status
- **Automatic Cleanup**: Expired claims are handled automatically
- **Scalable**: Database functions handle concurrent access efficiently

This system creates a dynamic, competitive marketplace where speed and responsiveness matter, just like in Uber and DoorDash applications. 