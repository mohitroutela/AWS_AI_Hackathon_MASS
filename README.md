# AI Commerce Copilot

An intelligent analytics platform that empowers small and mid-scale retailers to make data-driven decisions without requiring technical expertise. Combines demand forecasting, smart pricing, customer insights, inventory risk monitoring, and market trend analysis into a single conversational AI interface.

## 🎯 Project Overview

**Team:** MASS  
**Team Leader:** Mohit Routela  
**Status:** MVP (Hackathon Phase)

### Key Features

- **Demand Forecasting** - Predict future sales using historical data and seasonality patterns
- **Smart Pricing** - Optimize prices based on competitor data and demand elasticity
- **Customer Insights** - Segment customers (New, Regular, VIP, At-Risk) and calculate lifetime value
- **Inventory Risk Alerts** - Monitor stock levels and detect stockout/overstock risks
- **Market Trend Analysis** - Display category growth, trending products, and market sentiment
- **AI Copilot Chat** - Natural language interface for querying data and getting insights
- **Interactive Dashboards** - Customizable, drag-and-drop dashboard widgets

## 🏗️ Architecture

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React + TypeScript)                              │
│  - Interactive Dashboards  │  Natural Language Chat         │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  Backend (FastAPI + Python)                                 │
│  - Chat Management  │  Dashboard Management  │  Data APIs   │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│  AWS Services                                               │
│  - DynamoDB (Dashboards/Chat)  │  Bedrock (AI)             │
│  - SageMaker (ML Models)       │  Lambda (Compute)         │
│  - S3 (Storage)                │  API Gateway              │
└─────────────────────────────────────────────────────────────┘
```

### Key Architectural Principles

- **Metadata-Only Dashboard Storage** - DynamoDB stores only dashboard structure and widget references, not actual data
- **Type-Based Data Fetching** - Dashboards have a `dashboardType` that determines which data API to call
- **Separation of Concerns** - Dashboard metadata separate from data sources for scalability
- **Serverless Architecture** - AWS Lambda + API Gateway for cost-effective scaling

## 📁 Project Structure

### Backend: `fastapi-server/`

```
fastapi-server/
├── app/
│   ├── main.py                          # FastAPI app entry point
│   ├── config.py                        # Configuration & settings
│   ├── database/
│   │   ├── dynamodb.py                  # DynamoDB client
│   │   ├── chat_repository.py           # Chat data access
│   │   ├── chat_history_repository.py   # Chat history storage
│   │   ├── chat_details_repository.py   # Chat details storage
│   │   └── dashboard_repository.py      # Dashboard data access
│   ├── models/
│   │   ├── chat.py                      # Chat data models
│   │   ├── chat_management.py           # Chat management models
│   │   ├── dashboard.py                 # Dashboard models
│   │   └── dynamodb_table.py            # DynamoDB table definitions
│   ├── routers/
│   │   ├── chat.py                      # Chat endpoints
│   │   ├── chat_history_management.py   # Chat history endpoints
│   │   ├── chat_details_management.py   # Chat details endpoints
│   │   ├── dashboard.py                 # Dashboard endpoints
│   │   ├── dashboard_management.py      # Dashboard management endpoints
│   │   └── dynamodb_admin.py            # DynamoDB admin endpoints
│   └── services/
│       ├── chat_transformer.py          # Chat transformation logic
│       ├── chat_history_service.py      # Chat history business logic
│       ├── chat_details_service.py      # Chat details business logic
│       ├── dashboard_service.py         # Dashboard business logic
│       ├── gateway_client.py            # AWS API Gateway client
│       ├── dynamodb_client.py           # DynamoDB operations
│       ├── intent.py                    # Intent classification
│       └── session.py                   # Session management
├── requirements.txt                     # Python dependencies
├── template.yml                         # AWS SAM template
└── samconfig.toml                       # SAM configuration
```

### Frontend: `retailAI-ui/`

```
retailAI-ui/
├── src/
│   ├── app/
│   │   ├── App.tsx                      # Main app component
│   │   ├── components/
│   │   │   ├── AICopilot.tsx            # Chat interface
│   │   │   ├── Dashboard.tsx            # Main dashboard
│   │   │   ├── DemandForecast.tsx       # Demand forecasting page
│   │   │   ├── PricingIntelligence.tsx  # Pricing optimization page
│   │   │   ├── CustomerInsights.tsx     # Customer segmentation page
│   │   │   ├── InventoryRisk.tsx        # Inventory alerts page
│   │   │   ├── MarketTrends.tsx         # Market analysis page
│   │   │   ├── DataUpload.tsx           # Data ingestion UI
│   │   │   ├── DataQuality.tsx          # Data validation UI
│   │   │   ├── Layout.tsx               # Main layout wrapper
│   │   │   ├── common/                  # Shared components
│   │   │   └── ui/                      # Radix UI components
│   │   ├── services/
│   │   │   ├── api.service.ts           # API client
│   │   │   ├── chatbot.service.ts       # Chat API calls
│   │   │   ├── dashboard.service.ts     # Dashboard API calls
│   │   │   └── upload.service.ts        # File upload API calls
│   │   ├── hooks/                       # Custom React hooks
│   │   ├── types/                       # TypeScript types
│   │   └── styles/                      # Global styles
│   └── vite-env.d.ts                    # Vite type definitions
├── package.json                         # Node dependencies & scripts
├── vite.config.ts                       # Vite build configuration
├── postcss.config.mjs                   # PostCSS configuration
└── index.html                           # HTML entry point
```

## 🛠️ Technology Stack

### Frontend
- **React 18.3.1** - UI framework
- **TypeScript** - Type-safe development
- **Vite 6.3.5** - Build tool & dev server
- **TailwindCSS 4.1.12** - Utility-first CSS framework
- **Radix UI** - Headless component library (50+ components)
- **Recharts 2.15.2** - React charting library
- **Highcharts 12.5.0** - Advanced charting
- **React Router 7.13** - Client-side routing
- **React Hook Form 7.55** - Form state management
- **React DnD 16.0.1** - Drag-and-drop functionality

### Backend
- **Python 3.11+** - Primary language
- **FastAPI 0.110+** - REST API framework
- **Uvicorn 0.27+** - ASGI server
- **Pydantic 2.6+** - Data validation
- **Boto3 1.34+** - AWS SDK
- **Mangum 0.17+** - ASGI to Lambda adapter

### AWS Services
- **DynamoDB** - NoSQL database for dashboards & chat history
- **Lambda** - Serverless compute for API endpoints
- **API Gateway** - REST API management & routing
- **Bedrock** - Generative AI for chat interface
- **SageMaker** - ML model training & hosting
- **S3** - Object storage for data & artifacts
- **CloudWatch** - Logging & monitoring

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (for frontend)
- Python 3.11+ (for backend)
- AWS Account with appropriate permissions
- Git

### Frontend Setup

```bash
cd retailAI-ui

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

