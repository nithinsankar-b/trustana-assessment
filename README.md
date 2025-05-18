# 🚀 Product Enrichment Platform

A web application that helps users enrich product information with AI. This platform allows for automated enrichment of product attributes using AI technologies.

## 🔴 Live Demo

View the live application: [https://trustana-assessment-2.vercel.app/](https://trustana-assessment-2.vercel.app/)

## 📋 Overview

This application helps businesses enrich their product data by automating the population of various product attributes using AI. Users can import products with basic information (name, brand, images, barcode) and use AI to generate detailed attributes such as product descriptions, ingredients, dimensions, and more.

## ✨ Features

- **🛒 Product Management**: View, add, edit, and delete products
- **🏷️ Attribute Management**: Configure the types of attributes to enrich
- **🧠 AI Enrichment**: Automatically populate product attributes using AI
- **⏱️ Real-time Job Status**: Track the progress of enrichment jobs
- **🔄 Support for Multiple Attribute Types**:
  
## 💻 Technology Stack

### Frontend
- **🧩 Framework**: React with TypeScript
- **🗃️ State Management**: React Context API
- **🎨 UI Components**: Custom components with CSS
- **🔌 API Client**: Axios
- **☁️ Deployment**: Vercel

### Backend
- **⚙️ Runtime**: Node.js with Express
- **📋 Language**: TypeScript
- **🗄️ Database**: PostgreSQL (hosted on Neon)
- **🔄 ORM**: Prisma
- **🤖 AI Integration**: OpenAI API for enrichment
- **🚀 Deployment**: Render

## 📁 Project Structure

```
project/
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── assets/          # Static assets
│   │   ├── components/      # Reusable React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── App.css
│   │   ├── App.tsx
│   │   ├── index.css
│   │   └── main.tsx
│   └── package.json
│
├── server/                  # Backend Node.js application
│   ├── prisma/              # Prisma ORM configuration
│   │   ├── migrations/      # Database migrations
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── controllers/     # API controllers
│   │   ├── middleware/      # Express middleware
│   │   ├── models/          # Data models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic services
│   │   ├── utils/           # Utility functions
│   │   ├── index.ts         # Application entry point
│   │   └── server.ts        # Express server setup
│   └── package.json
│
└── README.md                # Project documentation
```

## 🛠️ Setup and Installation

### Prerequisites
- 📌 Node.js (v14 or later)
- 📌 npm or yarn
- 📌 PostgreSQL database or Neon account

### Environment Variables

#### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

#### Backend (.env)
```
PORT=5000
DATABASE_URL=postgresql://user:password@host:port/database
OPENAI_API_KEY=your-openai-api-key
OPEN_AI_MODEL=open-ai-model
CORS_ORIGIN='http://localhost:5173'
```

### Installation Steps

1. **📥 Clone the repository**
```bash
git clone https://github.com/nithinsankar-b/trustana-assessment.git
cd product-enrichment-platform
```

2. **📦 Install server dependencies**
```bash
cd server
npm install
```

3. **🗄️ Set up the database**
```bash
npx prisma migrate dev
npm run seed  # If a seed script is available
```

4. **▶️ Start the server**
```bash
npm run dev
```

5. **📦 Install client dependencies**
```bash
cd ../client
npm install
```

6. **▶️ Start the client**
```bash
npm run dev
```

7. **🌐 Access the application**
Open your browser and navigate to `http://localhost:5173`

## 🗄️ Database Design

The application uses a PostgreSQL database with the following schema:

### Products Table
- `id`: Primary key
- `name`: Product name
- `brand`: Brand name
- `barcode`: Unique barcode (optional)
- `images`: Array of image URLs
- `attributes`: JSON field storing enriched attributes
- `ai_enriched`: Boolean flag indicating if AI enrichment has been applied
- `createdAt` & `updatedAt`: Timestamps

### Attributes Table
- `id`: Primary key
- `name`: Attribute name (unique)
- `type`: Attribute type (enum: SHORT_TEXT, LONG_TEXT, RICH_TEXT, NUMBER, SINGLE_SELECT, MULTIPLE_SELECT, MEASURE)
- `unit`: Unit for MEASURE type attributes (optional)
- `options`: Array of options for SELECT type attributes
- `isRequired`: Boolean indicating if attribute is required
- `systemGenerated`: Boolean indicating if attribute is system-generated
- `createdAt` & `updatedAt`: Timestamps

### EnrichmentJob Table
- `id`: Primary key
- `productIds`: Array of product IDs to be enriched
- `status`: Job status (enum: PENDING, PROCESSING, COMPLETED, FAILED)
- `progress`: Progress percentage (0-100)
- `result`: JSON field storing job results
- `createdAt` & `updatedAt`: Timestamps

## 🔌 API Endpoints

### Products
- `GET /api/products` - Get all products 📋
- `GET /api/products/:id` - Get a single product 🔍
- `POST /api/products` - Create a new product ➕
- `PUT /api/products/:id` - Update a product 🔄
- `DELETE /api/products/:id` - Delete a product ❌

### Attributes
- `GET /api/attributes` - Get all attributes 📋
- `GET /api/attributes/:id` - Get a single attribute 🔍
- `POST /api/attributes` - Create a new attribute ➕
- `PUT /api/attributes/:id` - Update an attribute 🔄
- `DELETE /api/attributes/:id` - Delete an attribute ❌

### Enrichment
- `POST /api/enrichment/products` - Start an enrichment job for products 🚀
- `GET /api/enrichment/status/:jobId` - Get the status of an enrichment job ⏱️

## 🤖 AI Enrichment Process

1. 👤 User selects products to enrich
2. 🔄 System creates an enrichment job
3. 🔍 Backend retrieves product data and configured attributes
4. 🧠 AI service generates appropriate values for each attribute based on product information
5. 📝 System updates products with enriched data
6. 🔄 UI updates to show enrichment progress and results

## 🚀 Deployment

### Frontend (Vercel)
- 🔗 Connected to the GitHub repository
- 🔄 Automatic deployments on push to main branch
- ⚙️ Environment variables configured in Vercel dashboard

### Backend (Render)
- 🔗 Connected to the GitHub repository
- 🔄 Automatic deployments on push to main branch
- ⚙️ Environment variables configured in Render dashboard

### Database (Neon)
- 🗄️ PostgreSQL database hosted on Neon
- 🔌 Connection string provided to backend application

## 🔮 Future Enhancements

- 📤 Bulk product import functionality
- 📥 Export enriched products to CSV/Excel
- 🧠 Custom AI model training based on industry-specific data
- 🔒 User authentication and role-based access control
- ✅ Enhanced validation for enriched attributes
- 🛠️ Improved error handling and recovery for failed enrichment jobs

## 🙏 Acknowledgements

- [OpenAI](https://openai.com/) - For providing the AI API used in this project 🤖
- [Trustana](https://www.trustana.com/) - For the project requirements and inspiration 💡
