import ExcelJS from 'exceljs';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

const styleHeader = (sheet: ExcelJS.Worksheet) => {
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B3A5C' } };
    cell.font = { color: { argb: 'FFFFFFFF' }, bold: true, size: 11 };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = { bottom: { style: 'medium', color: { argb: 'FFCCCCCC' } } };
    
    // Highlight required columns in yellow text for indication (or just leave standard)
    if (String(cell.value).includes('*')) {
      cell.font = { color: { argb: 'FFFFE066' }, bold: true, size: 11 };
    }
  });
  headerRow.height = 22;
  // Freeze top row
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICE
// ─────────────────────────────────────────────────────────────────────────────

export const downloadMultiSheetCrmTemplate = async (): Promise<ExcelJS.Buffer> => {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Rising CRM';
  wb.created = new Date();

  // ── Sheet 1: Lead Master ──────────────────────────────────────────────────
  const sheet1 = wb.addWorksheet('Lead Master', { properties: { tabColor: { argb: 'FF00B0F0' } } });
  sheet1.columns = [
    { header: 'Lead ID*', key: 'leadId', width: 15 },
    { header: 'Lead Date*', key: 'leadDate', width: 15 },
    { header: 'Lead Source*', key: 'leadSource', width: 20 },
    { header: 'First Name*', key: 'firstName', width: 20 },
    { header: 'Last Name', key: 'lastName', width: 20 },
    { header: 'Phone Number*', key: 'phoneNumber', width: 15 },
    { header: 'Alternate Phone', key: 'alternatePhone', width: 15 },
    { header: 'Email ID', key: 'emailId', width: 25 },
    { header: 'City', key: 'city', width: 20 },
    { header: 'Assigned Executive', key: 'assignedExecutive', width: 25 },
    { header: 'Lead Status*', key: 'leadStatus', width: 15 },
    { header: 'Property Type Interest', key: 'propertyType', width: 25 },
    { header: 'Budget Min', key: 'budgetMin', width: 15 },
    { header: 'Budget Max', key: 'budgetMax', width: 15 },
    { header: 'Preferred Location', key: 'preferredLocation', width: 25 },
    { header: 'Size Required', key: 'sizeRequired', width: 15 },
    { header: 'Purpose', key: 'purpose', width: 15 },
    { header: 'Loan Required', key: 'loanRequired', width: 15 },
    { header: 'Timeline to Buy', key: 'timelineToBuy', width: 20 },
    { header: 'Remarks', key: 'remarks', width: 35 },
  ];
  styleHeader(sheet1);

  // Validations for Sheet 1
  for (let i = 2; i <= 1000; i++) {
    sheet1.getCell(`K${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Hot,Warm,Cold,Dead"']
    };
    sheet1.getCell(`L${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Plot,Flat,Villa,Commercial"']
    };
    sheet1.getCell(`Q${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Self Use,Investment,Rental"']
    };
    sheet1.getCell(`R${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Yes,No"']
    };
    sheet1.getCell(`S${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Immediate,1-3 months,6+ months"']
    };
    
    // Formatting
    sheet1.getCell(`B${i}`).numFmt = 'DD/MM/YYYY';
    sheet1.getCell(`M${i}`).numFmt = '₹#,##0.00';
    sheet1.getCell(`N${i}`).numFmt = '₹#,##0.00';
  }

  // ── Sheet 2: Follow-Ups ───────────────────────────────────────────────────
  const sheet2 = wb.addWorksheet('Follow-Ups', { properties: { tabColor: { argb: 'FF92D050' } } });
  sheet2.columns = [
    { header: 'Follow-Up ID', key: 'followUpId', width: 15 },
    { header: 'Lead ID*', key: 'leadId', width: 15 },
    { header: 'Client Name', key: 'clientName', width: 25 },
    { header: 'Follow-Up Date*', key: 'followUpDate', width: 15 },
    { header: 'Follow-Up Time', key: 'followUpTime', width: 15 },
    { header: 'Done By', key: 'doneBy', width: 25 },
    { header: 'Outcome*', key: 'outcome', width: 25 },
    { header: 'Next Follow-Up Date', key: 'nextFollowUpDate', width: 20 },
    { header: 'Notes', key: 'notes', width: 40 },
  ];
  styleHeader(sheet2);

  for (let i = 2; i <= 1000; i++) {
    sheet2.getCell(`G${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Interested,Callback,Not Responding,Dead"']
    };
    sheet2.getCell(`D${i}`).numFmt = 'DD/MM/YYYY';
    sheet2.getCell(`H${i}`).numFmt = 'DD/MM/YYYY';
  }

  // ── Sheet 3: Site Visits & Negotiation ────────────────────────────────────
  const sheet3 = wb.addWorksheet('Site Visits & Negotiation', { properties: { tabColor: { argb: 'FFFFC000' } } });
  sheet3.columns = [
    { header: 'Visit ID', key: 'visitId', width: 15 },
    { header: 'Lead ID*', key: 'leadId', width: 15 },
    { header: 'Client Name', key: 'clientName', width: 25 },
    { header: 'Visit Date*', key: 'visitDate', width: 15 },
    { header: 'Property Shown', key: 'propertyShown', width: 25 },
    { header: 'Visit Feedback', key: 'visitFeedback', width: 30 },
    { header: 'Interested After Visit', key: 'interestedAfterVisit', width: 20 },
    { header: 'Quoted Price', key: 'quotedPrice', width: 15 },
    { header: 'Client Expected Price', key: 'clientExpectedPrice', width: 20 },
    { header: 'Discount Offered', key: 'discountOffered', width: 15 },
    { header: 'Final Negotiated Price', key: 'finalNegotiatedPrice', width: 25 },
    { header: 'Objections', key: 'objections', width: 30 },
    { header: 'Objections Resolved', key: 'objectionsResolved', width: 20 },
  ];
  styleHeader(sheet3);

  for (let i = 2; i <= 1000; i++) {
    sheet3.getCell(`G${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Yes,No,Maybe"']
    };
    sheet3.getCell(`M${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Yes,No,Pending"']
    };
    sheet3.getCell(`D${i}`).numFmt = 'DD/MM/YYYY';
    sheet3.getCell(`H${i}`).numFmt = '₹#,##0.00';
    sheet3.getCell(`I${i}`).numFmt = '₹#,##0.00';
    sheet3.getCell(`J${i}`).numFmt = '₹#,##0.00';
    sheet3.getCell(`K${i}`).numFmt = '₹#,##0.00';
  }

  // ── Sheet 4: Booking & Payments ───────────────────────────────────────────
  const sheet4 = wb.addWorksheet('Booking & Payments', { properties: { tabColor: { argb: 'FF7030A0' } } });
  sheet4.columns = [
    { header: 'Booking ID', key: 'bookingId', width: 15 },
    { header: 'Lead ID*', key: 'leadId', width: 15 },
    { header: 'Client Name', key: 'clientName', width: 25 },
    { header: 'Booking Date*', key: 'bookingDate', width: 15 },
    { header: 'Property Booked', key: 'propertyBooked', width: 25 },
    { header: 'Final Agreed Price*', key: 'finalAgreedPrice', width: 20 },
    { header: 'Token Amount*', key: 'tokenAmount', width: 15 },
    { header: 'Token Payment Mode', key: 'tokenPaymentMode', width: 20 },
    { header: 'Payment 1 Date', key: 'payment1Date', width: 15 },
    { header: 'Payment 1 Amount', key: 'payment1Amount', width: 20 },
    { header: 'Payment 2 Date', key: 'payment2Date', width: 15 },
    { header: 'Payment 2 Amount', key: 'payment2Amount', width: 20 },
    { header: 'Payment 3 Date', key: 'payment3Date', width: 15 },
    { header: 'Payment 3 Amount', key: 'payment3Amount', width: 20 },
    { header: 'Total Paid', key: 'totalPaid', width: 15 },
    { header: 'Balance Remaining', key: 'balanceRemaining', width: 20 },
    { header: 'Loan Amount', key: 'loanAmount', width: 15 },
    { header: 'Bank Name', key: 'bankName', width: 25 },
  ];
  styleHeader(sheet4);

  for (let i = 2; i <= 1000; i++) {
    sheet4.getCell(`H${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Cash,Cheque,UPI,NEFT,RTGS"']
    };
    
    // Dates
    ['D', 'I', 'K', 'M'].forEach(col => { sheet4.getCell(`${col}${i}`).numFmt = 'DD/MM/YYYY'; });
    
    // Currencies
    ['F', 'G', 'J', 'L', 'N', 'O', 'P', 'Q'].forEach(col => { sheet4.getCell(`${col}${i}`).numFmt = '₹#,##0.00'; });
    
    // Formulas
    sheet4.getCell(`O${i}`).value = { formula: `SUM(G${i},J${i},L${i},N${i})` };
    sheet4.getCell(`P${i}`).value = { formula: `F${i}-O${i}` };
  }

  // ── Sheet 5: Registration & Closure ───────────────────────────────────────
  const sheet5 = wb.addWorksheet('Registration & Closure', { properties: { tabColor: { argb: 'FFFF0000' } } });
  sheet5.columns = [
    { header: 'Lead ID*', key: 'leadId', width: 15 },
    { header: 'Client Name', key: 'clientName', width: 25 },
    { header: 'Agreement Date', key: 'agreementDate', width: 15 },
    { header: 'Registration Date', key: 'registrationDate', width: 20 },
    { header: 'Stamp Duty Paid', key: 'stampDutyPaid', width: 15 },
    { header: 'Possession Date', key: 'possessionDate', width: 15 },
    { header: 'Handover Done', key: 'handoverDone', width: 15 },
    { header: 'Final Status*', key: 'finalStatus', width: 20 },
    { header: 'Cancellation Reason', key: 'cancellationReason', width: 30 },
    { header: 'Refund Amount', key: 'refundAmount', width: 15 },
    { header: 'Channel Partner Name', key: 'channelPartnerName', width: 25 },
    { header: 'Commission Amount', key: 'commissionAmount', width: 20 },
    { header: 'Commission Paid Date', key: 'commissionPaidDate', width: 25 },
    { header: 'Customer Rating', key: 'customerRating', width: 15 },
    { header: 'Final Remarks', key: 'finalRemarks', width: 35 },
  ];
  styleHeader(sheet5);

  for (let i = 2; i <= 1000; i++) {
    sheet5.getCell(`E${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Yes,No"']
    };
    sheet5.getCell(`G${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Yes,No"']
    };
    sheet5.getCell(`H${i}`).dataValidation = {
      type: 'list', allowBlank: true, formulae: ['"Closed,Cancelled,Refunded"']
    };
    
    // Dates
    ['C', 'D', 'F', 'M'].forEach(col => { sheet5.getCell(`${col}${i}`).numFmt = 'DD/MM/YYYY'; });
    
    // Currencies
    ['J', 'L'].forEach(col => { sheet5.getCell(`${col}${i}`).numFmt = '₹#,##0.00'; });
  }

  return wb.xlsx.writeBuffer();
};
