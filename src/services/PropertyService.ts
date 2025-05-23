import axios from 'axios';
import { Property } from '../types/todo';

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
  hasRentcastData: boolean;
  notes: string;
  score: number;
  zillowLink: string;
  squareFootage: number | null;
}

// Convert API PropertyDTO to our frontend Property type
const mapDTOToProperty = (dto: PropertyDTO): Property => {
  return {
    id: dto.id,
    name: dto.address, // Using address as the property name
    address: dto.address,
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