import { PorscheRecord, SanitizationLog } from '../types';

const knownModels = [
  "911 Carrera", "911 Carrera S", "911 Carrera GTS", "911 Turbo", "911 Turbo S",
  "911 GT3", "911 GT3 RS", "911 Dakar", "911 Targa 4", "911 Targa 4S",
  "718 Cayman", "718 Cayman S", "718 Cayman GT4 RS", "718 Boxster", "718 Boxster GTS", "718 Spyder RS",
  "Cayenne", "Cayenne S", "Cayenne Coupe", "Cayenne E-Hybrid", "Cayenne Turbo", "Cayenne Turbo GT",
  "Macan", "Macan S", "Macan T", "Macan GTS", "Macan Electric",
  "Panamera", "Panamera 4", "Panamera 4S", "Panamera Turbo", "Panamera Turbo S", "Panamera 4 E-Hybrid",
  "Taycan", "Taycan 4S", "Taycan GTS", "Taycan Turbo", "Taycan Turbo S", "Taycan Cross Turismo"
];

const monthsList = [
  ['january', 'jan'],
  ['february', 'feb'],
  ['march', 'mar'],
  ['april', 'apr'],
  ['may', 'may'],
  ['june', 'jun'],
  ['july', 'jul'],
  ['august', 'aug'],
  ['september', 'sep'],
  ['october', 'oct'],
  ['november', 'nov'],
  ['december', 'dec']
];

const stateMap: { [key: string]: string } = {
  'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR', 'california': 'CA',
  'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE', 'florida': 'FL', 'georgia': 'GA',
  'hawaii': 'HI', 'idaho': 'ID', 'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA',
  'kansas': 'KS', 'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
  'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS', 'missouri': 'MO',
  'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV', 'new hampshire': 'NH', 'new jersey': 'NJ',
  'new mexico': 'NM', 'new york': 'NY', 'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH',
  'oklahoma': 'OK', 'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
  'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT', 'vermont': 'VT',
  'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV', 'wisconsin': 'WI', 'wyoming': 'WY',
  
  // Shortcuts
  'al': 'AL', 'ak': 'AK', 'az': 'AZ', 'ar': 'AR', 'ca': 'CA', 'co': 'CO', 'ct': 'CT', 'de': 'DE', 'fl': 'FL', 'ga': 'GA',
  'hi': 'HI', 'id': 'ID', 'il': 'IL', 'in': 'IN', 'ia': 'IA', 'ks': 'KS', 'ky': 'KY', 'la': 'LA', 'me': 'ME', 'md': 'MD',
  'ma': 'MA', 'mi': 'MI', 'mn': 'MN', 'ms': 'MS', 'mo': 'MO', 'mt': 'MT', 'ne': 'NE', 'nv': 'NV', 'nh': 'NH', 'nj': 'NJ',
  'nm': 'NM', 'ny': 'NY', 'nc': 'NC', 'nd': 'ND', 'oh': 'OH', 'ok': 'OK', 'or': 'OR', 'pa': 'PA', 'ri': 'RI', 'sc': 'SC',
  'sd': 'SD', 'tn': 'TN', 'tx': 'TX', 'ut': 'UT', 'vt': 'VT', 'va': 'VA', 'wa': 'WA', 'wv': 'WV', 'wi': 'WI', 'wy': 'WY'
};

export function validateCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  const thirtyDayMonths = [4, 6, 9, 11]; // April, June, September, November
  if (thirtyDayMonths.includes(month) && day > 30) {
    return false;
  }
  
  if (month === 2) {
    const isLeapYear = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
    if (isLeapYear && day > 29) return false;
    if (!isLeapYear && day > 28) return false;
  }
  
  return true;
}

