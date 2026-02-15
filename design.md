# Design Document
## AI Commerce Copilot

### Project Information
**Team Name:** MASS  
**Team Leader:** Mohit Routela  
**Version:** 1.0  
**Last Updated:** February 2026

---

## 1. Executive Summary

The AI Commerce Copilot is a unified commerce intelligence platform that combines market signals, pricing optimization, demand forecasting, and risk monitoring into a single conversational AI interface. Unlike fragmented analytics tools, it provides real-time AI reasoning specifically designed for small and mid-scale retailers with localized insights.

### 1.1 Key Differentiators
- **Unified Platform:** Single system for pricing, demand planning, inventory, and customer strategy
- **Conversational AI:** Natural language interface replacing manual analytics
- **Real-time Intelligence:** Live market signals vs. static dashboards
- **Localized Design:** Built for small/mid-scale retailers with local market adaptation

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                        │
│  💬 Natural Language Chat  │  📊 Interactive Dashboards     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    CORE ANALYTICS ENGINE                     │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ NL Query Interface│  │  Schema Manager  │                │
│  │                   │  │  (Cache Layer)   │                │
│  └──────────────────┘  └──────────────────┘                │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │ Text-to-SQL Agent│  │ Query Validator  │                │
│  │ (LLM Integration)│  │   & Executor     │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                              │
│  ┌──────────────────┐           ┌──────────────────┐        │
│  │   MODE 1:        │           │   MODE 2:        │        │
│  │ Managed Data     │           │  Federated       │        │
│  │                  │           │                  │        │
│  │ • File Uploads   │           │ • Client DW      │        │
│  │ • Cloud Storage  │           │ • Real-time      │        │
│  │ • API Ingestion  │           │ • No Duplication │        │
│  │ • DB Connectors  │           │ • Multi-DW       │        │
│  │                  │           │                  │        │
│  │ ↓ ETL Pipeline   │           │ ↓ DW Connector   │        │
│  └──────────────────┘           └──────────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                   INSIGHTS & VISUALIZATION                   │
│  • Auto-generated Charts    • Pre-built Dashboards          │
│  • Sales Analytics          • Customer Insights             │
│  • Inventory Reports        • Market Trends                 │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Component Architecture

#### 2.2.1 Data Ingestion Layer
- **ETL Pipeline (Mode 1):** Processes uploaded files and API data
- **Data Warehouse Connector (Mode 2):** MCP-based federated queries
- **Data Validation:** Quality checks and schema validation
- **Storage:** S3 for raw data, DynamoDB for processed data

#### 2.2.2 Analytics Engine
- **Natural Language Processor:** Interprets user queries
- **Text-to-SQL Agent:** Converts natural language to SQL using LLM
- **Schema Manager:** Caches database schema for fast query generation
- **Query Executor:** Validates and executes queries safely
- **ML Models:** Demand forecasting, pricing optimization, customer segmentation

#### 2.2.3 AI/ML Services
- **Amazon Bedrock:** Generative AI for conversational interface
- **Amazon SageMaker:** Training and hosting ML models
- **Amazon Textract:** Document processing for uploaded files

#### 2.2.4 Presentation Layer
- **React Frontend:** Interactive dashboards and visualizations
- **Chat Interface:** Conversational AI interaction
- **Visualization Engine:** Auto-generated charts and reports

---

## 3. Feature Design

### 3.1 Demand Forecasting Module

#### Architecture
```
Historical Sales Data → Feature Engineering → ML Model (SageMaker)
                                                    ↓
Seasonality Patterns  → Time Series Analysis → Forecast Output
                                                    ↓
Market Trends        → External Signals     → Confidence Intervals
```

#### Key Components
- **Time Series Model:** ARIMA/Prophet for seasonal patterns
- **Feature Store:** Historical sales, promotions, holidays, weather
- **Prediction Engine:** Multi-horizon forecasts (daily, weekly, monthly)
- **Accuracy Tracking:** Continuous model performance monitoring

#### Output
- SKU-level demand predictions
- Confidence intervals
- Recommended stock levels
- Staffing suggestions

---

### 3.2 Smart Pricing Recommendation

#### Architecture
```
Competitor Prices (API) → Price Intelligence Engine
                                    ↓
Demand Elasticity      → Optimization Algorithm → Price Recommendations
                                    ↓
Margin Constraints     → Validation Layer       → A/B Test Suggestions
```

#### Key Components
- **Market Data Collector:** Real-time competitor pricing via APIs
- **Elasticity Calculator:** Price sensitivity analysis
- **Optimization Engine:** Multi-objective optimization (revenue + margin)
- **Rule Engine:** Business constraints and guardrails

