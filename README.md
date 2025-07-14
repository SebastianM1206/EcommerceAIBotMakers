# MakerTech - Complete Ecommerce System

A modern full-stack ecommerce platform built with React frontend and FastAPI backend, featuring real-time updates, user authentication, and intelligent product management.

## 🏗️ Architecture

- **Frontend**: React + Vite + TypeScript + Tailwind CSS
- **Backend**: FastAPI + Python
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: Google Gemini for natural language queries
- **Real-time Features**: Automatic stock updates and UI refresh

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Python 3.8+
- Supabase account
- Google Gemini API key

### 1. Frontend Setup

```bash
cd maker-tech
npm install
```

Create `.env` in `maker-tech/`:

```env
VITE_API_URL=http://localhost:8001
VITE_CHATBOT_ENABLED=true
VITE_APP_NAME=MakerTech Store
VITE_ENV=development
```

Start frontend:

```bash
npm run dev
# Runs on http://localhost:5173
```

### 2. Backend Setup

```bash
cd backend-makers
pip install -r requirements.txt
```

Create `.env` in `backend-makers/`:

```env
# Server Configuration
HOST=0.0.0.0
PORT=8001
DEBUG=true

# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_KEY=your_supabase_anon_key

# Google Gemini Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash

# CORS
CORS_ORIGINS=http://localhost:5173
```

Start backend:

```bash
python run.py
# Runs on http://localhost:8001
```

### 3. Database Setup

In your Supabase SQL Editor, run:

```sql
-- Users table
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  address TEXT,
  role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user'
);

-- Products table
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  category TEXT,
  rating DECIMAL(3, 2) DEFAULT 0.0,
  reviews INTEGER DEFAULT 0,
  image_url TEXT,
  original_price DECIMAL(10, 2),
  is_new BOOLEAN DEFAULT false,
  is_on_sale BOOLEAN DEFAULT false
);

-- Orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  total_price DECIMAL(10, 2) NOT NULL,
  status TEXT CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')) DEFAULT 'pending'
);

-- Order items table
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10, 2) NOT NULL
);

-- Function for secure dynamic queries
CREATE OR REPLACE FUNCTION public.execute_dynamic_query(query_text TEXT)
RETURNS TABLE(result JSONB)
SECURITY DEFINER
AS $$
BEGIN
  IF NOT (query_text ILIKE 'SELECT%' OR query_text ILIKE 'WITH%') THEN
    RAISE EXCEPTION 'Only SELECT and WITH queries are allowed';
  END IF;

  IF query_text ILIKE '%DROP%' OR query_text ILIKE '%DELETE%' OR
     query_text ILIKE '%UPDATE%' OR query_text ILIKE '%INSERT%' OR
     query_text ILIKE '%CREATE%' OR query_text ILIKE '%ALTER%' OR
     query_text ILIKE '%TRUNCATE%' THEN
    RAISE EXCEPTION 'Dangerous operations not allowed';
  END IF;

  RETURN QUERY EXECUTE 'SELECT to_jsonb(subquery) FROM (' || query_text || ') AS subquery';
END;
$$ LANGUAGE plpgsql;

-- Create admin user
INSERT INTO public.users (name, email, password, address, role) VALUES
('Admin User', 'admin@ecommerce.com', 'admin123', '123 Admin St', 'admin');
```

## ✨ Features

### 🛍️ Ecommerce Core

- Product catalog with search and filtering
- Shopping cart with real-time updates
- Secure checkout process
- Order management system
- Automatic stock management

### 👤 User Management

- User registration and authentication
- Role-based access (admin/user)
- User profile management
- Order history

### 🤖 AI Features

- Natural language product queries
- Intelligent search capabilities
- Chatbot integration

### ⚡ Real-time Updates

- Live stock updates after purchases
- Instant UI refresh without page reload
- Optimistic UI updates

### 🎨 Modern UI

- Responsive design
- Dark/light theme support
- Modern component library (shadcn/ui)
- Smooth animations and transitions

## 📚 API Documentation

Backend API docs available at:

- Swagger UI: `http://localhost:8001/docs`
- ReDoc: `http://localhost:8001/redoc`

### Key Endpoints

**Products**

- `GET /api/v1/products` - Get products with filtering
- `GET /api/v1/products/featured` - Get featured products
- `POST /api/v1/products` - Create product (admin)

**Users**

- `POST /api/v1/users/login` - User login
- `POST /api/v1/users/register` - User registration
- `GET /api/v1/users` - Get all users (admin)

**Orders**

- `POST /api/v1/orders/user/{user_id}` - Create order
- `GET /api/v1/orders/user/{user_id}` - Get user orders

**AI Queries**

- `POST /api/v1/query` - Natural language queries

## 🗂️ Project Structure

```
makersCase/
├── maker-tech/                 # React Frontend
│   ├── src/
│   │   ├── components/         # Reusable components
│   │   ├── pages/              # Main pages
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities and config
│   │   └── context/            # React contexts
│   └── public/                 # Static assets
│
├── backend-makers/             # FastAPI Backend
│   ├── app/
│   │   ├── models/             # Pydantic schemas
│   │   ├── routes/             # API endpoints
│   │   ├── services/           # Business logic
│   │   └── utils/              # Utilities
│   └── requirements.txt        # Python dependencies
│
└── README.md                   # This file
```

## 🔧 Development

### Frontend Development

```bash
cd maker-tech
npm run dev        # Development server
npm run build      # Production build
npm run preview    # Preview production build
```

### Backend Development

```bash
cd backend-makers
python run.py      # Development server with auto-reload
```

### Database Migrations

All database changes should be made through Supabase dashboard SQL editor.

## 🚀 Deployment

### Frontend (Vercel/Netlify)

1. Build the project: `npm run build`
2. Deploy the `dist` folder
3. Set environment variables in deployment platform

### Backend (Railway/Heroku)

1. Set environment variables
2. Deploy from `backend-makers` directory
3. Ensure database is accessible

## 🛠️ Technologies Used

### Frontend

- **React 18** - UI library
- **Vite** - Build tool and dev server
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Modern component library
- **React Query** - Data fetching and caching

### Backend

- **FastAPI** - Modern Python web framework
- **Pydantic** - Data validation
- **Supabase** - Database and authentication
- **Google Gemini** - AI language model
- **Uvicorn** - ASGI server

## 🆘 Support

For support, check:

1. API documentation at `/docs`
2. Database logs in Supabase dashboard
3. Browser console for frontend issues
4. Backend logs for API issues
