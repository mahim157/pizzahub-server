# 🍕 PizzaHub Backend

**A Secure, Role-Based Pizza Ordering & Delivery Platform API**

PizzaHub is a full-stack pizza ordering and delivery platform designed to connect customers with local pizza restaurants. The backend is built with **Node.js, Express.js, TypeScript, MongoDB, and Better Auth**, providing secure authentication, role-based authorization, menu management, order processing, vendor subscriptions, and payment integration.

The application supports three user roles: **Customer, Vendor, and Admin**, each with dedicated permissions and functionalities.

---

## 🌐 Live Application

| Service | Live Link |
|---|---|
| Frontend Application | [PizzaHub Client](https://pizzahub-client-2wd4.vercel.app) |
| Backend API | [PizzaHub Backend](https://pizzahub-client-nkpu.vercel.app) |

## 📂 GitHub Repositories

| Repository | Link |
|---|---|
| Backend Repository | https://github.com/mahim157/pizzahub-server |
| Frontend Repository | https://github.com/mahim157/pizzahub-client |

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- Secure authentication using Better Auth.
- Email and password authentication.
- Google authentication integration.
- JWT-based authentication and token verification.
- Role-based access control (RBAC).
- Three user roles: Customer, Vendor, and Admin.
- Protected API routes.
- User blocking and access restriction.

### 🍕 Menu Management
- Vendors can create, update, and delete menu items.
- Image uploads using ImgBB.
- Admin approval and rejection system.
- Menu availability management.
- Free subscription limited to 3 active menu items.
- Unlimited active menu items for Premium vendors.
- Only approved and active items are available to customers.

### 📦 Order Management
- Customers can place pizza orders.
- Delivery date and address management.
- Customers can view their personal order history.
- Customers can cancel pending orders.
- Vendors can accept or reject pending orders.
- Order status management.
- Duplicate active order prevention.
- Resource ownership verification.

### 💳 Subscription & Payment
- Vendor Premium subscription system.
- Stripe Checkout integration.
- Secure Stripe webhook verification.
- Automatic subscription activation after verified payment.
- Subscription transaction records.
- Premium vendor benefits.

### 🛡️ Admin Management
- View and manage registered users.
- Search and manage customers and vendors.
- Block and unblock users.
- Review submitted menu items.
- Approve or reject menu items.
- Manage published menu items.
- View platform orders and transactions.

### ⚙️ Additional Features
- Request validation using Zod.
- Centralized error handling.
- Secure environment variable configuration.
- Image hosting through ImgBB.
- Protected image upload API.
- Database integration with MongoDB.

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| Node.js | JavaScript runtime |
| Express.js | Backend framework |
| TypeScript | Type-safe development |
| MongoDB | NoSQL database |
| Better Auth | Authentication |
| JWT | Token-based authorization |
| Zod | Request validation |
| Stripe | Subscription payments |
| Multer | File upload handling |
| ImgBB | Image hosting |

---

## 👥 User Roles & Permissions

### 1. Customer
- Browse approved pizza menu items.
- View pizza details.
- Place orders.
- View personal order history.
- Track order status.
- Cancel pending orders.
- Update profile information.

### 2. Vendor
- Create and manage restaurant profiles.
- Add, update, and delete menu items.
- Upload pizza images.
- Manage menu item availability.
- View incoming customer orders.
- Accept or reject pending orders.
- Upgrade to a Premium subscription.
- View subscription transaction history.
- Update profile information.

### 3. Admin
- Manage registered users.
- Block and unblock users.
- View all submitted menu items.
- Approve or reject menu items.
- Manage published menu items.
- View platform orders.
- Monitor subscription transactions.

---

## 🔌 API Endpoints

The backend provides RESTful API endpoints organized by functionality.

| Endpoint | Description |
|---|---|
| `/api/auth` | Authentication and session management |
| `/api/menu-items` | Menu item management |
| `/api/orders` | Customer and vendor order management |
| `/api/transactions` | Subscription transaction history |
| `/api/subscriptions` | Vendor subscriptions and Stripe integration |
| `/api/admin` | Administrative operations |
| `/api/images` | Image upload management |
| `/api/health` | Server health check |

**Note:** Individual endpoints support protected operations according to authentication status, user roles, and resource ownership.

---

## 💳 Payment Integration

PizzaHub uses **Stripe Checkout** exclusively for Vendor Premium subscriptions.

### Subscription Payment Workflow

1. Vendor selects the Premium subscription plan.
2. The frontend requests a subscription session.
3. The backend validates the authenticated vendor.
4. The backend creates a Stripe Checkout Session.
5. The vendor is redirected to Stripe Checkout.
6. Stripe sends a payment event to the backend webhook.
7. The backend verifies the webhook signature.
8. After successful payment verification, the subscription is activated.
9. Transaction information is stored in MongoDB.

**Payment Security**
- Stripe secret keys remain on the server.
- Webhook signatures are verified before processing payment events.
- Frontend redirects are not trusted for subscription activation.
- Vendors cannot create subscription sessions for other vendors.

**Important:** Customer pizza ordering does not require Stripe payment integration. Stripe is used only for Vendor Premium subscriptions.

---

## 🖼️ Image Upload

PizzaHub uses ImgBB for uploading and hosting menu item images.

Image upload functionality includes:

- File-based image uploads.
- ImgBB API integration.
- Authentication verification.
- Vendor-only upload authorization.
- Secure API key management.

Only authenticated vendors can upload menu item images through the protected image upload API.

---

## 🔒 Security & Data Protection

Security is an important part of the PizzaHub backend architecture.

Implemented security measures include:

- Better Auth authentication.
- JWT token verification.
- Role-based authorization.
- Server-side permission verification.
- Protected API endpoints.
- User blocking verification.
- Resource ownership validation.
- Zod request validation.
- Stripe webhook signature verification.
- Environment variable-based secret management.
- Proper unauthorized and forbidden request handling.

The backend does not rely exclusively on frontend role checks. Protected operations are verified on the server.

---

## 🗄️ Database Design

PizzaHub uses MongoDB for storing application data.

The database follows a structured collection-based design.

| Collection | Purpose |
|---|---|
| `users` | User information, roles, and subscription details (managed by Better Auth) |
| `menuItems` | Pizza menu items and approval status |
| `orders` | Customer orders and delivery information |
| `transactions` | Vendor subscription payment records |

### Main Relationships

- Each menu item belongs to a vendor.
- Each order references a menu item, vendor, and customer.
- Each transaction belongs to a vendor.
- User authentication data is managed through Better Auth.

---

## 🚀 Project Setup & Installation

Follow these steps to run the backend locally.

### 1. Clone the Repository

```bash
git clone YOUR_BACKEND_GITHUB_REPOSITORY_URL
```

### 2. Navigate to the Backend Directory

```bash
cd server
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Configure Environment Variables

Create a `.env` file in the root directory of the backend project.

Add the following environment variables:

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

Add your own credentials to the environment variables.

**Security Notice:** Never upload your `.env` file or expose secret credentials in your GitHub repository.

### 5. Start the Development Server

```bash
npm run dev
```

The backend server will run at:

```text
http://localhost:5000
```

### 6. Build the Project

To compile the TypeScript application, run:

```bash
npm run build
```

---

## ⚙️ Environment Variables

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `CLIENT_URL` | Frontend application URL |
| `BETTER_AUTH_URL` | Backend authentication URL |
| `BETTER_AUTH_SECRET` | Better Auth secret key |
| `MONGODB_URI` | MongoDB connection string |
| `IMGBB_API_KEY` | ImgBB API key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_PRICE_ID` | Stripe Premium subscription price ID |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |

---

## 🧪 Testing & Error Handling

The backend handles common application errors, including:

- Invalid or expired authentication tokens.
- Unauthorized API requests.
- Forbidden role-based operations.
- Invalid request data.
- Missing database records.
- Failed image uploads.
- Invalid order operations.
- Failed subscription payments.

Zod validation and centralized error handling help maintain consistent API responses.

---

## 🎯 Assignment Challenge Implementation

PizzaHub includes additional development challenges:

**1. JWT / Token Verification**
- JWT verification middleware protects private API routes.
- Role-based middleware restricts access according to user permissions.
- Invalid or expired tokens are rejected.

**2. Advanced Search & Sorting**
- Menu item search and filtering.
- Category and location-based filtering.
- Price sorting in ascending and descending order.

**3. Professional UI/UX**
- Responsive frontend design.
- Role-based dashboards.
- Consistent design and reusable components.

---

## 📌 Important Notes

- The backend requires valid environment variables to run successfully.
- MongoDB must be accessible.
- Stripe subscription functionality requires valid Stripe credentials and webhook configuration.
- ImgBB image uploads require a valid API key.
- Frontend and backend must use the correct production URLs.
- Never commit secret credentials to version control.

---

## 📄 License

This project was developed for academic purposes as part of Assignment 9.

---

**Developed with ❤️ for PizzaHub**