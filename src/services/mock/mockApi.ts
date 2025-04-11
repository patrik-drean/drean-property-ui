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
    hasRentcastData: true,
    notes: 'Good neighborhood, needs some work',
    score: 7,
    zillowLink: 'https://www.zillow.com/homedetails/123-main-st',
    squareFootage: 1800
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
    hasRentcastData: true,
    notes: 'Needs new roof and HVAC',
    score: 6,
    zillowLink: 'https://www.zillow.com/homedetails/456-oak-ave',
    squareFootage: 1400
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
    hasRentcastData: true,
    notes: 'Deal fell through - owner backed out',
    score: 5,
    zillowLink: 'https://www.zillow.com/homedetails/789-pine-blvd',
    squareFootage: 1600
  }
];

// Mock API functions
export const getProperties = async (): Promise<Property[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...sampleProperties]), 500);
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
        reject(new Error('Property not found'));
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
  return new Promise((resolve) => {
    setTimeout(() => resolve([...archivedProperties]), 500);
  });
};

export const restoreProperty = async (id: string, property: Property): Promise<void> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const index = archivedProperties.findIndex(p => p.id === id);
      if (index !== -1) {
        const property = archivedProperties[index];
        archivedProperties.splice(index, 1);
        sampleProperties.push(property);
        resolve();
      } else {
        reject(new Error('Property not found'));
      }
    }, 500);
  });
}; 