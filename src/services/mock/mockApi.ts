import { Property } from '../../types/property';

// Sample property data
const sampleProperties: Property[] = [
  {
    id: '1',
    address: '123 Main St, Anytown, USA',
    status: 'Opportunity',
    listingPrice: 200000,
    offerPrice: 180000,
    rehabCosts: 20000,
    potentialRent: 1800,
    arv: 250000,
    rentCastEstimates: {
      price: 200000,
      priceLow: 190000,
      priceHigh: 210000,
      rent: 1800,
      rentLow: 1700,
      rentHigh: 1900
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: true,
    saleComparables: [],
    notes: 'Good neighborhood, needs some work',
    score: 7,
    zillowLink: 'https://www.zillow.com/homedetails/123-main-st',
    squareFootage: 1800,
    units: 1,
    actualRent: 0,
    currentHouseValue: 0,
    currentLoanValue: null,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null
  },
  {
    id: '2',
    address: '456 Oak Ave, Somewhere, USA',
    status: 'Hard Offer',
    listingPrice: 150000,
    offerPrice: 135000,
    rehabCosts: 15000,
    potentialRent: 1500,
    arv: 190000,
    rentCastEstimates: {
      price: 150000,
      priceLow: 145000,
      priceHigh: 155000,
      rent: 1500,
      rentLow: 1400,
      rentHigh: 1600
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: true,
    saleComparables: [],
    notes: 'Needs new roof and HVAC',
    score: 6,
    zillowLink: 'https://www.zillow.com/homedetails/456-oak-ave',
    squareFootage: 1400,
    units: 1,
    actualRent: 0,
    currentHouseValue: 0,
    currentLoanValue: null,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null
  },
  {
    id: '5',
    address: '999 Wrong St, Mistake, USA',
    status: 'Opportunity',
    listingPrice: 300000,
    offerPrice: 270000,
    rehabCosts: 40000,
    potentialRent: 2200,
    arv: 350000,
    rentCastEstimates: {
      price: 300000,
      priceLow: 285000,
      priceHigh: 315000,
      rent: 2200,
      rentLow: 2100,
      rentHigh: 2300
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: true,
    saleComparables: [],
    notes: 'This property should be archived but is showing in main list',
    score: 8,
    zillowLink: 'https://www.zillow.com/homedetails/999-wrong-st',
    squareFootage: 2000,
    units: 1,
    actualRent: 0,
    currentHouseValue: 0,
    currentLoanValue: null,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null,
    archived: true
  },
  {
    id: '6',
    address: '777 Maple Dr, Success, USA',
    status: 'Operational',
    listingPrice: 0,
    offerPrice: 150000,
    rehabCosts: 0,
    potentialRent: 1600,
    arv: 200000,
    rentCastEstimates: {
      price: 200000,
      priceLow: 190000,
      priceHigh: 210000,
      rent: 1600,
      rentLow: 1500,
      rentHigh: 1700
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: true,
    saleComparables: [],
    notes: 'Currently rented and generating positive cashflow',
    score: 8,
    zillowLink: 'https://www.zillow.com/homedetails/777-maple-dr',
    squareFootage: 1600,
    units: 1,
    actualRent: 0,
    currentHouseValue: 0,
    currentLoanValue: null,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null,
    archived: false
  },
  {
    id: '7',
    address: '888 Cedar Ln, Vacant, USA',
    status: 'Needs Tenant',
    listingPrice: 0,
    offerPrice: 140000,
    rehabCosts: 0,
    potentialRent: 1500,
    arv: 190000,
    rentCastEstimates: {
      price: 190000,
      priceLow: 180000,
      priceHigh: 200000,
      rent: 1500,
      rentLow: 1400,
      rentHigh: 1600
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: true,
    saleComparables: [],
    notes: 'Rehab complete, ready for tenant',
    score: 6,
    zillowLink: 'https://www.zillow.com/homedetails/888-cedar-ln',
    squareFootage: 1500,
    units: 1,
    actualRent: 0,
    currentHouseValue: 0,
    currentLoanValue: null,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null,
    archived: false
  },
  {
    id: '8',
    address: '999 Birch Rd, Exit, USA',
    status: 'Selling',
    listingPrice: 220000,
    offerPrice: 0,
    rehabCosts: 0,
    potentialRent: 0,
    arv: 220000,
    rentCastEstimates: {
      price: 220000,
      priceLow: 210000,
      priceHigh: 230000,
      rent: 0,
      rentLow: 0,
      rentHigh: 0
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: true,
    saleComparables: [],
    notes: 'Ready to sell - good appreciation',
    score: 5,
    zillowLink: 'https://www.zillow.com/homedetails/999-birch-rd',
    squareFootage: 1700,
    units: 1,
    actualRent: 0,
    currentHouseValue: 0,
    currentLoanValue: null,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null,
    archived: false
  }
];

// Archived properties
const archivedProperties: Property[] = [
  {
    id: '3',
    address: '789 Pine Blvd, Elsewhere, USA',
    status: 'Opportunity',
    listingPrice: 180000,
    offerPrice: 160000,
    rehabCosts: 25000,
    potentialRent: 1600,
    arv: 220000,
    rentCastEstimates: {
      price: 180000,
      priceLow: 170000,
      priceHigh: 190000,
      rent: 1600,
      rentLow: 1500,
      rentHigh: 1700
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: true,
    saleComparables: [],
    notes: 'Deal fell through - owner backed out',
    score: 5,
    zillowLink: 'https://www.zillow.com/homedetails/789-pine-blvd',
    squareFootage: 1600,
    units: 1,
    actualRent: 0,
    currentHouseValue: 0,
    currentLoanValue: null,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null,
    archived: true
  },
  {
    id: '4',
    address: '321 Elm St, Nowhere, USA',
    status: 'Rehab',
    listingPrice: 120000,
    offerPrice: 100000,
    rehabCosts: 30000,
    potentialRent: 1400,
    arv: 180000,
    rentCastEstimates: {
      price: 120000,
      priceLow: 115000,
      priceHigh: 125000,
      rent: 1400,
      rentLow: 1300,
      rentHigh: 1500
    },
    todoMetaData: {
      todoistSectionId: null
    },
    hasRentcastData: true,
    saleComparables: [],
    notes: 'Too much work required - not worth it',
    score: 3,
    zillowLink: 'https://www.zillow.com/homedetails/321-elm-st',
    squareFootage: 1200,
    units: 1,
    actualRent: 0,
    currentHouseValue: 0,
    currentLoanValue: null,
    propertyUnits: [],
    monthlyExpenses: null,
    capitalCosts: null,
    archived: true
  }
];

// Mock API functions
export const getProperties = async (showArchived?: boolean): Promise<Property[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (showArchived === true) {
        resolve([...archivedProperties]);
      } else if (showArchived === false) {
        // Filter out archived properties from sample properties
        const nonArchivedProperties = sampleProperties.filter(property => !property.archived);
        resolve(nonArchivedProperties);
      } else {
        // Default behavior: return only non-archived properties
        const nonArchivedProperties = sampleProperties.filter(property => !property.archived);
        resolve(nonArchivedProperties);
      }
    }, 500);
  });
};

export const getProperty = async (address: string): Promise<Property> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const property = sampleProperties.find(p => p.address === address);
      if (property) {
        resolve({...property});
      } else {
        reject(new Error('Property not found'));
      }
    }, 500);
  });
};