#### Output
- Optimal price points per SKU
- Expected revenue impact
- Margin protection alerts
- Dynamic pricing schedules

---

### 3.3 Customer Insights & Segmentation

#### Architecture
```
Transaction Data → RFM Analysis → Customer Segments
                                        ↓
Behavior Patterns → ML Clustering → Segment Profiles
                                        ↓
LTV Calculation  → Predictive Model → Retention Scores
```

#### Segmentation Logic
- **New:** First purchase within 30 days
- **Regular:** 2-5 purchases, active within 90 days
- **VIP:** 6+ purchases or high LTV, active within 60 days
- **At-Risk:** No purchase in 90+ days, previously active

#### Key Metrics
- Customer Lifetime Value (LTV)
- Churn probability
- Average order value by segment
- Retention rate trends

---

### 3.4 Inventory Risk Alerts

#### Architecture
```
Current Stock Levels → Risk Detection Engine → Priority Alerts
                                ↓
Lead Times          → Predictive Analysis  → Action Recommendations
                                ↓
Demand Forecast     → Threshold Monitoring → SKU-level Insights
```

#### Alert Types
- **Stockout Risk:** Inventory below safety stock + lead time demand
- **Overstock Risk:** Inventory > 90 days of forecasted demand
- **Slow-Moving:** < 1 unit sold per week for 4+ weeks
- **Fast-Moving:** Sales velocity > 2x forecast

#### Prioritization
- Revenue impact (high-value SKUs first)
- Customer impact (popular items)
- Margin impact (high-margin products)

---

### 3.5 Market Trend Analysis Dashboard

#### Data Sources
- Internal sales data
- External market APIs
- Social media sentiment
- Search trend data
- Competitor activity

#### Visualizations
- Category growth heatmaps
- Trending keyword clouds
- Sentiment timeline charts
- Competitive positioning matrix
- Opportunity scoring table

---

### 3.6 AI Copilot Chat Interface

#### Conversation Flow
```
User Query (NL) → Intent Classification → Context Retrieval
                                               ↓
                  Schema Mapping → Text-to-SQL Generation
                                               ↓
                  Query Execution → Result Processing
                                               ↓
                  Insight Generation → Visualization Selection
                                               ↓
                  Response Formatting → User Display
```

#### Supported Query Types
- **Diagnostic:** "Why did revenue drop last week?"
- **Descriptive:** "Show me top selling products"
- **Predictive:** "What will be my sales next month?"
- **Prescriptive:** "How should I price this product?"
- **Comparative:** "Compare this month vs last month"

#### Response Components
- Natural language explanation
- Data visualization (charts/tables)
- Actionable recommendations
- Related follow-up questions

---

## 4. Data Model

### 4.1 Core Entities

#### Sales Transactions
```
- transaction_id (PK)
- timestamp
- sku_id (FK)
- customer_id (FK)
- quantity
- unit_price
- total_amount
- discount
- channel
- location_id
```

#### Products/SKUs
```
- sku_id (PK)
- product_name
- category
- subcategory
- brand
- cost_price
- current_price
- stock_quantity
- reorder_point
- lead_time_days
```

#### Customers
```
- customer_id (PK)
- first_purchase_date
- last_purchase_date
- total_purchases
- total_spend
- ltv_score
- segment
- churn_risk_score
```

#### Forecasts
```
- forecast_id (PK)
- sku_id (FK)
- forecast_date
- predicted_demand
- confidence_lower
- confidence_upper
- model_version
- created_at
```

---

## 5. Technology Stack Details

### 5.1 AWS Services

#### Compute
- **AWS Lambda:** Serverless functions for API endpoints
- **Amazon ECS/Fargate:** Container hosting for backend services
- **API Gateway:** RESTful API management

#### AI/ML
- **Amazon Bedrock:** Claude/Titan models for conversational AI
- **Amazon SageMaker:** ML model training and hosting
- **Amazon Textract:** Document OCR and data extraction

#### Data Storage
- **Amazon S3:** Raw data, model artifacts, backups
- **Amazon DynamoDB:** NoSQL for real-time data
- **Amazon ElastiCache (Redis):** Schema caching, session management

#### Analytics
- **AWS Glue:** ETL job orchestration
- **Amazon Athena:** Ad-hoc SQL queries on S3

#### Monitoring
- **Amazon CloudWatch:** Logs, metrics, alarms
- **AWS X-Ray:** Distributed tracing

