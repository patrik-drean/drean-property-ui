import { InvestmentReportData, ShareableReportLink, ReportSharingOptions } from '../types/investmentReport';

// LocalStorage keys
const REPORT_STORAGE_KEY = 'propguide_reports';
const LINK_STORAGE_KEY = 'propguide_report_links';

// Helper functions for localStorage
const getReportsFromStorage = (): Map<string, InvestmentReportData> => {
  try {
    const stored = localStorage.getItem(REPORT_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const reportMap = new Map();

      // Convert date strings back to Date objects
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        if (value.generatedAt) {
          value.generatedAt = new Date(value.generatedAt);
        }
        if (value.sharedAt) {
          value.sharedAt = new Date(value.sharedAt);
        }
        reportMap.set(key, value);
      });

      return reportMap;
    }
  } catch (error) {
    console.warn('Failed to load reports from storage:', error);
  }
  return new Map();
};

const getLinksFromStorage = (): Map<string, ShareableReportLink> => {
  try {
    const stored = localStorage.getItem(LINK_STORAGE_KEY);
    if (stored) {
      const data = JSON.parse(stored);
      const linkMap = new Map();

      // Convert date strings back to Date objects
      Object.entries(data).forEach(([key, value]: [string, any]) => {
        if (value.createdAt) {
          value.createdAt = new Date(value.createdAt);
        }
        if (value.expiresAt) {
          value.expiresAt = new Date(value.expiresAt);
        }
        linkMap.set(key, value);
      });

      return linkMap;
    }
  } catch (error) {
    console.warn('Failed to load links from storage:', error);
  }
  return new Map();
};

const saveReportsToStorage = (reports: Map<string, InvestmentReportData>) => {
  try {
    const data = Object.fromEntries(reports);
    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save reports to storage:', error);
  }
};

const saveLinksToStorage = (links: Map<string, ShareableReportLink>) => {
  try {
    const data = Object.fromEntries(links);
    localStorage.setItem(LINK_STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.warn('Failed to save links to storage:', error);
  }
};

// Store report data and create shareable link
export const createShareableReport = (
  reportData: InvestmentReportData,
  options: ReportSharingOptions = {}
): ShareableReportLink => {
  // Get current storage
  const reportStorage = getReportsFromStorage();
  const linkStorage = getLinksFromStorage();

  // Store the report data
  reportStorage.set(reportData.reportId, reportData);

  // Create shareable link record
  const shareableLink: ShareableReportLink = {
    reportId: reportData.reportId,
    url: generateReportUrl(reportData.reportId),
    propertyId: reportData.property.id,
    createdAt: new Date(),
    viewCount: 0,
    // Optional expiration (could be set to 30 days, 6 months, etc.)
    // expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
  };

  // Store the link
  linkStorage.set(reportData.reportId, shareableLink);

  // Mark report as shared
  reportData.sharedAt = new Date();

  // Save to localStorage
  saveReportsToStorage(reportStorage);
  saveLinksToStorage(linkStorage);

  return shareableLink;
};

// Retrieve report data by report ID
export const getReportData = (reportId: string): InvestmentReportData | null => {
  const reportStorage = getReportsFromStorage();
  const linkStorage = getLinksFromStorage();

  const report = reportStorage.get(reportId);

  if (!report) {
    return null;
  }

  // Increment view count
  const link = linkStorage.get(reportId);
  if (link) {
    link.viewCount = (link.viewCount || 0) + 1;
    linkStorage.set(reportId, link);
    saveLinksToStorage(linkStorage);
  }

  return report;
};

// Get shareable link information
export const getShareableLink = (reportId: string): ShareableReportLink | null => {
  const linkStorage = getLinksFromStorage();
  return linkStorage.get(reportId) || null;
};

// Generate shareable report URL
export const generateReportUrl = (reportId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/#/reports/investment/${reportId}`;
};

// Check if report link is valid and not expired
export const isReportLinkValid = (reportId: string): boolean => {
  const linkStorage = getLinksFromStorage();
  const link = linkStorage.get(reportId);

  if (!link) {
    return false;
  }

  // Check expiration if set
  if (link.expiresAt && new Date() > link.expiresAt) {
    return false;
  }

  return true;
};

// Copy report URL to clipboard
export const copyReportUrlToClipboard = async (reportId: string): Promise<boolean> => {
  try {
    const url = generateReportUrl(reportId);
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy URL to clipboard:', error);
    return false;
  }
};

// Get all shareable links for a property (for management purposes)
export const getPropertyReportLinks = (propertyId: string): ShareableReportLink[] => {
  const linkStorage = getLinksFromStorage();
  return Array.from(linkStorage.values()).filter(link => link.propertyId === propertyId);
};

// Delete a shareable report
export const deleteShareableReport = (reportId: string): boolean => {
  const reportStorage = getReportsFromStorage();
  const linkStorage = getLinksFromStorage();

  const reportExists = reportStorage.has(reportId);
  const linkExists = linkStorage.has(reportId);

  if (reportExists) {
    reportStorage.delete(reportId);
    saveReportsToStorage(reportStorage);
  }

  if (linkExists) {
    linkStorage.delete(reportId);
    saveLinksToStorage(linkStorage);
  }

  return reportExists || linkExists;
};

// Update sharing options for existing report
export const updateSharingOptions = (
  reportId: string,
  options: ReportSharingOptions
): ShareableReportLink | null => {
  const linkStorage = getLinksFromStorage();
  const link = linkStorage.get(reportId);

  if (!link) {
    return null;
  }

  // In a real implementation, these options would be stored with the link
  // For now, we'll just return the existing link
  return link;
};

// Get report analytics (view count, etc.)
export const getReportAnalytics = (reportId: string) => {
  const linkStorage = getLinksFromStorage();
  const link = linkStorage.get(reportId);

  if (!link) {
    return null;
  }

  return {
    reportId: link.reportId,
    viewCount: link.viewCount || 0,
    createdAt: link.createdAt,
    lastViewed: new Date(), // In production, track actual last view time
    propertyId: link.propertyId,
  };
};