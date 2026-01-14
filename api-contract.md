# Property Analyzer API Contract

## Environment URLs
- **Local**: `http://localhost:8080`
- **Production**: `https://drean-property-api-production.up.railway.app/`

## Authentication

The API supports two authentication methods:

### 1. JWT Bearer Token (Primary - for UI)
Used by the frontend application for user authentication.

```bash
curl -X GET "https://drean-property-api-production.up.railway.app/api/Properties" \
  -H "Authorization: Bearer <jwt-token>"
```

### 2. Service API Key (For Scripts/Admin Operations)
Used for service-level access without requiring JWT tokens. Useful for admin scripts, curl commands, and internal operations.

**Header**: `X-API-Key`

**Service API Key**: `a5f82664848c4e361db7ec3675c961ff49f8125ae0e33376cfddf229e2cb65e3`

```bash
# Example: Get all properties using API key
curl -X GET "https://drean-property-api-production.up.railway.app/api/Properties" \
  -H "X-API-Key: a5f82664848c4e361db7ec3675c961ff49f8125ae0e33376cfddf229e2cb65e3"

# Example: Trigger Rentcast update for a property
curl -X PUT "https://drean-property-api-production.up.railway.app/api/Properties/{id}/rentcast" \
  -H "X-API-Key: a5f82664848c4e361db7ec3675c961ff49f8125ae0e33376cfddf229e2cb65e3"
```

**Notes**:
- API key authenticates as admin user (team@redlunaproperty.com)
- Works for all authenticated endpoints
- If invalid API key is provided, falls back to JWT authentication
- API key usage is logged for audit purposes

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
    "todoMetaData": {
      "todoistSectionId": "string" | null
    },
    "hasRentcastData": boolean,
    "notes": "string",
    "score": number,
    "zillowLink": "string",
    "squareFootage": number | null,
    "units": number | null,
    "actualRent": number,
    "currentHouseValue": number,
    "propertyUnits": [
      {
        "id": "string",
        "propertyId": "string",
        "status": "string",
        "rent": number,
        "notes": "string",
        "createdAt": "string",
p ix        "updatedAt": "string",
        "statusHistory": [
          {
            "status": "string",
            "dateStart": "string"
          }
        ]
      }
    ],
    "monthlyExpenses": {
      "id": "string",
      "propertyId": "string",
      "mortgage": number,
      "taxes": number,
      "insurance": number,
      "propertyManagement": number,
      "utilities": number,
      "vacancy": number,
      "capEx": number,
      "other": number,
      "total": number,
      "createdAt": "string",
      "updatedAt": "string"
    } | null,
    "capitalCosts": {
      "id": "string",
      "propertyId": "string",
      "closingCosts": number,
      "upfrontRepairs": number,
      "downPayment": number,
      "other": number,
      "total": number,
      "createdAt": "string",
      "updatedAt": "string"
    } | null
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
  "todoMetaData": {
    "todoistSectionId": "string" | null
  },
  "hasRentcastData": boolean,
  "notes": "string",
  "score": number,
  "zillowLink": "string",
  "squareFootage": number | null,
  "units": number | null,
  "actualRent": number,
  "currentHouseValue": number,
  "propertyUnits": [
    {
      "id": "string",
      "propertyId": "string",
      "status": "string",
      "rent": number,
      "notes": "string",
      "createdAt": "string",
      "updatedAt": "string",
      "statusHistory": [
        {
          "status": "string",
          "dateStart": "string"
        }
      ]
    }
  ],
  "monthlyExpenses": {
    "id": "string",
    "propertyId": "string",
    "mortgage": number,
    "taxes": number,
    "insurance": number,
    "propertyManagement": number,
    "utilities": number,
    "vacancy": number,
    "capEx": number,
    "other": number,
    "total": number,
    "createdAt": "string",
    "updatedAt": "string"
  } | null,
  "capitalCosts": {
    "id": "string",
    "propertyId": "string",
    "closingCosts": number,
    "upfrontRepairs": number,
    "downPayment": number,
    "other": number,
    "total": number,
    "createdAt": "string",
    "updatedAt": "string"
  } | null
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
  "todoMetaData": {
    "todoistSectionId": "string" | null
  },
  "hasRentcastData": boolean,
  "notes": "string",
  "score": number,
  "zillowLink": "string",
  "squareFootage": number | null,
  "units": number | null,
  "actualRent": number,
  "currentHouseValue": number,
  "propertyUnits": [
    {
      "id": "string",
      "propertyId": "string",
      "status": "string",
      "rent": number,
      "notes": "string",
      "statusHistory": [
        {
          "status": "string",
          "dateStart": "string"
        }
      ]
    }
  ],
  "monthlyExpenses": {
    "id": "string",
    "propertyId": "string",
    "mortgage": number,
    "taxes": number,
    "insurance": number,
    "propertyManagement": number,
    "utilities": number,
    "vacancy": number,
    "capEx": number,
    "other": number
  } | null,
  "capitalCosts": {
    "id": "string",
    "propertyId": "string",
    "closingCosts": number,
    "upfrontRepairs": number,
    "downPayment": number,
    "other": number
  } | null
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
  "todoMetaData": {
    "todoistSectionId": "string" | null
  },
  "hasRentcastData": boolean,
  "notes": "string",
  "score": number,
  "zillowLink": "string",
  "squareFootage": number | null,
  "units": number | null,
  "actualRent": number,
  "currentHouseValue": number,
  "propertyUnits": [
    {
      "id": "string",
      "propertyId": "string",
      "status": "string",
      "rent": number,
      "notes": "string",
      "statusHistory": [
        {
          "status": "string",
          "dateStart": "string"
        }
      ]
    }
  ],
  "monthlyExpenses": {
    "id": "string",
    "propertyId": "string",
    "mortgage": number,
    "taxes": number,
    "insurance": number,
    "propertyManagement": number,
    "utilities": number,
    "vacancy": number,
    "capEx": number,
    "other": number
  } | null,
  "capitalCosts": {
    "id": "string",
    "propertyId": "string",
    "closingCosts": number,
    "upfrontRepairs": number,
    "downPayment": number,
    "other": number
  } | null
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

