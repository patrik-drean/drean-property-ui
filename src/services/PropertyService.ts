import api from './api';
import { Property } from '../types/property';

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
  saleComparables?: {
    address: string;
    price: number;
    bedrooms: number | null;
    bathrooms: number | null;
    squareFootage: number | null;
    lotSize: number | null;
    yearBuilt: number | null;
    distance: number;
    correlation: number;
    daysOnMarket: number | null;
    status: string | null;
  }[];
  notes: string;
  score: number;
  zillowLink: string;
  squareFootage: number | null;
  units: number | null;
  actualRent: number;
  currentHouseValue: number;
  currentLoanValue: number | null;
  propertyUnits: {
    id: string;
    propertyId: string;
    unitNumber: string;
    status: string;
    rent: number;
    notes: string;
    leaseDate?: string | null;
    dateOfLastRent?: string | null;
    createdAt: string;
    updatedAt: string;
    statusHistory?: {
      status: string;
      dateStart: string;
    }[];
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
    saleComparables: dto.saleComparables || [],
    notes: dto.notes,
    score: dto.score,
    zillowLink: dto.zillowLink,
    squareFootage: dto.squareFootage,
    units: dto.units,
    actualRent: dto.actualRent,
    currentHouseValue: dto.currentHouseValue,
    currentLoanValue: dto.currentLoanValue,
    propertyUnits: dto.propertyUnits.map((unit, index) => ({
      id: unit.id,
      propertyId: unit.propertyId,
      unitNumber: unit.unitNumber || (index + 1).toString(), // Fallback for backwards compatibility
      status: unit.status,
      rent: unit.rent,
      notes: unit.notes,
      leaseDate: unit.leaseDate,
      dateOfLastRent: unit.dateOfLastRent,
      createdAt: unit.createdAt,
      updatedAt: unit.updatedAt,
      statusHistory: unit.statusHistory || [{
        status: unit.status,
        dateStart: unit.createdAt || unit.updatedAt || new Date().toISOString()
      }]
    })),
    monthlyExpenses: dto.monthlyExpenses,
    capitalCosts: dto.capitalCosts,
  };
};

// The PropertyService - uses shared api client with auth interceptors
const PropertyService = {
  // Fetch all properties
  async getAllProperties(): Promise<Property[]> {
    try {
      const response = await api.get<PropertyDTO[]>('/api/Properties');
      return response.data.map(mapDTOToProperty);
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  },

  // Get a specific property by ID
  async getPropertyById(id: string): Promise<Property> {
    try {
      const response = await api.get<PropertyDTO>(`/api/Properties/${id}`);
      return mapDTOToProperty(response.data);
    } catch (error) {
      console.error(`Error fetching property ${id}:`, error);
      throw error;
    }
  }
};

export default PropertyService; 