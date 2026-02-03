## Changes Made:

### Backend (backend/items/views.py)
- Added `get_analytics` function with NULL handling via IFNULL
- Supports filtering by name, brand, and location

### Backend (backend/items/urls.py)
- Route configured correctly

### Frontend (frontend/nginx.conf)
- Fixed API proxy: location /api/ → proxy_pass http://django-service:8000/
- Added proper headers for X-Real-IP

### Frontend (frontend/src/components/Analytics.jsx)
- Added console.log for debugging analytics data
- Added error handling for fetch requests
- Added hasData checks to prevent empty chart rendering

## Testing:
1. Frontend makes requests to /api/analytics-data
2. Nginx proxies /api/ requests to Django correctly
3. Django returns JSON with by_brand, by_location, by_status, details
4. Frontend displays 'No data' message when empty instead of blank charts

