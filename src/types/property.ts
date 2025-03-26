export type PropertyStatus = 'Opportunity' | 'Soft Offer' | 'Hard Offer' | 'Rehab';

export interface RentcastData {
    price: number;
    priceRangeLow: number;
    priceRangeHigh: number;
    rent: number;
    rentRangeLow: number;
    rentRangeHigh: number;
}

export interface Property {
    id: string;
    address: string;
    zillowLink?: string;
    status: PropertyStatus;
    listingPrice: number;
    offerPrice: number;
    rehabCosts: number;
    potentialRent: number;
    arv: number;
    estimatedRent?: number;
    estimatedRentLow?: number;
    estimatedRentHigh?: number;
    estimatedPrice?: number;
    estimatedPriceLow?: number;
    estimatedPriceHigh?: number;
    rentToPriceRatio: number;
    arvRatio: number;
    discount: number;
    notes: string;
    score: number;
    archived: boolean;
} 