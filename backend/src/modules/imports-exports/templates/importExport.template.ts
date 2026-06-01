export const LEAD_COLUMNS = [
    { header: 'Name*',          key: 'name',         width: 20 },
    { header: 'Phone*',         key: 'phone',        width: 15 },
    { header: 'Email',          key: 'email',        width: 25 },
    { header: 'Source*',        key: 'source',       width: 15 },
    { header: 'Status',         key: 'status',       width: 15 },
    { header: 'Project Name',   key: 'projectName',  width: 20 },
    { header: 'Notes',          key: 'notes',        width: 30 },
    { header: 'Next Follow Up', key: 'nextFollowUp', width: 18 },
    { header: 'Agent Email*',   key: 'agentEmail',   width: 25 },
  ];
  
  export const CLIENT_COLUMNS = [
    { header: 'Name*',       key: 'name',       width: 20 },
    { header: 'Phone*',      key: 'phone',      width: 15 },
    { header: 'Email',       key: 'email',      width: 25 },
    { header: 'Address',     key: 'address',    width: 30 },
    { header: 'Aadhaar No',  key: 'aadhaar',    width: 15 },
    { header: 'PAN No',      key: 'pan',        width: 12 },
    { header: 'Agent Email*',key: 'agentEmail', width: 25 },
  ];
  
  export const PAYMENT_COLUMNS = [
    { header: 'Client Phone*',   key: 'clientPhone',  width: 15 },
    { header: 'Booking ID*',     key: 'bookingId',    width: 25 },
    { header: 'Amount*',         key: 'amount',       width: 12 },
    { header: 'Due Date*',       key: 'dueDate',      width: 15 },
    { header: 'Paid Date',       key: 'paidDate',     width: 15 },
    { header: 'Status*',         key: 'status',       width: 12 },
    { header: 'Payment Mode',    key: 'paymentMode',  width: 15 },
    { header: 'Receipt Number',  key: 'receiptNumber',width: 18 },
    { header: 'Agent Email*',    key: 'agentEmail',   width: 25 },
  ];
  
  export const PROJECT_COLUMNS = [
    { header: 'Project Name*', key: 'name',        width: 25 },
    { header: 'Location*',     key: 'location',    width: 25 },
    { header: 'Description',   key: 'description', width: 40 },
    { header: 'Total Units*',  key: 'totalUnits',  width: 12 },
    { header: 'Launch Date',   key: 'launchDate',  width: 15 },
    { header: 'Status*',       key: 'status',      width: 15 },
    { header: 'Amenities',     key: 'amenities',   width: 30 },
  ];
  
  export const UNIT_COLUMNS = [
    { header: 'Project Name*', key: 'projectName', width: 25 },
    { header: 'Unit Number*',  key: 'unitNumber',  width: 15 },
    { header: 'Type*',         key: 'type',        width: 12 },
    { header: 'Floor',         key: 'floor',       width: 8  },
    { header: 'Area (sqft)*',  key: 'area',        width: 12 },
    { header: 'Price*',        key: 'price',       width: 15 },
    { header: 'Status*',       key: 'status',      width: 12 },
    { header: 'Facing',        key: 'facing',      width: 12 },
  ];
  
  export const VALID_LEAD_SOURCES   = ['Website', 'Advertisement', 'Referral', 'Walk-In', 'Phone', 'Other'];
  export const VALID_LEAD_STATUSES  = ['New', 'Contacted', 'Interested', 'Site Visit', 'Negotiation', 'Closed Won', 'Closed Lost'];
  export const VALID_UNIT_TYPES     = ['1BHK', '2BHK', '3BHK', 'Plot', 'Shop', 'Villa'];
  export const VALID_UNIT_STATUSES  = ['Available', 'Booked', 'Sold'];
  export const VALID_PROJECT_STATUSES = ['Upcoming', 'Active', 'Completed'];
  export const VALID_PAYMENT_STATUSES = ['Pending', 'Paid', 'Overdue'];
  export const VALID_PAYMENT_MODES  = ['Cash', 'Cheque', 'NEFT', 'UPI', 'Other'];