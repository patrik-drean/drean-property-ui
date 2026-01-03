import { useState, useCallback } from 'react';
import { Property, MonthlyExpenses, CapitalCosts, PropertyStatus, RentCastEstimates, PropertyUnit, TodoMetaData, SaleComparable } from '../types/property';

export interface PropertyFormData {
  address: string;
  status: PropertyStatus;
  propertyLeadId: string | null;
  listingPrice: number;
  offerPrice: number;
  rehabCosts: number;
  potentialRent: number;
  arv: number;
  rentCastEstimates: RentCastEstimates;
  todoMetaData: TodoMetaData;
  hasRentcastData: boolean;
  saleComparables: SaleComparable[];
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
}

export interface ValidationErrors {
  address?: string;
  listingPrice?: string;
  offerPrice?: string;
  arv?: string;
  potentialRent?: string;
  status?: string;
}

export interface UsePropertyFormReturn {
  formData: PropertyFormData;
  errors: ValidationErrors;
  isDirty: boolean;
  updateField: <K extends keyof PropertyFormData>(field: K, value: PropertyFormData[K]) => void;
  updateExpense: (field: keyof Omit<MonthlyExpenses, 'id' | 'propertyId' | 'createdAt' | 'updatedAt' | 'total'>, value: number) => void;
  updateCapitalCost: (field: keyof Omit<CapitalCosts, 'id' | 'propertyId' | 'createdAt' | 'updatedAt' | 'total'>, value: number) => void;
  addUnit: () => void;
  updateUnit: (index: number, field: string, value: string | number) => void;
  updateUnitStatus: (index: number, newStatus: string, statusChangeDate: string) => void;
  removeUnit: (index: number) => void;
  calculateTotals: () => void;
  validate: () => boolean;
  reset: (initialData?: Property) => void;
  getSubmitData: () => Omit<Property, 'id'>;
}

