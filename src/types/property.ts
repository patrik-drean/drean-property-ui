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
    notes: string;
    score: number;
    zillowLink: string;
}