export const addProperty = async (property: Omit<Property, 'id'>): Promise<Property> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newProperty = {
        ...property,
        id: Math.random().toString(36).substring(2, 9)
      };
      sampleProperties.push(newProperty);
      resolve(newProperty);
    }, 500);
  });
};

export const updateProperty = async (id: string, property: Omit<Property, 'id'>): Promise<Property> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = sampleProperties.findIndex(p => p.id === id);
      if (index !== -1) {
        const updatedProperty = { ...property, id };
        sampleProperties[index] = updatedProperty;
        resolve(updatedProperty);
      } else {
        // Check if the property is in archived properties (for restoration)
        const archivedIndex = archivedProperties.findIndex(p => p.id === id);
        if (archivedIndex !== -1) {
          // Remove from archived and add to sample properties
          archivedProperties.splice(archivedIndex, 1);
          const restoredProperty = { ...property, id, archived: false };
          sampleProperties.push(restoredProperty);
          resolve(restoredProperty);
        } else {
          reject(new Error('Property not found'));
        }
      }
    }, 500);
  });
};

export const archiveProperty = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = sampleProperties.findIndex(p => p.id === id);
      if (index !== -1) {
        const property = sampleProperties[index];
        sampleProperties.splice(index, 1);
        archivedProperties.push(property);
        resolve();
      } else {
        reject(new Error('Property not found'));
      }
    }, 500);
  });
};

export const updatePropertyRentcast = async (id: string): Promise<Property> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const property = sampleProperties.find(p => p.id === id);
      if (property) {
        // Simulate updating rentcast data
        property.rentCastEstimates = {
          price: property.listingPrice,
          priceLow: property.listingPrice * 0.95,
          priceHigh: property.listingPrice * 1.05,
          rent: property.potentialRent,
          rentLow: property.potentialRent * 0.9,
          rentHigh: property.potentialRent * 1.1
        };
        property.hasRentcastData = true;
        resolve({...property});
      } else {
        reject(new Error('Property not found'));
      }
    }, 500);
  });
};

export const getZillowData = async (url: string): Promise<{ address: string; price: number }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Extract address from URL for demo purposes
      const address = url.split('/').pop() || 'Unknown Address';
      
      resolve({
        address: address.replace(/-/g, ' '),
        price: Math.floor(Math.random() * 300000) + 100000
      });
    }, 500);
  });
};

export const getArchivedProperties = async (): Promise<Property[]> => {
  return getProperties(true);
};

export const restoreProperty = async (id: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = archivedProperties.findIndex(p => p.id === id);
      if (index !== -1) {
        const propertyToRestore = archivedProperties[index];
        archivedProperties.splice(index, 1);
        const restoredProperty = { ...propertyToRestore, archived: false };
        sampleProperties.push(restoredProperty);
        resolve();
      } else {
        reject(new Error('Property not found'));
      }
    }, 500);
  });
}; 