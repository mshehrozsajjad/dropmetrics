import _ from 'lodash';
import Papa from 'papaparse';
import { getPriceRange } from './priceUtils';

/**
 * Detects the month from a sample date string
 * @param {string} sampleDate - A date string from the CSV
 * @returns {Object} - Contains month name and abbreviation
 */
export const detectMonth = (sampleDate) => {
  let month = 'Unknown';
  let monthAbbrev = 'Unk';
  
  if (!sampleDate || typeof sampleDate !== 'string') {
    console.log("Invalid sample date for month detection:", sampleDate);
    return { month, monthAbbrev };
  }
  
  console.log("Detecting month from:", sampleDate);
  
  // Match different date formats without escaping
  const mayMatch = sampleDate.match(/(\d+)\. Mai 2025/) || 
                  sampleDate.match(/(\d+)\. May 2025/) || 
                  sampleDate.includes('Mai 2025') || 
                  sampleDate.includes('May 2025');
                  
  const juneMatch = sampleDate.match(/(\d+)\. June 2025/) || 
                   sampleDate.match(/(\d+)\. Jun 2025/) || 
                   sampleDate.includes('June 2025') || 
                   sampleDate.includes('Jun 2025');
                   
  const aprilMatch = sampleDate.match(/(\d+)\. Apr(il)? 2025/) || 
                    sampleDate.includes('April 2025') || 
                    sampleDate.includes('Apr 2025');
  
  console.log("Match results:", { mayMatch, juneMatch, aprilMatch });
  
  if (mayMatch) {
    month = 'May';
    monthAbbrev = 'May';
  } else if (juneMatch) {
    month = 'June';
    monthAbbrev = 'Jun';
  } else if (aprilMatch) {
    month = 'April';
    monthAbbrev = 'Apr';
  }
  
  console.log("Detected month:", month, monthAbbrev);
  return { month, monthAbbrev };
};

/**
 * Parses a number from a potentially formatted string
 * @param {string|number} value - The value to parse
 * @returns {number} - The parsed number
 */