### Restore Property
- **Method**: PUT
- **Endpoint**: `/api/Properties/{id}/restore`
- **URL Parameters**:
  - `id` (string, required): The property ID
- **Response**: No content (204)
- **Error Responses**:
  - 404: Property with specified ID not found

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
    "respondedDate": "string" | null,
    "convertedDate": "string" | null,
    "underContractDate": "string" | null,
    "soldDate": "string" | null,
    "createdAt": "string",
    "updatedAt": "string",
    "archived": boolean,
    "tags": ["string"],
    "convertedToProperty": boolean,
    "squareFootage": number | null,
    "units": number | null,
    "notes": "string",
    "leadScore": number | null,
    "metadata": "string"
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
  "respondedDate": "string" | null,
  "convertedDate": "string" | null,
  "underContractDate": "string" | null,
  "soldDate": "string" | null,
  "createdAt": "string",
  "updatedAt": "string",
  "archived": boolean,
  "tags": ["string"],
  "convertedToProperty": boolean,
  "squareFootage": number | null,
  "units": number | null,
  "notes": "string",
  "leadScore": number | null,
  "metadata": "string"
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
  "lastContactDate": "string" | null,
  "respondedDate": "string" | null,
  "convertedDate": "string" | null,
  "underContractDate": "string" | null,
  "soldDate": "string" | null,
  "tags": ["string"],
  "squareFootage": number | null,
  "units": number | null,
  "notes": "string",
  "leadScore": number | null,
  "metadata": "string"
}
```
- **Response**: Created PropertyLead object
- **Notes**:
  - Duplicate addresses are allowed for property leads
  - `leadScore` is optional (1-10). If not provided, it will be auto-calculated based on listing price and square footage
  - If square footage is missing or zero, `leadScore` will be `null`
  - If `leadScore` is provided, it must be between 1 and 10 (returns 400 Bad Request if invalid)
  - `metadata` is optional and should be a JSON string (defaults to "{}" if not provided)

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
      "lastContactDate": "string" | null,
      "respondedDate": "string" | null,
      "convertedDate": "string" | null,
      "underContractDate": "string" | null,
      "soldDate": "string" | null,
      "tags": ["string"],
      "squareFootage": number | null,
      "units": number | null,
      "notes": "string",
      "leadScore": number | null,
      "metadata": "string"
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
      "respondedDate": "string" | null,
      "convertedDate": "string" | null,
      "underContractDate": "string" | null,
      "soldDate": "string" | null,
      "createdAt": "string",
      "updatedAt": "string",
      "archived": boolean,
      "tags": ["string"],
      "convertedToProperty": boolean,
      "squareFootage": number | null,
      "units": number | null,
      "notes": "string",
      "leadScore": number | null,
      "metadata": "string"
    }
  ],
  "errorCount": number,
  "errors": ["string"]
}
```
- **Notes**:
  - Duplicate addresses are allowed for property leads in batch creation
  - `leadScore` is optional (1-10) for each lead. If not provided, it will be auto-calculated
  - Invalid `leadScore` values will result in error messages in the `errors` array for that lead

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
  "respondedDate": "string" | null,
  "convertedDate": "string" | null,
  "underContractDate": "string" | null,
  "soldDate": "string" | null,
  "archived": boolean,
  "tags": ["string"],
  "convertedToProperty": boolean,
  "squareFootage": number | null,
  "units": number | null,
  "notes": "string",
  "leadScore": number | null,
  "metadata": "string"
}
```
- **Response**: Updated PropertyLead object
- **Notes**:
  - `leadScore` will be automatically recalculated if `listingPrice` or `squareFootage` changes (unless an explicit `leadScore` is provided)
  - If `leadScore` is provided, it must be between 1 and 10 (returns 400 Bad Request if invalid)
  - `metadata` is optional and can be updated by clients. Should be a JSON string (defaults to "{}" if not provided)
- **Error Responses**:
  - 404: Property lead with specified ID not found
  - 400: Invalid `leadScore` value (must be 1-10)

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

## Todo Endpoints

### Get All Todos
- **Method**: GET
- **Endpoint**: `/api/Todo`
- **Query Parameters**: 
  - `propertyId` (string, optional): Filter todos by property ID
- **Response**: Array of Todo objects
```json
[
  {
    "id": "string",
    "title": "string",
    "description": "string",
    "dueDate": "string",
    "completed": boolean,
    "priority": "string",
    "propertyId": "string" | null,
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Get Todo by ID
- **Method**: GET
- **Endpoint**: `/api/Todo/{id}`
- **URL Parameters**:
  - `id` (string, required): The todo ID
- **Response**: Single Todo object
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "dueDate": "string",
  "completed": boolean,
  "priority": "string",
  "propertyId": "string" | null,
  "createdAt": "string",
  "updatedAt": "string"
}
```
- **Error Responses**:
  - 404: Todo with specified ID not found

### Create Todo
- **Method**: POST
- **Endpoint**: `/api/Todo`
- **Request Body**: Todo object
```json
{
  "title": "string",
  "description": "string",
  "dueDate": "string",
  "completed": boolean,
  "priority": "string",
  "propertyId": "string" | null
}
```
- **Response**: Created Todo object with ID
- **Note**: `createdAt` and `updatedAt` are automatically set by the server

### Update Todo
- **Method**: PUT
- **Endpoint**: `/api/Todo/{id}`
- **URL Parameters**:
  - `id` (string, required): The todo ID
- **Request Body**: Todo object
```json
{
  "id": "string",
  "title": "string",
  "description": "string",
  "dueDate": "string",
  "completed": boolean,
  "priority": "string",
  "propertyId": "string" | null
}
```
- **Response**: Updated Todo object
- **Error Responses**:
  - 404: Todo with specified ID not found
  - 400: ID mismatch between URL and request body

### Delete Todo
- **Method**: DELETE
- **Endpoint**: `/api/Todo/{id}`
- **URL Parameters**:
  - `id` (string, required): The todo ID
- **Response**: No content (204)

## Link Endpoints

### Get All Links
- **Method**: GET
- **Endpoint**: `/api/Links`
- **Response**: Array of Link objects
```json
[
  {
    "id": "string",
    "url": "string",
    "title": "string",
    "moreDetails": "string",
    "propertyId": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Get Links by Property ID
- **Method**: GET
- **Endpoint**: `/api/Links/property/{propertyId}`
- **URL Parameters**:
  - `propertyId` (string, required): The property ID
- **Response**: Array of Link objects for the specified property

### Get Link by ID
- **Method**: GET
- **Endpoint**: `/api/Links/{id}`
- **URL Parameters**:
  - `id` (string, required): The link ID
- **Response**: Single Link object
```json
{
  "id": "string",
  "url": "string",
  "title": "string",
  "moreDetails": "string",
  "propertyId": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```
- **Error Responses**:
  - 404: Link with specified ID not found

### Create Link
- **Method**: POST
- **Endpoint**: `/api/Links`
- **Request Body**: Link object
```json
{
  "url": "string",
  "title": "string",
  "moreDetails": "string",
  "propertyId": "string"
}
```
- **Response**: Created Link object with ID

### Update Link
- **Method**: PUT
- **Endpoint**: `/api/Links/{id}`
- **URL Parameters**:
  - `id` (string, required): The link ID
- **Request Body**: Link object
```json
{
  "id": "string",
  "url": "string",
  "title": "string",
  "moreDetails": "string",
  "propertyId": "string"
}
```
- **Response**: Updated Link object
- **Error Responses**:
  - 404: Link with specified ID not found
  - 400: ID mismatch between URL and request body

### Delete Link
- **Method**: DELETE
- **Endpoint**: `/api/Links/{id}`
- **URL Parameters**:
  - `id` (string, required): The link ID
- **Response**: No content (204)

## Note Endpoints

### Get All Notes
- **Method**: GET
- **Endpoint**: `/api/Notes`
- **Response**: Array of Note objects
```json
[
  {
    "id": "string",
    "content": "string",
    "createdBy": "string",
    "propertyId": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Get Notes by Property ID
- **Method**: GET
- **Endpoint**: `/api/Notes/property/{propertyId}`
- **URL Parameters**:
  - `propertyId` (string, required): The property ID
- **Response**: Array of Note objects for the specified property

### Get Note by ID
- **Method**: GET
- **Endpoint**: `/api/Notes/{id}`
- **URL Parameters**:
  - `id` (string, required): The note ID
- **Response**: Single Note object
```json
{
  "id": "string",
  "content": "string",
  "createdBy": "string",
  "propertyId": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```
- **Error Responses**:
  - 404: Note with specified ID not found

### Create Note
- **Method**: POST
- **Endpoint**: `/api/Notes`
- **Request Body**: Note object
```json
{
  "content": "string",
  "createdBy": "string",
  "propertyId": "string"
}
```
- **Response**: Created Note object with ID

### Update Note
- **Method**: PUT
- **Endpoint**: `/api/Notes/{id}`
- **URL Parameters**:
  - `id` (string, required): The note ID
- **Request Body**: Note object
```json
{
  "id": "string",
  "content": "string",
  "createdBy": "string",
  "propertyId": "string"
}
```
- **Response**: Updated Note object
- **Error Responses**:
  - 404: Note with specified ID not found
  - 400: ID mismatch between URL and request body

### Delete Note
- **Method**: DELETE
- **Endpoint**: `/api/Notes/{id}`
- **URL Parameters**:
  - `id` (string, required): The note ID
- **Response**: No content (204)

## Contact Endpoints

### Get All Contacts
- **Method**: GET
- **Endpoint**: `/api/Contacts`
- **Response**: Array of Contact objects
```json
[
  {
    "id": "string",
    "name": "string",
    "email": "string",
    "phone": "string",
    "secondaryPhone": "string" | null,
    "type": "string",
    "location": "string",
    "company": "string" | null,
    "notes": "string",
    "tags": ["string"],
    "createdAt": "string",
    "updatedAt": "string",
    "relatedPropertyIds": ["string"]
  }
]
```

### Get Contacts by Property ID
- **Method**: GET
- **Endpoint**: `/api/Contacts/property/{propertyId}`
- **URL Parameters**:
  - `propertyId` (string, required): The property ID
- **Response**: Array of Contact objects for the specified property

### Get Contact by ID
- **Method**: GET
- **Endpoint**: `/api/Contacts/{id}`
- **URL Parameters**:
  - `id` (string, required): The contact ID
- **Response**: Single Contact object
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "secondaryPhone": "string" | null,
  "type": "string",
  "location": "string",
  "company": "string" | null,
  "notes": "string",
  "tags": ["string"],
  "createdAt": "string",
  "updatedAt": "string",
  "relatedPropertyIds": ["string"]
}
```
- **Error Responses**:
  - 404: Contact with specified ID not found

### Create Contact
- **Method**: POST
- **Endpoint**: `/api/Contacts`
- **Request Body**: Contact object
```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "secondaryPhone": "string" | null,
  "type": "string",
  "location": "string",
  "company": "string" | null,
  "notes": "string",
  "tags": ["string"]
}
```
- **Response**: Created Contact object with ID

### Update Contact
- **Method**: PUT
- **Endpoint**: `/api/Contacts/{id}`
- **URL Parameters**:
  - `id` (string, required): The contact ID
- **Request Body**: Contact object
```json
{
  "id": "string",
  "name": "string",
  "email": "string",
  "phone": "string",
  "secondaryPhone": "string" | null,
  "type": "string",
  "location": "string",
  "company": "string" | null,
  "notes": "string",
  "tags": ["string"]
}
```
- **Response**: Updated Contact object
- **Error Responses**:
  - 404: Contact with specified ID not found
  - 400: ID mismatch between URL and request body

### Delete Contact
- **Method**: DELETE
- **Endpoint**: `/api/Contacts/{id}`
- **URL Parameters**:
  - `id` (string, required): The contact ID
- **Response**: No content (204)

### Add Contact to Property
- **Method**: POST
- **Endpoint**: `/api/Contacts/{contactId}/properties/{propertyId}`
- **URL Parameters**:
  - `contactId` (string, required): The contact ID
  - `propertyId` (string, required): The property ID
- **Response**: No content (204)

### Remove Contact from Property
- **Method**: DELETE
- **Endpoint**: `/api/Contacts/{contactId}/properties/{propertyId}`
- **URL Parameters**:
  - `contactId` (string, required): The contact ID
  - `propertyId` (string, required): The property ID
- **Response**: No content (204)

## Transaction Endpoints

### Get All Transactions
- **Method**: GET
- **Endpoint**: `/api/transactions`
- **Response**: Array of Transaction objects
```json
[
  {
    "id": "string",
    "date": "string",
    "amount": number,
    "category": "string",
    "propertyId": "string" | null,
    "unit": "string" | null,
    "payee": "string" | null,
    "description": "string" | null,
    "overrideDate": "string" | null,
    "expenseType": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
]
```

### Get Transaction by ID
- **Method**: GET
- **Endpoint**: `/api/transactions/{id}`
- **URL Parameters**:
  - `id` (string, required): The transaction ID
- **Response**: Single Transaction object
```json
{
  "id": "string",
  "date": "string",
  "amount": number,
  "category": "string",
  "propertyId": "string" | null,
  "unit": "string" | null,
  "payee": "string" | null,
  "description": "string" | null,
  "overrideDate": "string" | null,
  "expenseType": "string",
  "createdAt": "string",
  "updatedAt": "string"
}
```
- **Error Responses**:
  - 404: Transaction with specified ID not found

### Get Transactions by Property
- **Method**: GET
- **Endpoint**: `/api/transactions/property/{propertyId}`
- **URL Parameters**:
  - `propertyId` (string, required): The property ID
- **Response**: Array of Transaction objects for the specified property

### Create Transaction
- **Method**: POST
- **Endpoint**: `/api/transactions`
- **Request Body**: TransactionCreate object
```json
{
  "date": "string",
  "amount": number,
  "category": "string",
  "propertyId": "string" | null,
  "unit": "string" | null,
  "payee": "string" | null,
  "description": "string" | null,
  "overrideDate": "string" | null,
  "expenseType": "string" | null
}
```
- **Response**: Created Transaction object with ID
- **Notes**:
  - `date` format: ISO 8601 (e.g., "2025-09-15")
  - `amount`: Positive for income, negative for expenses
  - `expenseType`: "Operating" or "Capital" (defaults to "Operating" if not provided)
  - `overrideDate`: Optional date for reporting purposes (different from actual transaction date)

### Update Transaction
- **Method**: PUT
- **Endpoint**: `/api/transactions/{id}`
- **URL Parameters**:
  - `id` (string, required): The transaction ID
- **Request Body**: TransactionUpdate object
```json
{
  "date": "string",
  "amount": number,
  "category": "string",
  "propertyId": "string" | null,
  "unit": "string" | null,
  "payee": "string" | null,
  "description": "string" | null,
  "overrideDate": "string" | null,
  "expenseType": "string" | null
}
```
- **Response**: Updated Transaction object
- **Error Responses**:
  - 404: Transaction with specified ID not found

### Delete Transaction
- **Method**: DELETE
- **Endpoint**: `/api/transactions/{id}`
- **URL Parameters**:
  - `id` (string, required): The transaction ID
- **Response**: No content (204)
- **Error Responses**:
  - 404: Transaction with specified ID not found

### Get All Transaction Categories
- **Method**: GET
- **Endpoint**: `/api/transactions/categories`
- **Response**: Array of TransactionCategory objects
```json
[
  {
    "id": "string",
    "name": "string",
    "type": "string",
    "defaultExpenseType": "string" | null,
    "displayOrder": number
  }
]
```
- **Notes**:
  - `type`: "Income" or "Expense"
  - `defaultExpenseType`: "Operating" or "Capital" (for expense categories)
  - Categories are sorted by `displayOrder`

### Validate CSV Import
- **Method**: POST
- **Endpoint**: `/api/transactions/import/validate`
- **Request Body**:
```json
{
  "csvText": "string"
}
```
- **Response**: Validation result
```json
{
  "validTransactions": [],
  "errors": [
    {
      "line": number,
      "message": "string"
    }
  ],
  "validCount": number,
  "errorCount": number
}
```
- **Notes**:
  - CSV format: `date,amount,category,property,unit,description,override_date,payee,expense_type`
  - First row should be headers
  - Validates data without importing

### Import Transactions from CSV
- **Method**: POST
- **Endpoint**: `/api/transactions/import`
- **Request Body**:
```json
{
  "csvText": "string"
}
```
- **Response**: Array of imported Transaction objects
- **Notes**:
  - CSV format: `date,amount,category,property,unit,description,override_date,payee,expense_type`
  - First row should be headers
  - Creates transactions for all valid rows

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
- **TodoMetaData Integration**: The `todoMetaData` field stores Todoist integration metadata:
  - `todoistSectionId`: Links properties to specific sections in Todoist for task organization
  - This field is optional and can be null if no Todoist integration is configured
  - Used for synchronizing property-related tasks with external Todoist project management
- **Production PostgreSQL is hosted on Railway.**
- **Environment variables for Railway deployment:**
  - `DATABASE_URL` (use the Railway-provided proxy URL for local dev)
  - `RAILWAY_ENVIRONMENT=true`
  - `ASPNETCORE_ENVIRONMENT=Production` (or `Development` for local)

## New Property Fields (Added 2024)

### Property Units
- **`propertyUnits`**: Array of Unit objects representing individual rental units within a property
- **Unit Status Values**: 
  - `"Vacant"`: Unit is currently unoccupied
  - `"Behind On Rent"`: Tenant is behind on rent payments
  - `"Operational"`: Unit is occupied and generating rent
- **Architecture**: Units are designed to be potentially separable into their own entity in the future

### Monthly Expenses
- **`monthlyExpenses`**: Object containing all monthly expense categories
- **Fields**: All numeric values representing monthly costs
  - `mortgage`: Monthly mortgage payment
  - `taxes`: Monthly property taxes
  - `insurance`: Monthly insurance premium
  - `propertyManagement`: Monthly property management fees
  - `utilities`: Monthly utility costs
  - `vacancy`: Monthly vacancy allowance
  - `capEx`: Monthly capital expenditure allowance
  - `other`: Other monthly expenses
  - `total`: Calculated total of all monthly expenses

### Capital Costs
- **`capitalCosts`**: Object containing all upfront capital costs
- **Fields**: All numeric values representing one-time costs
  - `closingCosts`: Property closing costs
  - `upfrontRepairs`: Initial repair costs
  - `downPayment`: Down payment amount
  - `other`: Other capital costs
  - `total`: Calculated total of all capital costs

### Additional Property Fields
- **`actualRent`**: Sum of all unit rent values (calculated field)
- **`currentHouseValue`**: Current market value of the property

### Unit Status History Tracking
- **`statusHistory`**: Array of StatusHistory objects tracking unit status changes over time
- **StatusHistory Object**:
  - `status`: The status value at the time of the change
  - `dateStart`: ISO 8601 timestamp when the unit entered this status
- **Purpose**: Allows frontend to calculate how many days a unit has been in its current status
- **Frontend Responsibility**: The frontend is responsible for providing the complete status history array when updating units
- **Usage Pattern**:
  - When creating a new unit, include initial status history: `[{"status": "Vacant", "dateStart": "2025-01-15T10:30:00Z"}]`
  - When changing status, append new entry: `[{"status": "Vacant", "dateStart": "2025-01-15T10:30:00Z"}, {"status": "Operational", "dateStart": "2025-01-20T14:45:00Z"}]`
- **Benefits**: Frontend controls timing, handles offline scenarios, and provides better user experience

## Property Lead Score and Metadata (Added 2024-12-26)

### Lead Score
- **`leadScore`**: Integer field (1-10) representing lead quality based on listing price to ARV ratio
- **Score Range**: 1 (worst deal) to 10 (best deal), or `null` if insufficient data
- **Auto-Calculation**: Backend automatically calculates score using formula: `ARV = squareFootage × $160/sqft`
  - Score based on `listingPrice / ARV` ratio:
    - **10** (Best): 55% or lower
    - **9**: 55-60%
    - **8**: 60-65%
    - **7**: 65-70%
    - **6**: 70-75%
    - **5**: 75-80%
    - **4**: 80-85%
    - **3**: 85-90%
    - **2**: 90-95%
    - **1** (Worst): 95% or higher
- **Client Override**: Clients can provide explicit `leadScore` value (1-10) to override auto-calculation
- **Validation**:
  - If provided, must be between 1 and 10 (inclusive)
  - Invalid values return 400 Bad Request with error message
  - Returns `null` if `squareFootage` is missing or zero
- **Recalculation**: Score automatically recalculates on update if `listingPrice` or `squareFootage` changes (unless client provides explicit override)
- **Frontend Fallback**: Frontend can calculate score client-side if backend returns `null`

### Metadata
- **`metadata`**: JSON string containing flexible key-value pairs for lead information
- **Purpose**: Stores dynamic lead data like Zestimate, Property Grade, Rent Estimate, Days on Market, etc.
- **Client-Editable**: Clients can read and write metadata via API in create/update operations
- **Storage**: Stored as JSON string in PostgreSQL text column
- **Default**: Empty JSON object `"{}"` for new leads
- **Format**: Must be a valid JSON string. Clients should serialize objects to JSON strings before sending
- **Example Structure** (as JSON string):
```json
"{\"propertyGrade\":\"A\",\"zestimate\":450000,\"rentEstimate\":3500.50,\"daysOnMarket\":45,\"hasPool\":true}"
```
- **Example Parsed Object**:
```json
{
  "propertyGrade": "A",
  "zestimate": 450000,
  "rentEstimate": 3500.50,
  "daysOnMarket": 45,
  "hasPool": true
}
```
- **Use Case**: Can be populated by clients, backend integrations (Zillow API, RentCast, etc.), or both for display in frontend tooltips and UI

### Stage Tracking Fields (Added 2024-12-26)
- **`lastContactDate`**: ISO 8601 timestamp when lead was last contacted
- **`respondedDate`**: ISO 8601 timestamp when lead responded
- **`convertedDate`**: ISO 8601 timestamp when lead converted to property
- **`underContractDate`**: ISO 8601 timestamp when property went under contract
- **`soldDate`**: ISO 8601 timestamp when property was sold
- **Purpose**: Track lead progression through sales funnel stages
- **All Optional**: Can be `null` if stage not reached