```bash
cd fastapi-server

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run locally
uvicorn app.main:app --reload

# Or with specific host/port
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The backend API will be available at `http://localhost:8000`

### AWS Deployment

```bash
cd fastapi-server

# Configure SAM
sam build

# Deploy to AWS
sam deploy --guided
```

## 📊 Data Model

### Dashboard (DynamoDB)

```json
{
  "dashboardId": "uuid",
  "dashboardName": "Revenue Dashboard",
  "dashboardType": "revenue-type",
  "userId": "user-123",
  "widgets": [
    {
      "widgetId": "widget-1",
      "widgetType": "chart|summaryCard|grid",
      "widgetChartType": "line|bar|pie",
      "title": "Revenue Trend",
      "position": 0,
      "refreshInterval": 600
    }
  ],
  "layout": "grid",
  "tags": ["revenue"],
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### Dashboard Types

| Type | Description | Endpoint |
|------|-------------|----------|
| `revenue-type` | Revenue metrics | `/api/data/revenue-type` |
| `inventory-type` | Inventory management | `/api/data/inventory-type` |
| `sales-type` | Sales analytics | `/api/data/sales-type` |
| `customer-type` | Customer insights | `/api/data/customer-type` |
| `forecast-type` | Demand forecasting | `/api/data/forecast-type` |
| `pricing-type` | Pricing intelligence | `/api/data/pricing-type` |
| `market-type` | Market trends | `/api/data/market-type` |

## 🔌 API Endpoints

### Chat Endpoints
- `POST /api/chat` - Send a chat message
- `GET /api/chat/{sessionId}` - Get chat session
- `GET /api/chat-history/{userId}` - Get user's chat history

### Dashboard Endpoints
- `GET /api/dashboards` - List all dashboards
- `GET /api/dashboards/{dashboardId}` - Get dashboard metadata
- `POST /api/dashboards` - Create new dashboard
- `PUT /api/dashboards/{dashboardId}` - Update dashboard
- `DELETE /api/dashboards/{dashboardId}` - Delete dashboard

### Data Endpoints
- `GET /api/data/{dashboardType}` - Get widget data by dashboard type

### Admin Endpoints
- `GET /api/dynamodb-admin/tables` - List DynamoDB tables
- `POST /api/dynamodb-admin/tables` - Create table
- `DELETE /api/dynamodb-admin/tables/{tableName}` - Delete table

## 📚 Documentation

Comprehensive documentation is available in the `fastapi-server/` directory:

- **ARCHITECTURE.md** - Metadata-only dashboard architecture
- **FINAL_ARCHITECTURE_SUMMARY.md** - Dashboard type-based architecture
- **DASHBOARD_TYPE_ARCHITECTURE.md** - Dashboard type implementation guide
- **API_DOCUMENTATION.md** - API endpoint specifications
- **SETUP_GUIDE.md** - Development setup instructions
- **CHAT_MANAGEMENT_IMPLEMENTATION.md** - Chat feature details
- **TRANSFORMATION_EXAMPLES.md** - Data transformation examples

## 🎨 Features in Detail

### Demand Forecasting
- Time series analysis with seasonality patterns
- Multi-horizon forecasts (daily, weekly, monthly)
- Confidence intervals for predictions
- Recommended stock levels based on forecasts

### Smart Pricing
- Real-time competitor price monitoring
- Demand elasticity analysis
- Multi-objective optimization (revenue + margin)
- Dynamic pricing schedules with A/B testing

### Customer Insights
- RFM (Recency, Frequency, Monetary) analysis
- Automatic customer segmentation
- Customer lifetime value (LTV) calculation
- Churn probability scoring

### Inventory Risk Alerts
- Stockout risk detection
- Overstock identification
- Slow-moving product alerts
- Fast-moving product tracking
- Revenue-impact prioritization

### Market Trend Analysis
- Category growth heatmaps
- Trending keyword clouds
- Sentiment timeline charts
- Competitive positioning matrix

### AI Copilot Chat
- Natural language query processing
- Automatic text-to-SQL conversion
- Conversational responses with data insights
- Auto-generated visualizations
- Proactive recommendations

## 🔐 Security

- **Encryption at Rest** - S3 SSE, DynamoDB encryption
- **Encryption in Transit** - TLS 1.3 for all connections
- **Authentication** - AWS Cognito (planned)
- **Authorization** - Role-based access control (RBAC)
- **API Security** - Rate limiting, input validation
- **Data Protection** - PII masking in logs and exports

## 📈 Performance Targets

- Query response time < 3 seconds (p95)
- Dashboard load time < 2 seconds
- Query accuracy > 95%
- System uptime > 99.5%
- Cache hit rate > 80%

## 🗺️ Roadmap

### Phase 1: MVP (Current)
- ✅ Basic data ingestion (CSV upload)
- ✅ Demand forecasting
- ✅ Customer segmentation
- ✅ Chat interface with limited queries
- ✅ Pre-built dashboards

### Phase 2: Enhanced Features
- Real-time data connectors
- Advanced pricing optimization
- Inventory risk alerts
- Market trend analysis
- Mobile responsive design

### Phase 3: Enterprise Ready
- Federated data warehouse support
- Multi-tenant architecture
- Advanced security features
- Custom integrations
- White-label options

## 🤝 Contributing

This is a hackathon project. For contributions or questions, please reach out to the team.

## 📞 Support

For issues, questions, or feedback, please contact the development team.

---

**Last Updated:** March 2026  
**Version:** 1.0.0 (MVP)
