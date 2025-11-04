# Simplified Property Creation API

## Overview

The Property API now supports a simplified format for creating properties, making it easier for frontend developers to submit property data without needing to construct complex nested objects.

## Endpoint

```
POST /api/v1/properties
```

## Simplified Format

### Minimum Required Fields

```json
{
  "name": "Green Valley Apartments",
  "description": "Modern apartments in Kilimani",
  "propertyType": "apartment",
  "totalUnits": 12,
  "basePrice": 35000
}
```

### Full Example with Simplified Utilities

```json
{
  "name": "Green Valley Apartments",
  "description": "Modern 2-bedroom apartments in the heart of Kilimani",
  "propertyType": "apartment",
  "totalUnits": 12,
  "totalFloors": 4,
  "parkingSpaces": 15,
  "basePrice": 35000,
  "deposit": 35000,

  "street": "Kindaruma Road",
  "area": "Kilimani",
  "city": "Nairobi",
  "county": "Nairobi",
  "landmark": "Near Yaya Centre",

  "utilities": {
    "water": "included",
    "electricity": "tenant",
    "internet": "tenant",
    "gas": "none"
  }
}
```

### Utility Options

For each utility, you can use simple string values:

- `"included"` - Utility is included in rent
- `"tenant"` - Tenant pays separately
- `"none"` - Not available

**Supported utilities:**
- `water`
- `electricity`
- `internet`
- `gas`

### Advanced Format (Full Control)

If you need more control, you can still use the full nested format:

```json
{
  "basicInfo": {
    "name": "Green Valley Apartments",
    "description": "Modern apartments",
    "propertyType": "apartment",
    "totalUnits": 12,
    "totalFloors": 4,
    "parkingSpaces": 15,
    "yearBuilt": 2020
  },
  "location": {
    "address": {
      "street": "Kindaruma Road",
      "area": "Kilimani",
      "city": "Nairobi",
      "county": "Nairobi",
      "postalCode": "00100",
      "landmark": "Near Yaya Centre"
    },
    "coordinates": {
      "type": "Point",
      "coordinates": [36.7833, -1.2833]
    }
  },
  "utilities": {
    "water": {
      "source": "municipal",
      "meterType": "individual",
      "included": true,
      "ratePerUnit": 50
    },
    "electricity": {
      "provider": "Kenya Power",
      "meterType": "prepaid",
      "included": false,
      "ratePerUnit": 20
    },
    "internet": {
      "available": true,
      "provider": "Safaricom",
      "included": false,
      "speed": "10Mbps"
    },
    "gas": {
      "available": false,
      "type": "cylinder",
      "included": false
    }
  },
  "pricing": {
    "basePrice": 35000,
    "priceRange": {
      "min": 30000,
      "max": 40000
    },
    "deposit": {
      "amount": 35000,
      "refundable": true
    }
  }
}
```

## Property Types

Valid property types:
- `apartment`
- `house`
- `studio`
- `bedsitter`
- `mansion`
- `townhouse`
- `compound`

## Defaults

The API automatically sets these defaults if not provided:

- **Location coordinates**: Nairobi center (36.8219, -1.2921)
- **Total units**: 1
- **Total floors**: 1
- **Parking spaces**: 0
- **Occupancy**: Calculated from totalUnits
- **Status**: `pending_approval`
- **Featured**: `false`
- **Verified**: `false`

## Response

### Success (201 Created)

```json
{
  "success": true,
  "message": "Property created successfully",
  "data": {
    "property": {
      "_id": "6549abc123def456...",
      "landlordId": "6549abc123def456...",
      "basicInfo": {
        "name": "Green Valley Apartments",
        "description": "Modern apartments in Kilimani",
        "propertyType": "apartment",
        "totalUnits": 12
      },
      "location": {
        "address": {
          "street": "Kindaruma Road",
          "area": "Kilimani",
          "city": "Nairobi",
          "county": "Nairobi"
        },
        "coordinates": {
          "type": "Point",
          "coordinates": [36.8219, -1.2921]
        }
      },
      "utilities": {
        "water": {
          "source": "municipal",
          "meterType": "individual",
          "included": true
        },
        "electricity": {
          "provider": "Kenya Power",
          "meterType": "prepaid",
          "included": false,
          "ratePerUnit": 20
        }
      },
      "pricing": {
        "basePrice": 35000,
        "priceRange": {
          "min": 35000,
          "max": 35000
        },
        "deposit": {
          "amount": 35000,
          "refundable": true
        }
      },
      "status": "pending_approval",
      "createdAt": "2025-11-04T19:45:00.000Z",
      "updatedAt": "2025-11-04T19:45:00.000Z"
    }
  }
}
```

### Error (422 Validation Error)

```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": 422,
    "details": [
      {
        "field": "basicInfo.name",
        "message": "Property name is required"
      }
    ]
  }
}
```

## Migration Guide

### Old Format (Complex)
```javascript
const propertyData = {
  basicInfo: {
    name: formData.name,
    description: formData.description,
    propertyType: formData.type,
    totalUnits: parseInt(formData.units)
  },
  location: {
    address: {
      street: formData.street,
      area: formData.area,
      city: formData.city,
      county: formData.county
    },
    coordinates: {
      type: 'Point',
      coordinates: [lng, lat]
    }
  },
  utilities: {
    water: {
      included: formData.waterIncluded,
      source: 'municipal',
      meterType: 'individual'
    }
  },
  pricing: {
    basePrice: parseFloat(formData.price),
    priceRange: {
      min: parseFloat(formData.price),
      max: parseFloat(formData.price)
    },
    deposit: {
      amount: parseFloat(formData.deposit)
    }
  },
  occupancy: {
    totalUnits: parseInt(formData.units),
    availableUnits: parseInt(formData.units)
  }
};
```

### New Format (Simplified) ✨
```javascript
const propertyData = {
  name: formData.name,
  description: formData.description,
  propertyType: formData.type,
  totalUnits: parseInt(formData.units),
  basePrice: parseFloat(formData.price),
  deposit: parseFloat(formData.deposit),

  // Address fields at root level
  street: formData.street,
  area: formData.area,
  city: formData.city,
  county: formData.county,

  // Simplified utilities
  utilities: {
    water: formData.waterIncluded ? 'included' : 'tenant',
    electricity: 'tenant',
    internet: 'tenant'
  }
};
```

## Notes

- The simplified format is automatically transformed to the full schema format on the backend
- You can mix simplified and advanced formats (e.g., simplified utilities with full location object)
- All validation rules still apply to the transformed data
- The API is backwards compatible - existing integrations using the full format will continue to work
