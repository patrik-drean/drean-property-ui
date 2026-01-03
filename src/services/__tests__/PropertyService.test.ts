// Mock the api module before importing anything
jest.mock('../api', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

import api from '../api';
import PropertyService from '../PropertyService';

const mockGet = api.get as jest.MockedFunction<typeof api.get>;

describe('PropertyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('mapDTOToProperty (via getPropertyById)', () => {
    const createMockPropertyDTO = (overrides = {}) => ({
      id: 'prop-123',
      address: '123 Main St',
      status: 'Operational',
      listingPrice: 200000,
      offerPrice: 180000,
      rehabCosts: 10000,
      potentialRent: 2000,
      arv: 250000,
      rentCastEstimates: {
        price: 200000,
        priceLow: 180000,
        priceHigh: 220000,
        rent: 2000,
        rentLow: 1800,
        rentHigh: 2200,
      },
      todoMetaData: { todoistSectionId: 'section-1' },
      hasRentcastData: true,
      notes: 'Test property',
      score: 8,
      zillowLink: 'https://zillow.com/test',
      squareFootage: 1500,
      units: 3,
      actualRent: 1900,
      currentHouseValue: 210000,
      currentLoanValue: 150000,
      propertyUnits: [
        {
          id: 'unit-a',
          propertyId: 'prop-123',
          unitNumber: 'A',
          status: 'Operational',
          rent: 700,
          notes: 'Unit A notes',
          leaseDate: '2025-01-01T00:00:00Z',
          dateOfLastRent: '2025-11-30T00:00:00',
          createdAt: '2025-01-01T00:00:00Z',
          updatedAt: '2025-06-15T00:00:00Z',
          statusHistory: [
            { status: 'Vacant', dateStart: '2024-12-01T00:00:00Z' },
            { status: 'Operational', dateStart: '2025-01-01T00:00:00Z' },
          ],
        },
      ],
      monthlyExpenses: {
        id: 'exp-1',
        propertyId: 'prop-123',
        mortgage: 800,
        taxes: 200,
        insurance: 100,
        propertyManagement: 150,
        utilities: 0,
        vacancy: 0,
        capEx: 100,
        other: 50,
        total: 1400,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
      capitalCosts: null,
      ...overrides,
    });

    it('should map dateOfLastRent from API response to property units', async () => {
      const mockDTO = createMockPropertyDTO({
        propertyUnits: [
          {
            id: 'unit-a',
            propertyId: 'prop-123',
            unitNumber: 'A',
            status: 'Operational',
            rent: 700,
            notes: '',
            leaseDate: null,
            dateOfLastRent: '2025-11-30T00:00:00',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-06-15T00:00:00Z',
          },
          {
            id: 'unit-b',
            propertyId: 'prop-123',
            unitNumber: 'B',
            status: 'Operational',
            rent: 600,
            notes: '',
            leaseDate: null,
            dateOfLastRent: '2025-10-31T00:00:00',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-06-15T00:00:00Z',
          },
          {
            id: 'unit-c',
            propertyId: 'prop-123',
            unitNumber: 'C',
            status: 'Operational',
            rent: 500,
            notes: '',
            leaseDate: null,
            dateOfLastRent: null, // No rent recorded
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-06-15T00:00:00Z',
          },
        ],
      });

      mockGet.mockResolvedValue({ data: mockDTO });

      const property = await PropertyService.getPropertyById('prop-123');

      expect(property.propertyUnits).toHaveLength(3);
      expect(property.propertyUnits[0].dateOfLastRent).toBe('2025-11-30T00:00:00');
      expect(property.propertyUnits[1].dateOfLastRent).toBe('2025-10-31T00:00:00');
      expect(property.propertyUnits[2].dateOfLastRent).toBeNull();
    });

    it('should handle undefined dateOfLastRent (backwards compatibility)', async () => {
      const mockDTO = createMockPropertyDTO({
        propertyUnits: [
          {
            id: 'unit-a',
            propertyId: 'prop-123',
            unitNumber: 'A',
            status: 'Operational',
            rent: 700,
            notes: '',
            leaseDate: null,
            // dateOfLastRent is not present (undefined)
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-06-15T00:00:00Z',
          },
        ],
      });

      mockGet.mockResolvedValue({ data: mockDTO });

      const property = await PropertyService.getPropertyById('prop-123');

      expect(property.propertyUnits).toHaveLength(1);
      expect(property.propertyUnits[0].dateOfLastRent).toBeUndefined();
    });

    it('should map all unit properties correctly', async () => {
      const mockDTO = createMockPropertyDTO();

      mockGet.mockResolvedValue({ data: mockDTO });

      const property = await PropertyService.getPropertyById('prop-123');

      const unit = property.propertyUnits[0];
      expect(unit.id).toBe('unit-a');
      expect(unit.propertyId).toBe('prop-123');
      expect(unit.unitNumber).toBe('A');
      expect(unit.status).toBe('Operational');
      expect(unit.rent).toBe(700);
      expect(unit.notes).toBe('Unit A notes');
      expect(unit.leaseDate).toBe('2025-01-01T00:00:00Z');
      expect(unit.dateOfLastRent).toBe('2025-11-30T00:00:00');
      expect(unit.createdAt).toBe('2025-01-01T00:00:00Z');
      expect(unit.updatedAt).toBe('2025-06-15T00:00:00Z');
      expect(unit.statusHistory).toHaveLength(2);
    });

    it('should provide fallback unit number when not provided', async () => {
      const mockDTO = createMockPropertyDTO({
        propertyUnits: [
          {
            id: 'unit-a',
            propertyId: 'prop-123',
            unitNumber: '', // Empty string
            status: 'Operational',
            rent: 700,
            notes: '',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-06-15T00:00:00Z',
          },
          {
            id: 'unit-b',
            propertyId: 'prop-123',
            unitNumber: 'B',
            status: 'Operational',
            rent: 600,
            notes: '',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-06-15T00:00:00Z',
          },
        ],
      });

      mockGet.mockResolvedValue({ data: mockDTO });

      const property = await PropertyService.getPropertyById('prop-123');

      // First unit has empty unitNumber, should fallback to index + 1
      expect(property.propertyUnits[0].unitNumber).toBe('1');
      // Second unit has valid unitNumber
      expect(property.propertyUnits[1].unitNumber).toBe('B');
    });

    it('should provide default status history when not provided', async () => {
      const mockDTO = createMockPropertyDTO({
        propertyUnits: [
          {
            id: 'unit-a',
            propertyId: 'prop-123',
            unitNumber: 'A',
            status: 'Operational',
            rent: 700,
            notes: '',
            createdAt: '2025-01-01T00:00:00Z',
            updatedAt: '2025-06-15T00:00:00Z',
            // statusHistory not provided
          },
        ],
      });

      mockGet.mockResolvedValue({ data: mockDTO });

      const property = await PropertyService.getPropertyById('prop-123');

      expect(property.propertyUnits[0].statusHistory).toHaveLength(1);
      expect(property.propertyUnits[0].statusHistory[0].status).toBe('Operational');
      expect(property.propertyUnits[0].statusHistory[0].dateStart).toBe('2025-01-01T00:00:00Z');
    });
  });

  describe('getPropertyById', () => {
    it('should call API with correct URL', async () => {
      const mockDTO = {
        id: 'prop-123',
        address: '123 Main St',
        status: 'Operational',
        listingPrice: 200000,
        offerPrice: 180000,
        rehabCosts: 10000,
        potentialRent: 2000,
        arv: 250000,
        rentCastEstimates: {
          price: 0,
          priceLow: 0,
          priceHigh: 0,
          rent: 0,
          rentLow: 0,
          rentHigh: 0,
        },
        hasRentcastData: false,
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
        capitalCosts: null,
      };

      mockGet.mockResolvedValue({ data: mockDTO });

      await PropertyService.getPropertyById('prop-123');

      expect(mockGet).toHaveBeenCalledWith('/api/Properties/prop-123');
    });

    it('should throw error when API call fails', async () => {
      mockGet.mockRejectedValue(new Error('Network error'));

      await expect(PropertyService.getPropertyById('prop-123')).rejects.toThrow('Network error');
    });
  });

  describe('getAllProperties', () => {
    it('should fetch and map all properties', async () => {
      const mockDTOs = [
        {
          id: 'prop-1',
          address: '123 Main St',
          status: 'Operational',
          listingPrice: 200000,
          offerPrice: 180000,
          rehabCosts: 10000,
          potentialRent: 2000,
          arv: 250000,
          rentCastEstimates: {
            price: 0,
            priceLow: 0,
            priceHigh: 0,
            rent: 0,
            rentLow: 0,
            rentHigh: 0,
          },
          hasRentcastData: false,
          notes: '',
          score: 0,
          zillowLink: '',
          squareFootage: null,
          units: null,
          actualRent: 0,
          currentHouseValue: 0,
          currentLoanValue: null,
          propertyUnits: [
            {
              id: 'unit-a',
              propertyId: 'prop-1',
              unitNumber: 'A',
              status: 'Operational',
              rent: 700,
              notes: '',
              dateOfLastRent: '2025-11-30T00:00:00',
              createdAt: '2025-01-01T00:00:00Z',
              updatedAt: '2025-06-15T00:00:00Z',
            },
          ],
          monthlyExpenses: null,
          capitalCosts: null,
        },
      ];

      mockGet.mockResolvedValue({ data: mockDTOs });

      const properties = await PropertyService.getAllProperties();

      expect(properties).toHaveLength(1);
      expect(properties[0].id).toBe('prop-1');
      expect(properties[0].propertyUnits[0].dateOfLastRent).toBe('2025-11-30T00:00:00');
    });

    it('should call API with correct URL', async () => {
      mockGet.mockResolvedValue({ data: [] });

      await PropertyService.getAllProperties();

      expect(mockGet).toHaveBeenCalledWith('/api/Properties');
    });
  });
});
