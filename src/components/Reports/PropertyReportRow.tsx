import React from 'react';
import {
  TableRow,
  TableCell,
  Link,
  Chip,
  Typography,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { PropertyCashFlowData, PropertyAssetData } from '../../types/portfolioReport';
import { formatCurrency, formatPercentage } from '../../utils/portfolioAggregator';
import { getStatusColor } from '../../utils/statusColors';

interface PropertyCashFlowRowProps {
  property: PropertyCashFlowData;
  onPropertyClick: (propertyId: string) => void;
  scenario: 'current' | 'potential';
}

interface PropertyAssetRowProps {
  property: PropertyAssetData;
  onPropertyClick: (propertyId: string) => void;
}

/**
 * Status chip component with appropriate coloring
 */
const StatusChip: React.FC<{ status: string; isOperational: boolean }> = ({ status, isOperational }) => {
  const getChipColor = (status: string, isOperational: boolean) => {
    if (!isOperational) return 'default';

    switch (status.toLowerCase()) {
      case 'operational':
        return 'success';
      case 'needs tenant':
        return 'warning';
      case 'selling':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Chip
      label={status}
      color={getChipColor(status, isOperational) as any}
      size="small"
      variant={isOperational ? 'filled' : 'outlined'}
      sx={{
        backgroundColor: isOperational ? getStatusColor(status as any) : undefined,
        color: isOperational ? 'white' : undefined,
        '& .MuiChip-label': {
          color: isOperational ? 'white' : undefined
        }
      }}
    />
  );
};

/**
 * Clickable address link component
 */
const AddressLink: React.FC<{
  address: string;
  propertyId: string;
  onClick: (propertyId: string) => void;
}> = ({ address, propertyId, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick(propertyId);
  };

  return (
    <Link
      component="button"
      variant="body2"
      onClick={handleClick}
      sx={{
        textAlign: 'left',
        textDecoration: 'none',
        '&:hover': {
          textDecoration: 'underline'
        }
      }}
      aria-label={`View details for ${address}`}
    >
      {address}
    </Link>
  );
};

/**
 * Currency cell component with positive/negative styling
 */
const CurrencyCell: React.FC<{
  value: number;
  showPositiveNegative?: boolean;
  variant?: 'body2' | 'h6';
}> = ({ value, showPositiveNegative = false, variant = 'body2' }) => {
  const getColor = (value: number) => {
    if (!showPositiveNegative) return 'text.primary';
    return value >= 0 ? 'success.main' : 'error.main';
  };

  return (
    <Typography
      variant={variant}
      component="span"
      sx={{
        color: getColor(value),
        fontWeight: variant === 'h6' ? 600 : 400
      }}
    >
      {formatCurrency(value)}
    </Typography>
  );
};

/**
 * Cash flow property row component
 */
export const PropertyCashFlowRow: React.FC<PropertyCashFlowRowProps> = ({
  property,
  onPropertyClick,
  scenario
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Select data based on scenario
  const rentIncome = scenario === 'current' ? property.currentRentIncome : property.potentialRentIncome;
  const expenses = scenario === 'current' ? property.currentExpenses : property.potentialExpenses;
  const netCashFlow = scenario === 'current' ? property.currentNetCashFlow : property.potentialNetCashFlow;

  if (isMobile) {
    // Mobile layout - condensed view
    return (
      <TableRow hover>
        <TableCell>
          <div>
            <AddressLink
              address={property.address}
              propertyId={property.id}
              onClick={onPropertyClick}
            />
            <div style={{ marginTop: theme.spacing(0.5) }}>
              <StatusChip status={property.status} isOperational={property.isOperational} />
            </div>
          </div>
        </TableCell>
        <TableCell align="right">
          <div>
            <Typography variant="body2" color="text.secondary">
              Rent
            </Typography>
            <CurrencyCell value={rentIncome} />
          </div>
        </TableCell>
        <TableCell align="right">
          <div>
            <Typography variant="body2" color="text.secondary">
              Cash Flow
            </Typography>
            <CurrencyCell value={netCashFlow} showPositiveNegative />
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Desktop layout - full view
  return (
    <TableRow hover>
      <TableCell>
        <AddressLink
          address={property.address}
          propertyId={property.id}
          onClick={onPropertyClick}
        />
      </TableCell>
      <TableCell>
        <StatusChip status={property.status} isOperational={property.isOperational} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={rentIncome} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={expenses.mortgage} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={expenses.propertyTax} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={expenses.propertyManagement} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={expenses.total} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={netCashFlow} showPositiveNegative variant="h6" />
      </TableCell>
    </TableRow>
  );
};

/**
 * Asset property row component
 */
export const PropertyAssetRow: React.FC<PropertyAssetRowProps> = ({
  property,
  onPropertyClick
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  if (isMobile) {
    // Mobile layout - condensed view
    return (
      <TableRow hover>
        <TableCell>
          <div>
            <AddressLink
              address={property.address}
              propertyId={property.id}
              onClick={onPropertyClick}
            />
            <div style={{ marginTop: theme.spacing(0.5) }}>
              <StatusChip status={property.status} isOperational={property.isOperational} />
            </div>
          </div>
        </TableCell>
        <TableCell align="right">
          <div>
            <Typography variant="body2" color="text.secondary">
              Value
            </Typography>
            <CurrencyCell value={property.currentValue} />
          </div>
        </TableCell>
        <TableCell align="right">
          <div>
            <Typography variant="body2" color="text.secondary">
              Equity
            </Typography>
            <CurrencyCell value={property.equity} />
            <Typography variant="caption" color="text.secondary" display="block">
              {formatPercentage(property.equityPercent)}
            </Typography>
          </div>
        </TableCell>
      </TableRow>
    );
  }

  // Desktop layout - full view
  return (
    <TableRow hover>
      <TableCell>
        <AddressLink
          address={property.address}
          propertyId={property.id}
          onClick={onPropertyClick}
        />
      </TableCell>
      <TableCell>
        <StatusChip status={property.status} isOperational={property.isOperational} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={property.currentValue} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={property.loanValue} />
      </TableCell>
      <TableCell align="right">
        <CurrencyCell value={property.equity} variant="h6" />
      </TableCell>
      <TableCell align="right">
        <Typography variant="body2">
          {formatPercentage(property.equityPercent)}
        </Typography>
      </TableCell>
    </TableRow>
  );
};