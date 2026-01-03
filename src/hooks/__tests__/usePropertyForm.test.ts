import { renderHook, act } from '@testing-library/react';
import { usePropertyForm } from '../usePropertyForm';
import { Property, PropertyStatus } from '../../types/property';

const createMockProperty = (overrides: Partial<Property> = {}): Property => ({
  id: '1',
  address: '123 Test St',
  status: 'Opportunity' as PropertyStatus,
  listingPrice: 200000,
  offerPrice: 180000,
  rehabCosts: 25000,
  potentialRent: 1800,
  arv: 250000,
  notes: 'Test notes',
  zillowLink: 'https://zillow.com/test',
  squareFootage: 2000,
  units: 1,
  actualRent: 1500,
  currentHouseValue: 200000,
  currentLoanValue: 150000,
  monthlyExpenses: null,
  capitalCosts: null,
  rentCastEstimates: { price: 0, priceLow: 0, priceHigh: 0, rent: 0, rentLow: 0, rentHigh: 0 },
  todoMetaData: { todoistSectionId: null },
  hasRentcastData: false,
  saleComparables: [],
  score: 0,
  propertyUnits: [],
  ...overrides,
});

describe('usePropertyForm', () => {
  describe('initialization', () => {
    it('should initialize with empty form data when no property provided', () => {
      const { result } = renderHook(() => usePropertyForm());

      expect(result.current.formData.address).toBe('');
      expect(result.current.formData.status).toBe('Opportunity');
      expect(result.current.formData.propertyLeadId).toBeNull();
      expect(result.current.formData.listingPrice).toBe(0);
      expect(result.current.formData.offerPrice).toBe(0);
      expect(result.current.formData.rehabCosts).toBe(0);
      expect(result.current.formData.potentialRent).toBe(0);
      expect(result.current.formData.arv).toBe(0);
      expect(result.current.formData.notes).toBe('');
      expect(result.current.formData.zillowLink).toBe('');
      expect(result.current.formData.squareFootage).toBeNull();
      expect(result.current.formData.units).toBeNull();
      expect(result.current.formData.propertyUnits).toEqual([]);
      expect(result.current.formData.monthlyExpenses).toBeNull();
      expect(result.current.formData.capitalCosts).toBeNull();
      expect(result.current.formData.rentCastEstimates).toEqual({
        price: 0, priceLow: 0, priceHigh: 0, rent: 0, rentLow: 0, rentHigh: 0
      });
      expect(result.current.formData.todoMetaData).toEqual({ todoistSectionId: null });
      expect(result.current.formData.hasRentcastData).toBe(false);
      expect(result.current.formData.saleComparables).toEqual([]);
      expect(result.current.formData.score).toBe(0);
    });

    it('should initialize with property data when provided', () => {
      const property = createMockProperty();
      const { result } = renderHook(() => usePropertyForm(property));

      expect(result.current.formData.address).toBe('123 Test St');
      expect(result.current.formData.status).toBe('Opportunity');
      expect(result.current.formData.listingPrice).toBe(200000);
      expect(result.current.formData.offerPrice).toBe(180000);
      expect(result.current.formData.rehabCosts).toBe(25000);
      expect(result.current.formData.potentialRent).toBe(1800);
      expect(result.current.formData.arv).toBe(250000);
    });

    it('should start with isDirty as false', () => {
      const { result } = renderHook(() => usePropertyForm());
      expect(result.current.isDirty).toBe(false);
    });

    it('should start with no errors', () => {
      const { result } = renderHook(() => usePropertyForm());
      expect(result.current.errors).toEqual({});
    });
  });

  describe('updateField', () => {
    it('should update a field value', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '456 New St');
      });

      expect(result.current.formData.address).toBe('456 New St');
    });

    it('should set isDirty to true when a field is updated', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('listingPrice', 300000);
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should clear field error when field is updated', () => {
      const { result } = renderHook(() => usePropertyForm());

      // First validate to get an error
      act(() => {
        result.current.validate();
      });
      expect(result.current.errors.address).toBe('Address is required');

      // Update the field
      act(() => {
        result.current.updateField('address', '123 Test St');
      });

      expect(result.current.errors.address).toBeUndefined();
    });
  });

  describe('updateExpense', () => {
    it('should create expenses object if null and update field', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateExpense('mortgage', 1500);
      });

      expect(result.current.formData.monthlyExpenses).not.toBeNull();
      expect(result.current.formData.monthlyExpenses?.mortgage).toBe(1500);
    });

    it('should calculate total when expense is updated', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateExpense('mortgage', 1000);
        result.current.updateExpense('taxes', 200);
        result.current.updateExpense('insurance', 100);
      });

      expect(result.current.formData.monthlyExpenses?.total).toBe(1300);
    });

    it('should set isDirty to true when expense is updated', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateExpense('utilities', 150);
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('updateCapitalCost', () => {
    it('should create capital costs object if null and update field', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateCapitalCost('downPayment', 40000);
      });

      expect(result.current.formData.capitalCosts).not.toBeNull();
      expect(result.current.formData.capitalCosts?.downPayment).toBe(40000);
    });

    it('should calculate total when capital cost is updated', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateCapitalCost('closingCosts', 5000);
        result.current.updateCapitalCost('downPayment', 40000);
        result.current.updateCapitalCost('upfrontRepairs', 10000);
      });

      expect(result.current.formData.capitalCosts?.total).toBe(55000);
    });
  });

  describe('validate', () => {
    it('should return true when form is valid', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '123 Test St');
      });

      let isValid: boolean = false;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(true);
      expect(result.current.errors).toEqual({});
    });

    it('should return false and set error when address is empty', () => {
      const { result } = renderHook(() => usePropertyForm());

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.address).toBe('Address is required');
    });

    it('should set error when listing price is negative', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '123 Test St');
        result.current.updateField('listingPrice', -1000);
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.listingPrice).toBe('Listing price cannot be negative');
    });

    it('should set error when offer price is negative', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '123 Test St');
        result.current.updateField('offerPrice', -500);
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.offerPrice).toBe('Offer price cannot be negative');
    });

    it('should set error when ARV is negative', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '123 Test St');
        result.current.updateField('arv', -100);
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.arv).toBe('ARV cannot be negative');
    });

    it('should set error when potential rent is negative', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '123 Test St');
        result.current.updateField('potentialRent', -50);
      });

      let isValid: boolean = true;
      act(() => {
        isValid = result.current.validate();
      });

      expect(isValid).toBe(false);
      expect(result.current.errors.potentialRent).toBe('Potential rent cannot be negative');
    });
  });

  describe('reset', () => {
    it('should reset form to initial empty state', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '456 Test St');
        result.current.updateField('listingPrice', 500000);
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.formData.address).toBe('');
      expect(result.current.formData.listingPrice).toBe(0);
      expect(result.current.isDirty).toBe(false);
      expect(result.current.errors).toEqual({});
    });

    it('should reset form to new property data when provided', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '456 Test St');
      });

      const newProperty = createMockProperty({ address: '789 Reset St' });
      act(() => {
        result.current.reset(newProperty);
      });

      expect(result.current.formData.address).toBe('789 Reset St');
      expect(result.current.isDirty).toBe(false);
    });
  });

  describe('getSubmitData', () => {
    it('should return property data without id', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '123 Submit St');
        result.current.updateField('status', 'Operational');
        result.current.updateField('listingPrice', 250000);
      });

      const submitData = result.current.getSubmitData();

      expect(submitData.address).toBe('123 Submit St');
      expect(submitData.status).toBe('Operational');
      expect(submitData.listingPrice).toBe(250000);
      expect((submitData as any).id).toBeUndefined();
    });

    it('should include default values for required fields', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.updateField('address', '123 Test St');
      });

      const submitData = result.current.getSubmitData();

      expect(submitData.rentCastEstimates).toEqual({
        price: 0, priceLow: 0, priceHigh: 0,
        rent: 0, rentLow: 0, rentHigh: 0
      });
      expect(submitData.todoMetaData).toEqual({ todoistSectionId: null });
      expect(submitData.hasRentcastData).toBe(false);
      expect(submitData.saleComparables).toEqual([]);
      expect(submitData.score).toBe(0);
      expect(submitData.propertyUnits).toEqual([]);
    });
  });

  describe('calculateTotals', () => {
    it('should recalculate expense total', () => {
      const property = createMockProperty({
        monthlyExpenses: {
          id: '1',
          propertyId: '1',
          mortgage: 1000,
          taxes: 200,
          insurance: 100,
          propertyManagement: 150,
          utilities: 0,
          vacancy: 0,
          capEx: 0,
          other: 0,
          total: 0, // Incorrect total
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      const { result } = renderHook(() => usePropertyForm(property));

      act(() => {
        result.current.calculateTotals();
      });

      expect(result.current.formData.monthlyExpenses?.total).toBe(1450);
    });

    it('should recalculate capital costs total', () => {
      const property = createMockProperty({
        capitalCosts: {
          id: '1',
          propertyId: '1',
          closingCosts: 5000,
          upfrontRepairs: 10000,
          downPayment: 40000,
          other: 2000,
          total: 0, // Incorrect total
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      });

      const { result } = renderHook(() => usePropertyForm(property));

      act(() => {
        result.current.calculateTotals();
      });

      expect(result.current.formData.capitalCosts?.total).toBe(57000);
    });
  });

  describe('addUnit', () => {
    it('should add a new unit with auto-generated unit number', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
      });

      expect(result.current.formData.propertyUnits).toHaveLength(1);
      expect(result.current.formData.propertyUnits[0].unitNumber).toBe('1');
      expect(result.current.formData.propertyUnits[0].status).toBe('Vacant');
      expect(result.current.formData.propertyUnits[0].rent).toBe(0);
    });

    it('should increment unit number for each added unit', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
        result.current.addUnit();
        result.current.addUnit();
      });

      expect(result.current.formData.propertyUnits).toHaveLength(3);
      expect(result.current.formData.propertyUnits[0].unitNumber).toBe('1');
      expect(result.current.formData.propertyUnits[1].unitNumber).toBe('2');
      expect(result.current.formData.propertyUnits[2].unitNumber).toBe('3');
    });

    it('should set isDirty to true when unit is added', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
      });

      expect(result.current.isDirty).toBe(true);
    });

    it('should initialize unit with status history', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
      });

      expect(result.current.formData.propertyUnits[0].statusHistory).toHaveLength(1);
      expect(result.current.formData.propertyUnits[0].statusHistory[0].status).toBe('Vacant');
    });
  });

  describe('updateUnit', () => {
    it('should update a unit field by index', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
        result.current.updateUnit(0, 'rent', 1500);
      });

      expect(result.current.formData.propertyUnits[0].rent).toBe(1500);
    });

    it('should update unit number', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
        result.current.updateUnit(0, 'unitNumber', 'A');
      });

      expect(result.current.formData.propertyUnits[0].unitNumber).toBe('A');
    });

    it('should set isDirty to true when unit is updated', () => {
      const property = createMockProperty({
        propertyUnits: [
          {
            id: '1',
            propertyId: '1',
            unitNumber: '1',
            status: 'Vacant',
            rent: 0,
            notes: '',
            leaseDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusHistory: [{ status: 'Vacant', dateStart: new Date().toISOString() }]
          }
        ]
      });
      const { result } = renderHook(() => usePropertyForm(property));

      act(() => {
        result.current.updateUnit(0, 'notes', 'Test note');
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('updateUnitStatus', () => {
    it('should update unit status and add to status history', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
        result.current.updateUnitStatus(0, 'Operational', '2024-01-15');
      });

      expect(result.current.formData.propertyUnits[0].status).toBe('Operational');
      expect(result.current.formData.propertyUnits[0].statusHistory).toHaveLength(2);
    });

    it('should not update if date is empty', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
        result.current.updateUnitStatus(0, 'Operational', '');
      });

      expect(result.current.formData.propertyUnits[0].status).toBe('Vacant');
      expect(result.current.formData.propertyUnits[0].statusHistory).toHaveLength(1);
    });

    it('should set isDirty to true when status is updated', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
      });

      // Reset isDirty
      act(() => {
        result.current.reset();
        result.current.addUnit();
      });

      act(() => {
        result.current.updateUnitStatus(0, 'Behind On Rent', '2024-02-01');
      });

      expect(result.current.isDirty).toBe(true);
    });
  });

  describe('removeUnit', () => {
    it('should remove a unit by index', () => {
      const { result } = renderHook(() => usePropertyForm());

      act(() => {
        result.current.addUnit();
        result.current.addUnit();
        result.current.removeUnit(0);
      });

      expect(result.current.formData.propertyUnits).toHaveLength(1);
      expect(result.current.formData.propertyUnits[0].unitNumber).toBe('2');
    });

    it('should set isDirty to true when unit is removed', () => {
      const property = createMockProperty({
        propertyUnits: [
          {
            id: '1',
            propertyId: '1',
            unitNumber: '1',
            status: 'Vacant',
            rent: 0,
            notes: '',
            leaseDate: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            statusHistory: [{ status: 'Vacant', dateStart: new Date().toISOString() }]
          }
        ]
      });
      const { result } = renderHook(() => usePropertyForm(property));

      act(() => {
        result.current.removeUnit(0);
      });

      expect(result.current.isDirty).toBe(true);
      expect(result.current.formData.propertyUnits).toHaveLength(0);
    });
  });
});