### 5.2 Frontend Stack
- **React 18+:** Component-based UI
- **TypeScript:** Type-safe development
- **Recharts/D3.js:** Data visualization
- **TailwindCSS:** Styling framework
- **React Query:** Data fetching and caching

### 5.3 Backend Stack
- **Python 3.11+:** Primary language
- **FastAPI:** REST API framework
- **SQLAlchemy:** ORM for database operations
- **Pandas/NumPy:** Data processing
- **Scikit-learn:** ML utilities

---

## 6. Security Design

### 6.1 Authentication & Authorization
- **AWS Cognito:** User authentication
- **JWT Tokens:** Stateless session management
- **Role-Based Access Control (RBAC):** User permissions

### 6.2 Data Security
- **Encryption at Rest:** S3 SSE, DynamoDB encryption
- **Encryption in Transit:** TLS 1.3 for all connections
- **Data Masking:** PII protection in logs and exports
- **VPC Isolation:** Private subnets for sensitive services

### 6.3 API Security
- **Rate Limiting:** Prevent abuse
- **Input Validation:** SQL injection prevention
- **API Keys:** Third-party integration authentication

---

## 7. Scalability Design

### 7.1 Horizontal Scaling
- **Auto-scaling Groups:** ECS tasks scale based on CPU/memory
- **Lambda Concurrency:** Automatic scaling for serverless functions
- **DynamoDB On-Demand:** Automatic capacity management

### 7.2 Caching Strategy
- **Redis Cache:** Schema metadata, frequent queries
- **CloudFront CDN:** Static assets and frontend
- **Query Result Cache:** 5-minute TTL for dashboard data

### 7.3 Database Optimization
- **Partitioning:** Time-based partitioning for transaction data
- **Indexing:** Optimized indexes for common query patterns
- **Read Replicas:** Separate read/write workloads

---

## 8. Cost Optimization

### 8.1 High-Impact Costs
- **Amazon Bedrock:** Token-based pricing (~$0.01-0.03 per 1K tokens)
- **SageMaker Training:** Instance hours for model training
- **Textract:** Per-page processing fees
- **Market APIs:** Subscription costs for real-time data

### 8.2 Optimization Strategies
- **Caching:** Reduce redundant LLM calls
- **Batch Processing:** Group ETL jobs
- **Reserved Capacity:** For predictable workloads
- **S3 Lifecycle Policies:** Archive old data to Glacier
- **Lambda Memory Optimization:** Right-size function memory

### 8.3 Estimated Monthly Costs (MVP)
- Compute (Lambda + ECS): $200-400
- AI/ML (Bedrock + SageMaker): $500-1000
- Storage (S3 + DynamoDB): $100-200
- APIs (Market data): $300-500
- Monitoring & Misc: $100-200
- **Total Estimated:** $1,200-2,300/month

---

## 9. Implementation Phases

### Phase 1: MVP (Hackathon)
- Basic data ingestion (CSV upload)
- Simple demand forecasting
- Customer segmentation
- Chat interface with limited queries
- Pre-built dashboards

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

---

## 10. Success Metrics

### 10.1 Technical Metrics
- API response time < 3s (p95)
- Query accuracy > 95%
- System uptime > 99.5%
- Cache hit rate > 80%

### 10.2 Business Metrics
- User adoption rate
- Daily active users
- Query volume per user
- Feature utilization rate
- Customer satisfaction score

### 10.3 AI/ML Metrics
- Forecast accuracy (MAPE < 15%)
- Pricing recommendation acceptance rate
- Customer segment stability
- Alert precision and recall

---

## 11. Risk Mitigation

### 11.1 Technical Risks
- **LLM Hallucination:** Query validation layer, confidence scoring
- **API Failures:** Fallback mechanisms, cached data
- **Data Quality:** Validation rules, anomaly detection
- **Performance:** Load testing, auto-scaling

### 11.2 Business Risks
- **User Adoption:** Intuitive UX, onboarding tutorials
- **Data Privacy:** Compliance with regulations, audit logs
- **Cost Overruns:** Budget alerts, usage monitoring
- **Vendor Lock-in:** Abstraction layers, portable architecture

---

## 12. Future Roadmap

### Short-term (3-6 months)
- Mobile native apps
- Advanced visualization options
- Integration with popular e-commerce platforms
- Multi-language support

### Medium-term (6-12 months)
- Automated marketing campaign execution
- Supply chain optimization
- Collaborative features (team workspaces)
- Advanced anomaly detection

### Long-term (12+ months)
- AI-powered business strategy advisor
- Predictive maintenance for operations
- Blockchain integration for supply chain
- Industry-specific vertical solutions