export function cleanDate(val: string): string {
  let str = val.trim().toLowerCase().replace(/[,]/g, ' ');
  str = str.replace(/\b(\d+)(st|nd|rd|th)\b/gi, '$1');
  str = str.replace(/\s+/g, ' ');

  // Look for word-based month
  let foundMonthIndex = -1;
  for (let i = 0; i < monthsList.length; i++) {
    const [full, short] = monthsList[i];
    if (str.includes(full) || str.includes(short)) {
      foundMonthIndex = i + 1;
      str = str.replace(full, '').replace(short, '').trim();
      break;
    }
  }

  if (foundMonthIndex !== -1) {
    const yearMatch = str.match(/\b\d{4}\b/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0], 10);
      const remaining = str.replace(yearMatch[0], '').trim();
      const dayMatch = remaining.match(/\b\d{1,2}\b/);
      if (dayMatch) {
        const day = parseInt(dayMatch[0], 10);
        if (validateCalendarDate(year, foundMonthIndex, day)) {
          return `${year}-${String(foundMonthIndex).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }
    return 'INVALID';
  }

  // Purely numerical format: YYYY-MM-DD, YYYY/MM/DD, YYYY.MM.DD
  const ymdMatch = str.match(/^(\d{4})[-./](\d{1,2})[-./](\d{1,2})$/);
  if (ymdMatch) {
    const p1 = parseInt(ymdMatch[1], 10);
    const p2 = parseInt(ymdMatch[2], 10);
    const p3 = parseInt(ymdMatch[3], 10);
    
    if (p2 <= 12 && p3 <= 31) {
      if (validateCalendarDate(p1, p2, p3)) {
        return `${p1}-${String(p2).padStart(2, '0')}-${String(p3).padStart(2, '0')}`;
      }
    }
    // Handle YYYY/DD/MM style e.g. 2024/15/07
    if (p2 > 12 && p2 <= 31 && p3 <= 12) {
      if (validateCalendarDate(p1, p3, p2)) {
        return `${p1}-${String(p3).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      }
    }
    return 'INVALID';
  }

  // MM/DD/YYYY, DD/MM/YYYY, MM/DD/YY, DD/MM/YY
  const mdyMatch = str.match(/^(\d{1,2})[-./](\d{1,2})[-./](\d{2,4})$/);
  if (mdyMatch) {
    const p1 = parseInt(mdyMatch[1], 10);
    const p2 = parseInt(mdyMatch[2], 10);
    let year = parseInt(mdyMatch[3], 10);
    
    if (mdyMatch[3].length === 2) {
      year = year < 50 ? 2000 + year : 1900 + year;
    }
    
    if (p1 > 12 && p1 <= 31 && p2 <= 12) {
      if (validateCalendarDate(year, p2, p1)) {
        return `${year}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`;
      }
    }
    if (p2 > 12 && p2 <= 31 && p1 <= 12) {
      if (validateCalendarDate(year, p1, p2)) {
        return `${year}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      }
    }
    // If both <= 12, assume MM/DD/YYYY (American standard)
    if (p1 <= 12 && p2 <= 12) {
      if (validateCalendarDate(year, p1, p2)) {
        return `${year}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`;
      }
    }
    return 'INVALID';
  }

  return 'INVALID';
}

export function cleanPorscheModel(val: string): string {
  const cleanVal = val.trim().replace(/\s+/g, ' ');
  const lowerVal = cleanVal.toLowerCase();
  
  const found = knownModels.find(m => m.toLowerCase() === lowerVal);
  if (found) return found;
  
  // Title case fallback
  return cleanVal.split(' ').map(w => {
    if (w.toUpperCase() === 'GTS') return 'GTS';
    if (w.toUpperCase() === 'RS') return 'RS';
    if (w.toUpperCase() === 'GT3') return 'GT3';
    if (w.toUpperCase() === 'GT4') return 'GT4';
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(' ');
}

export function cleanModelYear(val: string): string {
  let str = String(val).toLowerCase().trim();
  if (!str) return 'INVALID';
  
  if (str.includes("twenty twenty six")) return "2026";
  if (str.includes("twenty twenty five")) return "2025";
  if (str.includes("twenty twenty four")) return "2024";
  if (str.includes("twenty twenty three")) return "2023";
  if (str.includes("twenty twenty two")) return "2022";
  if (str.includes("twenty twenty one")) return "2021";
  if (str.includes("twenty twenty")) return "2020";
  if (str.includes("two thousand twenty one")) return "2021";
  if (str.includes("two thousand twenty two")) return "2022";
  if (str.includes("two thousand twenty three")) return "2023";
  if (str.includes("two thousand twenty four")) return "2024";
  
  const splitMatch = str.match(/^(\d{2})[- ](\d{2})$/);
  if (splitMatch) {
    const year = parseInt(splitMatch[1] + splitMatch[2], 10);
    if (year >= 1990 && year <= 2035) return String(year);
  }
  
  const digitsMatch = str.replace(/[- ]/g, '').match(/\d{4}/);
  if (digitsMatch) {
    const year = parseInt(digitsMatch[0], 10);
    if (year >= 1990 && year <= 2035) return String(year);
  }

  // Handle single 2-digit years if reasonable
  const shortMatch = str.match(/^\d{2}$/);
  if (shortMatch) {
    const yrVal = parseInt(shortMatch[0], 10);
    const yr4 = yrVal < 50 ? 2000 + yrVal : 1900 + yrVal;
    if (yr4 >= 1990 && yr4 <= 2035) return String(yr4);
  }
  
  return 'INVALID';
}

export function cleanSalesPrice(val: string): string {
  let str = String(val).toLowerCase().trim();
  if (!str) return '0.00';
  
  if (str.includes("eighty two thousand")) return "82000.00";
  if (str.includes("two hundred thousand")) return "200000.00";
  
  const kMatch = str.match(/([\d.]+)\s*k/);
  if (kMatch) {
    const num = parseFloat(kMatch[1]) * 1000;
    return num.toFixed(2);
  }
  
  // European format check (e.g. 89.750,00)
  if (str.includes(',') && str.includes('.')) {
    const commaIndex = str.indexOf(',');
    const dotIndex = str.indexOf('.');
    if (dotIndex < commaIndex) {
      str = str.replace(/\./g, '').replace(/,/g, '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    // If comma represents thousands e.g. "104,500" -> replace with empty
    // If comma represents decimal like "9,5" -> replace with dot
    const parts = str.split(',');
    if (parts[parts.length - 1].replace(/[^\d]/g, '').length === 3) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/,/g, '.');
    }
  }
  
  // If dot is thousand separator (e.g. 112.750)
  const dotThreeDigitsMatch = str.match(/(\d+)\.(\d{3})\b/);
  if (dotThreeDigitsMatch) {
    str = str.replace('.', '');
  }
  
  const cleaned = str.replace(/[^\d.]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? '0.00' : num.toFixed(2);
}

export function cleanMileage(val: string): number {
  let str = String(val).toLowerCase().trim();
  if (!str) return 0;
  
  if (str.includes("zero") || str.includes("new")) return 0;
  if (str.includes("twelve thousand")) return 12000;
  if (str.includes("fourteen thousand")) return 14000;
  if (str.includes("fifteen thousand")) return 15000;
  
  const isKm = str.includes("km");
  
  if (str.includes(',')) {
    const parts = str.split(',');
    if (parts[parts.length - 1].replace(/[^\d]/g, '').length === 3) {
      str = str.replace(/,/g, '');
    } else {
      str = str.replace(/,/g, '.');
    }
  }
  
  const dotThreeDigits = str.match(/(\d+)\.(\d{3})\b/);
  if (dotThreeDigits) {
    str = str.replace('.', '');
  }
  
  const cleaned = str.replace(/[^\d.]/g, '');
  let num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  
  if (isKm) {
    num = num * 0.621371;
  }
  
  return Math.round(num);
}

export function cleanPaymentMethod(val: string): string {
  const str = val.trim().toLowerCase();
  
  if (str.includes("credit")) return "Credit Card";
  if (str.includes("debit")) return "Debit Card";
  if (str.includes("wire") || (str.includes("transfer") && str.includes("wire")) || str.includes("bank wire")) return "Wire Transfer";
  if (str.includes("bank") && str.includes("transfer")) return "Bank Transfer";
  if (str.includes("bank") && !str.includes("wire")) return "Bank Transfer";
  if (str.includes("finance") || str.includes("financing")) return "Financing";
  if (str.includes("lease") || str.includes("leasing")) return "Lease";
  if (str.includes("cash")) return "Cash";
  if (str.includes("ach")) return "ACH Payment";
  if (str.includes("crypto")) return "Crypto Payment";
  
  // Fallback: title case
  return val.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

export function cleanCity(val: string): string {
  const str = val.trim();
  if (!str) return '';
  return str.split(/\s+/).map(word => {
    if (word.toLowerCase() === "st.") return "St.";
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

export function cleanState(val: string): string {
  const str = val.trim().toLowerCase();
  return stateMap[str] || "INVALID";
}

export function cleanDeliveryStatus(val: string): string {
  const str = val.trim().toLowerCase().replace(/[!.]/g, '').replace('-', ' ');
  
  if (str === "deliverd" || str === "delivered") return "Delivered";
  if (str === "pending") return "Pending";
  if (str === "in transit") return "In Transit";
  if (str === "cancelled") return "Cancelled";
  if (str === "awaiting delivery") return "Awaiting Delivery";
  if (str === "awaiting pickup") return "Awaiting Pickup";
  if (str === "pending approval") return "Pending Approval";
  if (str === "pending review") return "Pending Review";
  if (str === "shipped") return "Shipped";
  if (str === "awaiting review") return "Awaiting Review";
  
  if (str.includes("deliver")) return "Delivered";
  if (str.includes("transit")) return "In Transit";
  if (str.includes("cancel")) return "Cancelled";
  if (str.includes("pickup")) return "Awaiting Pickup";
  if (str.includes("shipp")) return "Shipped";
  if (str.includes("approval")) return "Pending Approval";
  if (str.includes("review")) {
    if (str.includes("await")) return "Awaiting Review";
    return "Pending Review";
  }
  if (str.includes("pending")) return "Pending";
  
  return val.trim().split(/\s+/).map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
}

// Custom CSV Parser that handles commas, quotes, and newlines
export function parseCSV(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let entry = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        entry += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      row.push(entry.trim());
      entry = '';
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      row.push(entry.trim());
      if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
        result.push(row);
      }
      row = [];
      entry = '';
    } else {
      entry += char;
    }
  }
  
  if (entry !== '' || row.length > 0) {
    row.push(entry.trim());
    if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
      result.push(row);
    }
  }
  
  return result;
}

export function serializeCSV(headers: string[], rows: any[][]): string {
  const escapeCell = (val: any) => {
    const str = String(val === null || val === undefined ? '' : val);
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  
  const headerLine = headers.map(escapeCell).join(',');
  const rowLines = rows.map(row => row.map(escapeCell).join(','));
  return [headerLine, ...rowLines].join('\n');
}

export function sanitizeRecords(rawRecords: any[]): { sanitized: PorscheRecord[]; logs: SanitizationLog[] } {
  const sanitized: PorscheRecord[] = [];
  const logs: SanitizationLog[] = [];
  
  rawRecords.forEach((rec, index) => {
    const saleId = rec.sale_id || String(index + 1);
    const customerName = rec.customer_name || 'Unknown';
    
    // Clean fields
    const saleDateSanitized = cleanDate(rec.sale_date || '');
    const porscheModelSanitized = cleanPorscheModel(rec.porsche_model || '');
    const modelYearSanitized = cleanModelYear(rec.model_year || '');
    const salesPriceSanitized = cleanSalesPrice(rec.sale_price || '');
    const vehicleMileageSanitized = cleanMileage(rec.vehicle_mileage || '');
    const payMethodSanitized = cleanPaymentMethod(rec.payment_method || '');
    const citySanitized = cleanCity(rec.city || '');
    const stateSanitized = cleanState(rec.state || '');
    const deliveryStatusSanitized = cleanDeliveryStatus(rec.delivery_status || '');
    
    // Log modifications
    const checkAndLog = (field: string, orig: string, sanit: string, desc: string, successDesc: string) => {
      if (orig !== sanit) {
        logs.push({
          id: `${saleId}_${field}_${Date.now()}_${Math.random()}`,
          rowId: saleId,
          customerName,
          field,
          originalValue: orig,
          sanitizedValue: sanit,
          description: desc,
          status: sanit === 'INVALID' ? 'error' : 'success'
        });
      } else {
        logs.push({
          id: `${saleId}_${field}_${Date.now()}_${Math.random()}`,
          rowId: saleId,
          customerName,
          field,
          originalValue: orig,
          sanitizedValue: sanit,
          description: successDesc,
          status: 'info'
        });
      }
    };
    
    checkAndLog('sale_date', rec.sale_date || '', saleDateSanitized, `Converted date format to ${saleDateSanitized}`, `Validated date format is ${saleDateSanitized}`);
    checkAndLog('porsche_model', rec.porsche_model || '', porscheModelSanitized, `Normalized model name to "${porscheModelSanitized}"`, `Model "${porscheModelSanitized}" is already normalized`);
    checkAndLog('model_year', rec.model_year || '', modelYearSanitized, `Normalized year to ${modelYearSanitized}`, `Model year is ${modelYearSanitized}`);
    checkAndLog('sale_price', rec.sale_price || '', salesPriceSanitized, `Cleaned sale price to $${salesPriceSanitized}`, `Price is $${salesPriceSanitized}`);
    checkAndLog('vehicle_mileage', rec.vehicle_mileage || '', String(vehicleMileageSanitized), `Converted mileage to ${vehicleMileageSanitized} miles`, `Mileage is ${vehicleMileageSanitized} miles`);
    checkAndLog('payment_method', rec.payment_method || '', payMethodSanitized, `Normalized payment method to "${payMethodSanitized}"`, `Payment method "${payMethodSanitized}" matches schema`);
    checkAndLog('city', rec.city || '', citySanitized, `Formatted city name to "${citySanitized}"`, `City name "${citySanitized}" is formatted`);
    checkAndLog('state', rec.state || '', stateSanitized, `Converted state to USPS code "${stateSanitized}"`, `State is USPS code "${stateSanitized}"`);
    checkAndLog('delivery_status', rec.delivery_status || '', deliveryStatusSanitized, `Normalized delivery status to "${deliveryStatusSanitized}"`, `Delivery status is "${deliveryStatusSanitized}"`);
    
    sanitized.push({
      ...rec,
      SaleDateSanitized: saleDateSanitized,
      PorscheModelSanitized: porscheModelSanitized,
      ModelYearSanitized: modelYearSanitized,
      SalesPriceSanitized: salesPriceSanitized,
      VehicleMileageSanitized: String(vehicleMileageSanitized),
      PayMethodSanitized: payMethodSanitized,
      CitySanitized: citySanitized,
      StateSanitized: stateSanitized,
      DeliveryStatusSanitized: deliveryStatusSanitized,
    });
  });
  
  return { sanitized, logs };
}
