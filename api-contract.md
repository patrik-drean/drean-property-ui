# Property Analyzer API Contract

## Environment URLs
- **Local**: `http://localhost:5271`
- **Production**: `https://p7mxmmgxaw.us-west-2.awsapprunner.com/`

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
    "zillowLink": "string",
    "squareFootage": number | null
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
  "zillowLink": "string",
  "squareFootage": number | null
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
  "zillowLink": "string",
  "squareFootage": number | null
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
  "zillowLink": "string",
  "squareFootage": number | null
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

## Property Lead Endpoints

### Get All Property Leads
- **Method**: GET
- **Endpoint**: `/api/PropertyLeads`
- **Query Parameters**: 
  - `showArchived` (boolean, optional): Filter by archived status
    - `null` or not specified: Return only non-archived leads (default)
    - `true`: Return only archived leads
    - `false`: Return only non-archived leads
  - `tags` (array of strings, optional): Filter by tags (comma-separated)
  - `converted` (boolean, optional): Filter by conversion status
    - `null` or not specified: Return all leads regardless of conversion status (default)
    - `true`: Return only leads converted to properties
    - `false`: Return only leads not converted to properties
- **Response**: Array of PropertyLead objects
```json
[
  {
    "id": "string",
    "address": "string",
    "zillowLink": "string",
    "listingPrice": number,
    "sellerPhone": "string",
    "sellerEmail": "string",
    "lastContactDate": "string" | null,
    "createdAt": "string",
    "updatedAt": "string",
    "archived": boolean,
    "tags": ["string"],
    "convertedToProperty": boolean,
    "squareFootage": number | null
  }
]
```

### Get Property Lead by ID
- **Method**: GET
- **Endpoint**: `/api/PropertyLeads/{id}`
- **URL Parameters**:
  - `id` (string, required): The property lead ID
- **Response**: Single PropertyLead object
```json
{
  "id": "string",
  "address": "string",
  "zillowLink": "string",
  "listingPrice": number,
  "sellerPhone": "string",
  "sellerEmail": "string",
  "lastContactDate": "string" | null,
  "createdAt": "string",
  "updatedAt": "string",
  "archived": boolean,
  "tags": ["string"],
  "convertedToProperty": boolean,
  "squareFootage": number | null
}
```
- **Error Responses**:
  - 404: Property lead with specified ID not found

### Create Property Lead
- **Method**: POST
- **Endpoint**: `/api/PropertyLeads`
- **Request Body**: CreatePropertyLead object
```json
{
  "address": "string",
  "zillowLink": "string",
  "listingPrice": number,
  "sellerPhone": "string",
  "sellerEmail": "string",
  "tags": ["string"],
  "squareFootage": number | null
}
```
- **Response**: Created PropertyLead object
- **Error Responses**:
  - 409: Property lead with this address already exists

### Create Multiple Property Leads (Batch)
- **Method**: POST
- **Endpoint**: `/api/PropertyLeads/batch`
- **Request Body**: BatchCreatePropertyLeads object
```json
{
  "leads": [
    {
      "address": "string",
      "zillowLink": "string",
      "listingPrice": number,
      "sellerPhone": "string",
      "sellerEmail": "string",
      "tags": ["string"],
      "squareFootage": number | null
    }
  ]
}
```
- **Response**: BatchCreateResponse object
```json
{
  "successCount": number,
  "leads": [
    {
      "id": "string",
      "address": "string",
      "zillowLink": "string",
      "listingPrice": number,
      "sellerPhone": "string",
      "sellerEmail": "string",
      "lastContactDate": "string" | null,
      "createdAt": "string",
      "updatedAt": "string",
      "archived": boolean,
      "tags": ["string"],
      "convertedToProperty": boolean,
      "squareFootage": number | null
    }
  ],
  "errorCount": number,
  "errors": ["string"]
}
```

### Update Property Lead
- **Method**: PUT
- **Endpoint**: `/api/PropertyLeads/{id}`
- **URL Parameters**:
  - `id` (string, required): The property lead ID
- **Request Body**: UpdatePropertyLead object
```json
{
  "address": "string",
  "zillowLink": "string",
  "listingPrice": number,
  "sellerPhone": "string",
  "sellerEmail": "string",
  "lastContactDate": "string" | null,
  "archived": boolean,
  "tags": ["string"],
  "convertedToProperty": boolean,
  "squareFootage": number | null
}
```
- **Response**: Updated PropertyLead object
- **Error Responses**:
  - 404: Property lead with specified ID not found

### Delete Property Lead
- **Method**: DELETE
- **Endpoint**: `/api/PropertyLeads/{id}`
- **URL Parameters**:
  - `id` (string, required): The property lead ID
- **Response**: No content (204)
- **Error Responses**:
  - 404: Property lead with specified ID not found

### Archive Property Lead
- **Method**: PUT
- **Endpoint**: `/api/PropertyLeads/{id}/archive`
- **URL Parameters**:
  - `id` (string, required): The property lead ID
- **Response**: No content (204)
- **Error Responses**:
  - 404: Property lead with specified ID not found

### Convert Property Lead
- **Method**: PUT
- **Endpoint**: `/api/PropertyLeads/{id}/convert`
- **URL Parameters**:
  - `id` (string, required): The property lead ID
- **Response**: No content (204)
- **Error Responses**:
  - 404: Property lead with specified ID not found

## Error Responses
- **400 Bad Request**: Invalid input or validation errors
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists
- **500 Internal Server Error**: Server-side error

## Notes
- All endpoints return JSON responses
- Dates should be in ISO 8601 format
- All numeric values should be sent as numbers, not strings
- The `lastContactDate` field is optional and can be null
- Property leads are stored separately from properties and can be used to track potential deals before they become actual property opportunities
- Batch creation allows for importing multiple leads at once and provides detailed success/error information for each lead