export const parseNumericValue = (value) => {
  if (typeof value === 'string') {
    // Clean string and handle European number formats
    const cleanValue = value
      .replace(/,/g, '.') // Replace commas with dots for decimal points
      .replace(/\./g, function(match, offset, string) {
        // Keep only the last dot as decimal point
        return offset === string.lastIndexOf('.') ? '.' : '';
      })
      .replace(/"/g, '') // Remove quotes
      .replace(/%/g, '') // Remove percent signs
      .trim();
    
    console.log(`Converting string value "${value}" to number: ${cleanValue}`);
    return parseFloat(cleanValue);
  }
  return value;
};

/**
 * Extracts the day from a date string
 * @param {string} dateStr - The date string
 * @returns {number} - The day as an integer
 */
export const extractDay = (dateStr) => {
  let day = 1;
  
  if (!dateStr || typeof dateStr !== 'string') {
    console.log("Invalid date string for day extraction:", dateStr);
    return day;
  }
  
  console.log("Extracting day from:", dateStr);
  
  // Try different date formats
  const dayMatch = dateStr.match(/(\d+)\./);
  
  if (dayMatch) {
    day = parseInt(dayMatch[1]);
    console.log("Extracted day:", day);
  } else {
    // Try alternate format
    const altMatch = dateStr.match(/(\d+)(st|nd|rd|th)/);
    if (altMatch) {
      day = parseInt(altMatch[1]);
      console.log("Extracted day (alternate format):", day);
    } else {
      console.log("Could not extract day, using default:", day);
    }
  }
  
  return day;
};

/**
 * Processes CSV data from eBay sales
 * @param {string} fileContent - Raw CSV content
 * @returns {Object} - Processed data and metadata
 */
export const processCSVData = (fileContent) => {
  const lines = fileContent.split('\n');
  const dataWithoutFirstRow = lines.slice(1).join('\n');
  
  const parsedData = Papa.parse(dataWithoutFirstRow, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
    transformHeader: header => header.trim().toUpperCase() // Normalize headers to uppercase
  });

  // Determine month from data
  let month = 'Unknown';
  let monthAbbrev = 'Unk';
  
  // Try to extract month from the first valid date
  if (parsedData.data.length > 0) {
    // Check for DATE field in different cases
    const dateField = Object.keys(parsedData.data[0]).find(key => 
      key.toUpperCase() === 'DATE');
    
    if (dateField) {
      const sampleDate = parsedData.data.find(row => row[dateField])?.[dateField] || '';
      console.log("Sample date found:", sampleDate);
      
      const monthInfo = detectMonth(sampleDate);
      month = monthInfo.month;
      monthAbbrev = monthInfo.monthAbbrev;
      
      console.log("Detected month:", month, monthAbbrev);
    } else {
      console.log("DATE field not found in CSV");
    }
  }

  console.log("CSV parsed data:", parsedData);
  console.log("Headers found:", parsedData.meta.fields);
  
  // Clean and process the data
  // Find the actual column names for important fields
  const findColumn = (searchKey) => {
    if (!parsedData.data.length) return null;
    return Object.keys(parsedData.data[0]).find(key => 
      key.toUpperCase() === searchKey.toUpperCase());
  };
  
  const sellPriceColumn = findColumn('SELL PRICE');
  const buyPriceColumn = findColumn('BUY PRICE');
  const profitColumn = findColumn('PROFIT');
  const roiColumn = findColumn('ROI');
  const dateColumn = findColumn('DATE');
  
  console.log("Column mapping:", {
    sellPriceColumn,
    buyPriceColumn,
    profitColumn,
    roiColumn,
    dateColumn
  });
  
  if (!sellPriceColumn || !buyPriceColumn || !profitColumn) {
    console.error("Required columns not found in CSV!");
    return { processedData: [], month, monthAbbrev };
  }
  
  const processedData = parsedData.data
    .filter(row => {
      console.log("Processing row:", row);
      
      // Make sure SELL PRICE and BUY PRICE exist and are valid
      let sellPrice = row[sellPriceColumn];
      let buyPrice = row[buyPriceColumn];
      
      console.log(`Original values - SELL PRICE: ${sellPrice}, BUY PRICE: ${buyPrice}`);
      
      // Handle comma-formatted numbers
      if (typeof sellPrice === 'string') {
        sellPrice = parseNumericValue(sellPrice);
        row[sellPriceColumn] = sellPrice;
      }
      
      if (typeof buyPrice === 'string') {
        buyPrice = parseNumericValue(buyPrice);
        row[buyPriceColumn] = buyPrice;
      }
      
      console.log(`Processed values - SELL PRICE: ${sellPrice}, BUY PRICE: ${buyPrice}`);
      
      const isValid = sellPrice && !isNaN(sellPrice) && buyPrice && !isNaN(buyPrice);
      console.log(`Row valid: ${isValid}`);
      return isValid;
    })
    .map(row => {
      // Parse date from various formats
      const day = extractDay(row[dateColumn] || '');
      
      // Handle PROFIT field
      let profit = row[profitColumn];
      if (typeof profit === 'string') {
        profit = parseNumericValue(profit);
        row[profitColumn] = profit;
      }
      
      // Calculate margin percentage
      const marginPercent = ((row[profitColumn] / row[sellPriceColumn]) * 100) || 0;
      
      // Fix extreme ROI values (data quality issue)
      let roi = roiColumn ? row[roiColumn] : null;
      if (typeof roi === 'string') {
        roi = parseNumericValue(roi);
      }
      
      if (!roi || isNaN(roi) || roi > 1000) {
        roi = (row[profitColumn] / row[buyPriceColumn] * 100) || 0;
      }
      
      // Create standardized object with consistent property names
      return {
        ...row,
        'SELL PRICE': row[sellPriceColumn], // Ensure standard property names exist
        'BUY PRICE': row[buyPriceColumn],
        'PROFIT': row[profitColumn],
        day,
        date: `${monthAbbrev} ${day}`,
        month,
        marginPercent,
        roi: roi || 0,
        priceRange: getPriceRange(row[sellPriceColumn])
      };
    });

  return { processedData, month, monthAbbrev };
};