const createEmptyExpenses = (): MonthlyExpenses => ({
  id: '',
  propertyId: '',
  mortgage: 0,
  taxes: 0,
  insurance: 0,
  propertyManagement: 0,
  utilities: 0,
  vacancy: 0,
  capEx: 0,
  other: 0,
  total: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const createEmptyCapitalCosts = (): CapitalCosts => ({
  id: '',
  propertyId: '',
  closingCosts: 0,
  upfrontRepairs: 0,
  downPayment: 0,
  other: 0,
  total: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
});

const createDefaultRentCastEstimates = (): RentCastEstimates => ({
  price: 0,
  priceLow: 0,
  priceHigh: 0,
  rent: 0,
  rentLow: 0,
  rentHigh: 0
});

const createDefaultTodoMetaData = (): TodoMetaData => ({
  todoistSectionId: null
});

function initializeFormData(property?: Property): PropertyFormData {
  if (!property) {
    return {
      address: '',
      status: 'Opportunity',
      propertyLeadId: null,
      listingPrice: 0,
      offerPrice: 0,
      rehabCosts: 0,
      potentialRent: 0,
      arv: 0,
      rentCastEstimates: createDefaultRentCastEstimates(),
      todoMetaData: createDefaultTodoMetaData(),
      hasRentcastData: false,
      saleComparables: [],
      notes: '',
      score: 0,
      zillowLink: '',
      squareFootage: null,
      units: null,
      actualRent: 0,
      currentHouseValue: 0,
      currentLoanValue: null,
      propertyUnits: [],
      monthlyExpenses: null,
      capitalCosts: null
    };
  }

  return {
    address: property.address,
    status: property.status,
    propertyLeadId: property.propertyLeadId || null,
    listingPrice: property.listingPrice,
    offerPrice: property.offerPrice,
    rehabCosts: property.rehabCosts,
    potentialRent: property.potentialRent,
    arv: property.arv,
    rentCastEstimates: property.rentCastEstimates || createDefaultRentCastEstimates(),
    todoMetaData: property.todoMetaData || createDefaultTodoMetaData(),
    hasRentcastData: property.hasRentcastData,
    saleComparables: property.saleComparables || [],
    notes: property.notes,
    score: property.score,
    zillowLink: property.zillowLink,
    squareFootage: property.squareFootage,
    units: property.units,
    actualRent: property.actualRent,
    currentHouseValue: property.currentHouseValue,
    currentLoanValue: property.currentLoanValue,
    propertyUnits: property.propertyUnits || [],
    monthlyExpenses: property.monthlyExpenses,
    capitalCosts: property.capitalCosts
  };
}

function calculateExpenseTotal(expenses: MonthlyExpenses): number {
  return (
    expenses.mortgage +
    expenses.taxes +
    expenses.insurance +
    expenses.propertyManagement +
    expenses.utilities +
    expenses.vacancy +
    expenses.capEx +
    expenses.other
  );
}

function calculateCapitalTotal(costs: CapitalCosts): number {
  return (
    costs.closingCosts +
    costs.upfrontRepairs +
    costs.downPayment +
    costs.other
  );
}

function convertFormDataToProperty(formData: PropertyFormData): Omit<Property, 'id'> {
  return {
    address: formData.address,
    status: formData.status,
    propertyLeadId: formData.propertyLeadId,
    listingPrice: formData.listingPrice,
    offerPrice: formData.offerPrice,
    rehabCosts: formData.rehabCosts,
    potentialRent: formData.potentialRent,
    arv: formData.arv,
    rentCastEstimates: formData.rentCastEstimates,
    todoMetaData: formData.todoMetaData,
    hasRentcastData: formData.hasRentcastData,
    saleComparables: formData.saleComparables,
    notes: formData.notes,
    score: formData.score,
    zillowLink: formData.zillowLink,
    squareFootage: formData.squareFootage,
    units: formData.units,
    actualRent: formData.actualRent,
    currentHouseValue: formData.currentHouseValue,
    currentLoanValue: formData.currentLoanValue,
    propertyUnits: formData.propertyUnits,
    monthlyExpenses: formData.monthlyExpenses,
    capitalCosts: formData.capitalCosts
  };
}

export const usePropertyForm = (initialData?: Property): UsePropertyFormReturn => {
  const [formData, setFormData] = useState<PropertyFormData>(() =>
    initializeFormData(initialData)
  );
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isDirty, setIsDirty] = useState(false);

  const updateField = useCallback(<K extends keyof PropertyFormData>(
    field: K,
    value: PropertyFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    // Clear field error on change
    setErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  const updateExpense = useCallback((
    field: keyof Omit<MonthlyExpenses, 'id' | 'propertyId' | 'createdAt' | 'updatedAt' | 'total'>,
    value: number
  ) => {
    setFormData(prev => {
      const currentExpenses = prev.monthlyExpenses || createEmptyExpenses();
      const updatedExpenses = {
        ...currentExpenses,
        [field]: value
      };
      return {
        ...prev,
        monthlyExpenses: {
          ...updatedExpenses,
          total: calculateExpenseTotal(updatedExpenses)
        }
      };
    });
    setIsDirty(true);
  }, []);

  const updateCapitalCost = useCallback((
    field: keyof Omit<CapitalCosts, 'id' | 'propertyId' | 'createdAt' | 'updatedAt' | 'total'>,
    value: number
  ) => {
    setFormData(prev => {
      const currentCosts = prev.capitalCosts || createEmptyCapitalCosts();
      const updatedCosts = {
        ...currentCosts,
        [field]: value
      };
      return {
        ...prev,
        capitalCosts: {
          ...updatedCosts,
          total: calculateCapitalTotal(updatedCosts)
        }
      };
    });
    setIsDirty(true);
  }, []);

  const addUnit = useCallback(() => {
    const now = new Date().toISOString();
    setFormData(prev => {
      const nextUnitNumber = (prev.propertyUnits.length + 1).toString();
      return {
        ...prev,
        propertyUnits: [
          ...prev.propertyUnits,
          {
            id: `temp-${Date.now()}`,
            propertyId: '',
            unitNumber: nextUnitNumber,
            status: 'Vacant',
            rent: 0,
            notes: '',
            leaseDate: null,
            createdAt: now,
            updatedAt: now,
            statusHistory: [{ status: 'Vacant', dateStart: now }]
          }
        ]
      };
    });
    setIsDirty(true);
  }, []);

  const updateUnit = useCallback((index: number, field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      propertyUnits: prev.propertyUnits.map((unit, i) =>
        i === index ? { ...unit, [field]: value } : unit
      )
    }));
    setIsDirty(true);
  }, []);

  const updateUnitStatus = useCallback((index: number, newStatus: string, statusChangeDate: string) => {
    if (!statusChangeDate) {
      return;
    }

    try {
      const isoDate = new Date(statusChangeDate + 'T00:00:00.000Z').toISOString();

      setFormData(prev => ({
        ...prev,
        propertyUnits: prev.propertyUnits.map((unit, i) => {
          if (i === index) {
            const newStatusHistory = [...unit.statusHistory];
            newStatusHistory.push({ status: newStatus, dateStart: isoDate });
            return {
              ...unit,
              status: newStatus,
              statusHistory: newStatusHistory
            };
          }
          return unit;
        })
      }));
      setIsDirty(true);
    } catch (error) {
      console.error('Invalid date format in updateUnitStatus:', statusChangeDate, error);
    }
  }, []);

  const removeUnit = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      propertyUnits: prev.propertyUnits.filter((_, i) => i !== index)
    }));
    setIsDirty(true);
  }, []);

  const calculateTotals = useCallback(() => {
    setFormData(prev => {
      const updatedData = { ...prev };

      if (prev.monthlyExpenses) {
        updatedData.monthlyExpenses = {
          ...prev.monthlyExpenses,
          total: calculateExpenseTotal(prev.monthlyExpenses)
        };
      }

      if (prev.capitalCosts) {
        updatedData.capitalCosts = {
          ...prev.capitalCosts,
          total: calculateCapitalTotal(prev.capitalCosts)
        };
      }

      return updatedData;
    });
  }, []);

  const validate = useCallback((): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    }
    if (formData.listingPrice < 0) {
      newErrors.listingPrice = 'Listing price cannot be negative';
    }
    if (formData.offerPrice < 0) {
      newErrors.offerPrice = 'Offer price cannot be negative';
    }
    if (formData.arv < 0) {
      newErrors.arv = 'ARV cannot be negative';
    }
    if (formData.potentialRent < 0) {
      newErrors.potentialRent = 'Potential rent cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const reset = useCallback((newInitialData?: Property) => {
    setFormData(initializeFormData(newInitialData));
    setErrors({});
    setIsDirty(false);
  }, []);

  const getSubmitData = useCallback((): Omit<Property, 'id'> => {
    return convertFormDataToProperty(formData);
  }, [formData]);

  return {
    formData,
    errors,
    isDirty,
    updateField,
    updateExpense,
    updateCapitalCost,
    addUnit,
    updateUnit,
    updateUnitStatus,
    removeUnit,
    calculateTotals,
    validate,
    reset,
    getSubmitData
  };
};
