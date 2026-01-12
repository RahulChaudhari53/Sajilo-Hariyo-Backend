# Backend - Sajilo Hariyo

This is the backend API for the **Sajilo Hariyo** e-commerce application, built with Node.js, Express, and MongoDB. It manages user authentication, products, orders, shopping carts, and administrative functions.

## 🚀 Tech Stack

*   **Runtime:** [Node.js](https://nodejs.org/)
*   **Framework:** [Express.js](https://expressjs.com/)
*   **Database:** [MongoDB](https://www.mongodb.com/) (using [Mongoose](https://mongoosejs.com/))
*   **Authentication:** JWT (JSON Web Tokens)
*   **File Uploads:** [Multer](https://github.com/expressjs/multer)
*   **Security:** Helmet, CORS, Compression
*   **Other Tools:** Nodemailer (Email), Twilio (SMS), Firebase Admin (Notifications)

## 🛠️ Installation & Setup

1.  **Clone the repository** (if not already done).
2.  **Navigate to the backend directory:**
    ```bash
    cd backend_fourth
    ```
3.  **Install Dependencies:**
    ```bash
    npm install
    ```
4.  **Environment Variables:**
    Create a `.env` file in the root directory and configure the following variables (example):
    ```env
    PORT=5050
    MONGO_URI=mongodb://localhost:27017/sajilo_hariyo
    JWT_SECRET=your_jwt_secret_key
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=your_email@gmail.com
    SMTP_PASS=your_email_password
    TWILIO_SID=your_twilio_sid
    TWILIO_AUTH_TOKEN=your_twilio_auth_token
    TWILIO_PHONE_NUMBER=your_twilio_phone_number
    ```
5.  **Start the Server:**
    *   **Development (with Nodemon):**
        ```bash
        npm run dev
        ```
    *   **Production:**
        ```bash
        npm start
        ```

## 📂 Project Structure

```
backend_fourth/
├── src/
│   ├── controllers/    # Request handlers (logic)
│   ├── middlewares/    # Auth, Uploads, Error handling
│   ├── models/         # Mongoose Schemas (User, Product, Order, etc.)
│   ├── routes/         # API Route definitions
│   └── utils/          # Helper functions (SMS, Email, etc.)
├── public/             # Static files (uploads)
├── server.js           # Entry point
└── ...
```

## 📡 API Endpoints

### **Authentication (`/api/users`)**
*   `POST /register` - Register a new user
*   `POST /login` - Login user
*   `POST /verify-otp` - Verify OTP for registration/login
*   `POST /forgot-password` - Request password reset OTP
*   `POST /reset-password` - Reset password

### **Products (`/api/products`)**
*   `GET /` - Get all products (with filters: search, category, price)
*   `GET /:id` - Get single product details
*   `POST /` - Create product (Admin only)
*   `PATCH /:id` - Update product (Admin only)
*   `DELETE /:id` - Delete product (Admin only)

### **Categories (`/api/categories`)**
*   `GET /` - Get all categories
*   `POST /` - Create category (Admin only)
*   `DELETE /:id` - Delete category (Admin only)

### **Orders (`/api/orders`)**
*   `POST /` - Place a new order
*   `GET /my-orders` - Get verified user's orders
*   `GET /:id` - Get order details
*   `PATCH /:id/cancel` - Cancel an order
*   `GET /:id/delivery-code` - Get delivery QR code

### **Admin (`/api/admin`)**
*   `GET /stats` - Get dashboard statistics
*   `GET /orders` - Get all orders (filtered by status)
*   `PATCH /order/:id/status` - Update order status
*   `POST /verify-delivery` - Verify delivery via QR code

### **Notifications (`/api/notifications`)**
*   `GET /` - Get user notifications
*   `PATCH /:id/read` - Mark notification as read
*   `PATCH /read-all` - Mark all as read

## 📝 License
This project is for educational and development purposes.
