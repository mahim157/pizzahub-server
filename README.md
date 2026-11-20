
# PizzaHub Backend

PizzaHub is a full-stack pizza ordering platform backend built with Express.js, TypeScript, MongoDB, and Better Auth.

It provides secure authentication, role-based authorization, menu management, order management, vendor subscriptions, payment processing, and image uploads.

## Features

- Secure authentication using Better Auth
- JWT-based authentication and authorization
- Three user roles: Customer, Vendor, and Admin
- Vendor menu item management
- Admin menu item approval and rejection
- Customer pizza ordering
- Vendor order management
- Order status management
- Vendor Premium Subscription
- Stripe Checkout integration
- Stripe Webhook integration
- Transaction history
- Admin user management
- User blocking and unblocking
- ImgBB image upload
- Request validation using Zod
- Centralized error handling

## Technologies Used

- Node.js
- Express.js
- TypeScript
- MongoDB
- Better Auth
- JWT
- Zod
- Stripe
- Multer
- ImgBB

## Project Setup

### 1. Clone the Repository

```bash
git clone YOUR_BACKEND_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the Project Folder

```bash
cd server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory and configure the following variables:

```env
PORT=5000
CLIENT_URL=http://localhost:3000
BETTER_AUTH_URL=http://localhost:5000
BETTER_AUTH_SECRET=
MONGODB_URI=
IMGBB_API_KEY=
STRIPE_SECRET_KEY=
STRIPE_PRICE_ID=
STRIPE_WEBHOOK_SECRET=
```

Add your own credentials to the `.env` file.

### 5. Start the Development Server

```bash
npm run dev
```

The backend server will run at:

`http://localhost:5000`

## API Routes

| Route | Description |
|---|---|
| `/api/auth` | Authentication |
| `/api/menu-items` | Menu item management |
| `/api/orders` | Order management |
| `/api/transactions` | Transaction history |
| `/api/subscriptions` | Vendor subscriptions and Stripe webhook |
| `/api/admin` | Admin operations |
| `/api/images` | Image upload |
| `/api/health` | Server health check |

## User Roles

### Customer
- Browse approved pizza menu items
- Place orders
- View personal orders
- Cancel pending orders

### Vendor
- Create and manage menu items
- View incoming orders
- Accept or reject pending orders
- Purchase Premium Subscription
- View transaction history
- Upload pizza images

### Admin
- Manage users
- Block and unblock users
- View all menu items
- Approve or reject menu items
- View all orders
- View all transactions

## Payment Integration

Stripe Checkout is used for Vendor Premium Subscriptions.

Stripe Webhooks handle subscription payment confirmation and subscription status updates.

Customer pizza orders do not use Stripe payment integration.

## Image Upload

ImgBB is used to upload and host pizza images.

Only authenticated vendors can upload images through the image upload API.

## Security

- JWT verification
- Role-based access control
- User blocking verification
- Zod request validation
- Protected API routes
- Stripe webhook signature verification
- Environment variable configuration

## Build

```bash
npm run build
```

## License

This project was developed for academic purposes.
