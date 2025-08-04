import axios from 'axios';
import { Property } from '../types/property';
// If Property is needed, import from property types:
// import { Property } from '../types/property';

// Define the base URL from the environment or use a default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://p7mxmmgxaw.us-west-2.awsapprunner.com';

// Define the PropertyDTO from the API
interface PropertyDTO {
  id: string;
  address: string;
  status: string;
  listingPrice: number;
  offerPrice: number;
  rehabCosts: number;
  potentialRent: number;
  arv: number;
  rentCastEstimates: {
    price: number;
    priceLow: number;
    priceHigh: number;
    rent: number;
    rentLow: number;
    rentHigh: number;
  };
  todoMetaData?: {
    todoistSectionId: string | null;
  };
  hasRentcastData: boolean;
  notes: string;
  score: number;
  zillowLink: string;
  squareFootage: number | null;
  units: number | null;
  actualRent: number;
  currentHouseValue: number;
  propertyUnits: {
    id: string;
    propertyId: string;
    status: string;
    rent: number;
    notes: string;
    createdAt: string;
    updatedAt: string;
  }[];
  monthlyExpenses: {
    id: string;
    propertyId: string;
    mortgage: number;
    taxes: number;
    insurance: number;
    propertyManagement: number;
    utilities: number;
    vacancy: number;
    capEx: number;
    other: number;
    total: number;
    createdAt: string;
    updatedAt: string;
  } | null;
  capitalCosts: {
    id: string;
    propertyId: string;
    closingCosts: number;
    upfrontRepairs: number;
    downPayment: number;
    other: number;
    total: number;
    createdAt: string;
    updatedAt: string;
  } | null;
}

// Convert API PropertyDTO to our frontend Property type
const mapDTOToProperty = (dto: PropertyDTO): Property => {
  return {
    id: dto.id,
    address: dto.address,
    status: dto.status as any, // You may want to cast or validate this
    listingPrice: dto.listingPrice,
    offerPrice: dto.offerPrice,
    rehabCosts: dto.rehabCosts,
    potentialRent: dto.potentialRent,
    arv: dto.arv,
    rentCastEstimates: dto.rentCastEstimates,
    todoMetaData: dto.todoMetaData || { todoistSectionId: null },
    hasRentcastData: dto.hasRentcastData,
    notes: dto.notes,
    score: dto.score,
    zillowLink: dto.zillowLink,
    squareFootage: dto.squareFootage,
    units: dto.units,
    actualRent: dto.actualRent,
    currentHouseValue: dto.currentHouseValue,
    propertyUnits: dto.propertyUnits,
    monthlyExpenses: dto.monthlyExpenses,
    capitalCosts: dto.capitalCosts,
  };
};

// The PropertyService
const PropertyService = {
  // Fetch all properties
  async getAllProperties(): Promise<Property[]> {
    try {
      const response = await axios.get<PropertyDTO[]>(`${API_BASE_URL}/api/Properties`);
      return response.data.map(mapDTOToProperty);
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get a specific property by ID
  async getPropertyById(id: string): Promise<Property> {
    try {
      const response = await axios.get<PropertyDTO>(`${API_BASE_URL}/api/Properties/${id}`);
      return mapDTOToProperty(response.data);
    } catch (error) {
      console.error(`Error fetching property ${id}:`, error);
      throw error;
    }
  }
};

export default PropertyService; 