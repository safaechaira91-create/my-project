# 🏡 MyDar - Property Rental Platform / Plateforme de Location Immobilière

> **English & French documentation below.**  
> *Documentation en anglais et en français ci-dessous.*

---

## 🇬🇧 English Documentation

### 📌 Overview
**MyDar** is a modern, high-performance property listing and booking web application built with the MERN stack ecosystem (React 19 / Vite & Node.js / MongoDB). It provides an intuitive Airbnb-style interface for users to discover, book, and review rental properties, alongside a dedicated host and admin dashboard for complete management.

---

### ✨ Key Features
- **User Authentication & Roles:** Secure JWT authentication with role-based access control (`user`, `host`, `admin`).
- **Property Listings & Search:** Advanced search and filtering by location, price, and property type with normalized query support.
- **Interactive Booking System:** Seamless property reservation workflow with instant total calculation and date validation.
- **Host & Admin Dashboards:** Dedicated panels to manage listings, bookings, user roles, and platform analytics.
- **Multilingual Support (i18n):** Native support for Arabic (RTL), French, English, and more.
- **Image Upload:** Integrated Cloudinary storage for high-resolution property image uploads via `multer-storage-cloudinary`.

---

### 🛠️ Tech Stack
- **Frontend:** React (Vite 8), Tailwind CSS v4, React Router DOM v7, Framer Motion, Axios, i18next, React Helmet Async.
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), Cloudinary API, Express Validator.

---

### 🚀 Getting Started

#### Prerequisites
- **Node.js:** `v18.x` or higher
- **npm:** `v9.x` or higher
- **MongoDB:** Active connection URI (Local or MongoDB Atlas)

#### 1. Environment Configuration
Create a `.env` file in the project root directory with the following variables:

```env
# Server Config
PORT=5000
NODE_ENV=production

# Database
MONGO_URI=your_mongodb_connection_string

# JWT Secret
JWT_SECRET=your_jwt_secret_key

# Cloudinary Setup (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend Config
VITE_BACKEND_URL=http://localhost:5000/api