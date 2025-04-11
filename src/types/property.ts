export type PropertyStatus = 'Opportunity' | 'Soft Offer' | 'Hard Offer' | 'Rehab';

export interface RentCastEstimates {
    price: number;
    priceLow: number;
    priceHigh: number;
    rent: number;
    rentLow: number;
    rentHigh: number;
}

export interface Property {
    id: string;
    address: string;
    status: PropertyStatus;
    listingPrice: number;
    offerPrice: number;
    rehabCosts: number;
    potentialRent: number;
    arv: number;
    rentCastEstimates: RentCastEstimates;
    hasRentcastData: boolean;
    notes: string;
    score: number;
    zillowLink: string;
    squareFootage: number | null;
}

export interface PropertyLead {
    id: string;
    address: string;
    zillowLink: string;
    listingPrice: number;
    sellerPhone: string;
    sellerEmail: string;
    lastContactDate: string | null;
    createdAt: string;
    updatedAt: string;
    archived: boolean;
    tags: string[];
    convertedToProperty: boolean;
    squareFootage: number | null;
}

export interface CreatePropertyLead {
    address: string;
    zillowLink: string;
    listingPrice: number;
    sellerPhone: string;
    sellerEmail: string;
    tags?: string[];
    squareFootage?: number | null;
}

export interface UpdatePropertyLead {
    address: string;
    zillowLink: string;
    listingPrice: number;
    sellerPhone: string;
    sellerEmail: string;
    lastContactDate: string | null;
    archived?: boolean;
    tags?: string[];
    convertedToProperty?: boolean;
    squareFootage?: number | null;
}

export interface BatchCreatePropertyLeads {
    leads: CreatePropertyLead[];
}

export interface BatchCreateResponse {
    successCount: number;
    leads: PropertyLead[];
    errorCount: number;
    errors: string[];
}