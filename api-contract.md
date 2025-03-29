# Property Analyzer API Contract

Base URL: `http://localhost:5271`

## Endpoints

### Get All Properties
- **Method**: GET
- **Endpoint**: `/api/Properties`
- **Query Parameters**: 
  - `showArchived` (boolean, optional): Filter by archived status
    - `null` or not specified: Return only non-archived properties (default)
    - `true`: Return only archived properties
    - `false`: Return only non-archived properties
- **Response**: Array of Property objects
```json
[
  {
    "id": "string",
    "address": "string",
    "status": "string",
    "listingPrice": number,
    "offerPrice": number,
    "rehabCosts": number,
    "potentialRent": number,
    "arv": number,
    "rentCastEstimates": {
      "price": number,
      "priceLow": number,
      "priceHigh": number,
      "rent": number,
      "rentLow": number,
      "rentHigh": number
    },
    "hasRentcastData": boolean,
    "notes": "string",
    "score": number,
    "zillowLink": "string"
  }
]
```

### Get Property by Address
- **Method**: GET
- **Endpoint**: `/api/Properties/property`
- **Query Parameters**: 
  - `address` (string, required): The property address
- **Response**: Single Property object
```json
{
  "id": "string",
  "address": "string",
  "status": "string",
  "listingPrice": number,
  "offerPrice": number,
  "rehabCosts": number,
  "potentialRent": number,
  "arv": number,
  "rentCastEstimates": {
    "price": number,
    "priceLow": number,
    "priceHigh": number,
    "rent": number,
    "rentLow": number,
    "rentHigh": number
  },
  "hasRentcastData": boolean,
  "notes": "string",
  "score": number,
  "zillowLink": "string"
}
```

### Create Property
- **Method**: POST
- **Endpoint**: `/api/Properties`
- **Request Body**: Property object
```json
{
  "address": "string",
  "status": "string",
  "listingPrice": number,
  "offerPrice": number,
  "rehabCosts": number,
  "potentialRent": number,
  "arv": number,
  "rentCastEstimates": {
    "price": number,
    "priceLow": number,
    "priceHigh": number,
    "rent": number,
    "rentLow": number,
    "rentHigh": number
  },
  "hasRentcastData": boolean,
  "notes": "string",
  "score": number,
  "zillowLink": "string"
}
```
- **Response**: Created Property object with ID

### Update Property
- **Method**: PUT
- **Endpoint**: `/api/Properties/{id}`
- **URL Parameters**:
  - `id` (string, required): The property ID
- **Request Body**: Property object
```json
{
  "address": "string",
  "status": "string",
  "listingPrice": number,
  "offerPrice": number,
  "rehabCosts": number,
  "potentialRent": number,
  "arv": number,
  "rentCastEstimates": {
    "price": number,
    "priceLow": number,
    "priceHigh": number,
    "rent": number,
    "rentLow": number,
    "rentHigh": number
  },
  "hasRentcastData": boolean,
  "notes": "string",
  "score": number,
  "zillowLink": "string"
}
```
- **Response**: Updated Property object with same schema as request
- **Error Responses**:
  - 404: Property with specified ID not found

### Archive Property
- **Method**: PUT
- **Endpoint**: `/api/Properties/{id}/archive`
- **URL Parameters**:
  - `id` (string, required): The property ID
- **Response**: No content (204)

### Update Property Rentcast Data
- **Method**: PUT
- **Endpoint**: `/api/Properties/{id}/rentcast`
- **URL Parameters**:
  - `id` (string, required): The property ID
- **Response**: Updated Property object with Rentcast data
- **Error Responses**:
  - 404: Property with specified ID not found
  - 400: Error calling Rentcast API

## Error Responses
- **400 Bad Request**: Invalid input or validation errors
- **404 Not Found**: Resource not found
- **500 Internal Server Error**: Server-side error

## Notes
- All endpoints return JSON responses
- Dates should be in ISO 8601 format
- All numeric values should be sent as numbers, not strings
- Status values can be one of: "Opportunity", "Soft Offer", "Hard Offer", "Rehab"
- Score is calculated based on:
  - Rent to price ratio (1% or higher) - 4 points
  - ARV ratio (80% or higher) - 3 points
  - Discount (85% or higher) - 2 points
  - Rehab costs less than 50K - 1 point
- The `hasRentcastData` property indicates whether Rentcast valuation data has been applied to the property 