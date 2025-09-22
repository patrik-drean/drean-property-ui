export type PropertyStatus = 'Opportunity' | 'Soft Offer' | 'Hard Offer' | 'Rehab' | 'Operational' | 'Needs Tenant' | 'Selling';

export interface RentCastEstimates {
    price: number;
    priceLow: number;
    priceHigh: number;
    rent: number;
    rentLow: number;
    rentHigh: number;
}

export interface TodoMetaData {
    todoistSectionId: string | null;
}

export interface StatusHistory {
    status: string;
    dateStart: string;
}

export interface PropertyUnit {
    id: string;
    propertyId: string;
    status: string;
    rent: number;
    notes: string;
    createdAt: string;
    updatedAt: string;
    statusHistory: StatusHistory[];
}

export interface MonthlyExpenses {
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
}

export interface CapitalCosts {
    id: string;
    propertyId: string;
    closingCosts: number;
    upfrontRepairs: number;
    downPayment: number;
    other: number;
    total: number;
    createdAt: string;
    updatedAt: string;
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
    todoMetaData?: TodoMetaData;
    hasRentcastData: boolean;
    notes: string;
    score: number;
    zillowLink: string;
    squareFootage: number | null;
    units: number | null;
    actualRent: number;
    currentHouseValue: number;
    currentLoanValue: number | null;
    propertyUnits: PropertyUnit[];
    monthlyExpenses: MonthlyExpenses | null;
    capitalCosts: CapitalCosts | null;
    archived?: boolean;
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
    units: number | null;
    notes: string;
}

export interface CreatePropertyLead {
    address: string;
    zillowLink: string;
    listingPrice: number;
    sellerPhone: string;
    sellerEmail: string;
    tags?: string[];
    squareFootage?: number | null;
    units?: number | null;
    notes?: string;
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
    units?: number | null;
    notes?: string;
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

export interface Note {
    id: string;
    content: string;
    createdBy: string;
    propertyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateNote {
    content: string;
    createdBy: string;
    propertyId: string;
}

export interface Link {
    id: string;
    url: string;
    title: string;
    moreDetails: string;
    propertyId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateLink {
    url: string;
    title: string;
    moreDetails: string;
    propertyId: string;
}

export interface Contact {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    secondaryPhone: string;
    type: string;
    location: string;
    notes: string;
    tags: string[];
    createdAt: string;
    updatedAt: string;
    relatedPropertyIds: string[];
}

export interface CreateContact {
    name: string;
    email: string;
    phone: string;
    company: string;
    secondaryPhone: string;
    type: string;
    location: string;
    notes: string;
    tags: string[];
}

export interface UpdateContact {
    id: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    secondaryPhone: string;
    type: string;
    location: string;
    notes: string;
    tags: string[];
}