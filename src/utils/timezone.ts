/**
 * Timezone Utilities for Mountain Time (America/Denver)
 *
 * Automatically handles:
 * - Mountain Standard Time (MST): UTC-7
 * - Mountain Daylight Time (MDT): UTC-6
 *
 * Uses browser's Intl.DateTimeFormat API for timezone conversion
 */

/**
 * Format a UTC timestamp as Mountain Time with full date and time
 * Example: "1/15/2025, 1:00 PM"
 */
export const formatMountainTime = (utcTimestamp: string): string => {
  try {
    // Ensure the timestamp is treated as UTC by appending 'Z' if not present
    const utcString = utcTimestamp.endsWith('Z') ? utcTimestamp : `${utcTimestamp}Z`;
    const date = new Date(utcString);

    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', utcTimestamp);
      return utcTimestamp; // Fallback to raw timestamp
    }

    // Use Intl.DateTimeFormat with America/Denver timezone
    // Automatically handles MST (UTC-7) and MDT (UTC-6)
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return formatter.format(date);
  } catch (error) {
    console.error('Error formatting Mountain Time:', error);
    return utcTimestamp; // Fallback to raw timestamp
  }
};

/**
 * Format a UTC timestamp for message display with smart relative formatting
 * - Today: "2:30 PM"
 * - Yesterday: "Yesterday"
 * - This year: "Jan 15"
 * - Other years: "Jan 15, 2024"
 */
export const formatMessageTime = (utcTimestamp: string): string => {
  try {
    // Ensure the timestamp is treated as UTC by appending 'Z' if not present
    const utcString = utcTimestamp.endsWith('Z') ? utcTimestamp : `${utcTimestamp}Z`;
    const date = new Date(utcString);
    const now = new Date();

    // Validate date
    if (isNaN(date.getTime())) {
      console.warn('Invalid timestamp:', utcTimestamp);
      return utcTimestamp; // Fallback to raw timestamp
    }

    // Calculate difference in days (in Mountain Time)
    // Convert both dates to Mountain Time for comparison
    const mtDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Denver' }));
    const mtNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Denver' }));

    const diffMs = mtNow.getTime() - mtDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // Time formatter for "today" messages
    const timeFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    // Date formatter for "this year" messages
    const dateFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Denver',
      month: 'short',
      day: 'numeric',
    });

    // Today: show time only
    if (diffDays === 0) {
      return timeFormatter.format(date);
    }
    // Yesterday: show "Yesterday"
    else if (diffDays === 1) {
      return 'Yesterday';
    }
    // This year: show "Jan 15"
    else if (date.getFullYear() === now.getFullYear()) {
      return dateFormatter.format(date);
    }
    // Other years: show "Jan 15, 2024"
    else {
      return `${dateFormatter.format(date)}, ${date.getFullYear()}`;
    }
  } catch (error) {
    console.error('Error formatting message time:', error);
    return utcTimestamp; // Fallback to raw timestamp
  }
};

/**
 * Format a UTC timestamp for conversation list display (compact format)
 * Same logic as formatMessageTime but optimized for compact display
 */
export const formatConversationTime = formatMessageTime;