/**
 * Calculates key metrics from processed data
 * @param {Array} data - The processed sales data
 * @returns {Object} - Key metrics
 */
export const calculateMetrics = (data) => {
  if (data.length === 0) return {};
  
  console.log("Sample data item for metrics:", data.length > 0 ? data[0] : "No data");
  
  return {
    totalOrders: data.length,
    totalRevenue: _.sumBy(data, d => d['SELL PRICE'] || 0),
    totalCost: _.sumBy(data, d => d['BUY PRICE'] || 0),
    totalProfit: _.sumBy(data, d => d['PROFIT'] || 0),
    avgOrderValue: _.meanBy(data, d => d['SELL PRICE'] || 0),
    avgProfit: _.meanBy(data, d => d['PROFIT'] || 0),
    avgROI: _.meanBy(data.filter(d => d.roi < 1000), 'roi'),
    profitMargin: _.sumBy(data, d => d['SELL PRICE'] || 0) > 0 ? 
      (_.sumBy(data, d => d['PROFIT'] || 0) / _.sumBy(data, d => d['SELL PRICE'] || 0) * 100) : 0,
    lossCount: data.filter(d => (d['PROFIT'] || 0) < 0).length,
    totalLoss: Math.abs(_.sumBy(data.filter(d => (d['PROFIT'] || 0) < 0), d => d['PROFIT'] || 0))
  };
};

/**
 * Generates daily metrics from processed data
 * @param {Array} data - The processed sales data
 * @returns {Array} - Daily metrics
 */
export const generateDailyData = (data) => {
  return _.chain(data)
    .groupBy('day')
    .map((items, day) => ({
      day: parseInt(day),
      date: items[0].date, // Use the already formatted date
      orders: items.length,
      revenue: _.sumBy(items, 'SELL PRICE'),
      profit: _.sumBy(items, 'PROFIT'),
      avgROI: _.meanBy(items.filter(d => d.roi < 1000), 'roi'),
      avgOrderValue: _.meanBy(items, 'SELL PRICE')
    }))
    .orderBy('day')
    .value();
};

/**
 * Generates price range analysis from processed data
 * @param {Array} data - The processed sales data
 * @returns {Array} - Price range analysis
 */
export const generatePriceRangeData = (data) => {
  return _.chain(data)
    .groupBy('priceRange')
    .map((items, range) => ({
      range,
      count: items.length,
      profit: _.sumBy(items, 'PROFIT'),
      avgROI: _.meanBy(items.filter(d => d.roi < 1000), 'roi'),
      percentage: data.length > 0 ? (items.length / data.length * 100) : 0
    }))
    .value();
};

/**
 * Generates ROI distribution for charts
 * @param {Array} data - The processed sales data
 * @returns {Array} - ROI distribution
 */
export const generateRoiDistribution = (data) => {
  return [
    { name: 'Excellent', value: data.filter(d => d.roi >= 50 && d.roi < 1000).length, fill: '#10b981' },
    { name: 'Good', value: data.filter(d => d.roi >= 20 && d.roi < 50).length, fill: '#3b82f6' },
    { name: 'Fair', value: data.filter(d => d.roi >= 0 && d.roi < 20).length, fill: '#f59e0b' },
    { name: 'Loss', value: data.filter(d => d.roi < 0).length, fill: '#ef4444' }
  ];
};

/**
 * Gets top performing products by profit
 * @param {Array} data - The processed sales data
 * @param {number} limit - Number of products to return
 * @returns {Array} - Top products
 */
export const getTopProducts = (data, limit = 10) => {
  return _.chain(data)
    .orderBy('PROFIT', 'desc')
    .take(limit)
    .value();
};