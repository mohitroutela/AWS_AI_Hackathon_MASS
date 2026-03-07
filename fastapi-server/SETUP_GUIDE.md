# RetailAI Backend Setup Guide

## Quick Start

### 1. Install Python Dependencies

```bash
cd backend
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
DYNAMODB_TABLE_NAME=retail-ai-dashboards
CORS_ORIGINS=http://localhost:5173
```

### 3. Run the Application

```bash
python -m app.main
```

Or with uvicorn:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Access API Documentation

- Swagger UI: http://localhost:8000/api/docs
- ReDoc: http://localhost:8000/api/redoc

---

## Local Development with DynamoDB Local

### Option 1: Using Docker

```bash
# Start DynamoDB Local
docker run -p 8000:8000 amazon/dynamodb-local

# Update .env
DYNAMODB_ENDPOINT_URL=http://localhost:8000
ENVIRONMENT=development
```

### Option 2: Download DynamoDB Local

1. Download from: https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/DynamoDBLocal.html
2. Extract and run:
   ```bash
   java -Djava.library.path=./DynamoDBLocal_lib -jar DynamoDBLocal.jar -sharedDb
   ```

---

## Create Sample Data

After starting the application, run:

```bash
python scripts/create_sample_data.py
```

This creates 3 sample dashboards with various widgets.

---

## Testing the API

### Using cURL

**Health Check:**
```bash
curl http://localhost:8000/health
```

**Create Dashboard:**
```bash
curl -X POST http://localhost:8000/api/dashboards/ \
  -H "Content-Type: application/json" \
  -d '{
    "dashboardName": "My Dashboard",
    "userId": "user-123",
    "widgets": [],
    "layout": "grid"
  }'
```

**Get User Dashboards:**
```bash
curl http://localhost:8000/api/dashboards/user/user-123
```

### Using Swagger UI

1. Open http://localhost:8000/api/docs
2. Click "Try it out" on any endpoint
3. Fill in parameters
4. Click "Execute"

---

## Project Structure

```
backend/
├── app/
│   ├── main.py              # FastAPI app entry point
│   ├── config.py            # Configuration settings
│   ├── api/
│   │   └── routes/
│   │       └── dashboard.py # Dashboard endpoints
│   ├── models/
│   │   └── dashboard.py     # Pydantic models
│   ├── services/
│   │   └── dashboard_service.py # Business logic
│   └── database/
│       └── dynamodb.py      # DynamoDB client
├── scripts/
│   └── create_sample_data.py # Sample data script
├── requirements.txt         # Dependencies
├── .env.example            # Environment template
└── README.md               # Documentation
```

---

## Common Issues

### Issue: "Table does not exist"
**Solution:** The table is created automatically in development mode. Ensure `ENVIRONMENT=development` in `.env`

### Issue: "Unable to locate credentials"
**Solution:** 
- For AWS: Set AWS credentials in `.env`
- For local DynamoDB: Use dummy credentials (already set in code)

### Issue: "Connection refused to DynamoDB"
**Solution:** 
- Ensure DynamoDB Local is running
- Check `DYNAMODB_ENDPOINT_URL` in `.env`

### Issue: CORS errors from frontend
**Solution:** Add your frontend URL to `CORS_ORIGINS` in `.env`

---

## Next Steps

1. ✅ Backend is running
2. Update frontend API base URL to `http://localhost:8000`
3. Test API endpoints using Swagger UI
4. Create sample dashboards
5. Integrate with frontend application

---

## Production Deployment

### AWS Lambda + API Gateway

1. Install additional dependencies:
   ```bash
   pip install mangum
   ```

2. Create Lambda handler:
   ```python
   from mangum import Mangum
   from app.main import app
   
   handler = Mangum(app)
   ```

3. Package and deploy to AWS Lambda

4. Configure API Gateway

5. Set environment variables in Lambda console

### Docker Deployment

```bash
# Build image
docker build -t retailai-backend .

# Run container
docker run -p 8000:8000 --env-file .env retailai-backend
```

---

## Monitoring & Logging

Logs are written to stdout. In production:
- Use CloudWatch Logs (AWS Lambda)
- Use container logging (Docker)
- Configure log aggregation service

---

## Security Checklist

- [ ] Never commit `.env` file
- [ ] Use IAM roles in production (not access keys)
- [ ] Enable HTTPS in production
- [ ] Add authentication/authorization
- [ ] Implement rate limiting
- [ ] Validate all inputs
- [ ] Enable API Gateway throttling
- [ ] Use VPC for DynamoDB access
- [ ] Enable DynamoDB encryption at rest
- [ ] Implement audit logging

---

## Support

For issues or questions:
1. Check API documentation: `API_DOCUMENTATION.md`
2. Review logs for error messages
3. Verify environment configuration
4. Test with Swagger UI
