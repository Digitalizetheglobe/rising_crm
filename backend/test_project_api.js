const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const token = jwt.sign(
  { id: new mongoose.Types.ObjectId().toString(), role: 'SUPER_ADMIN' },
  'your_super_secret_key_change_this_in_production',
  { expiresIn: '1h' }
);

const payload = {
  name: "Meta Test Project",
  location: "Pune",
  description: "Test Project for Meta integration",
  type: "PLOTTED",
  totalUnits: 100,
  status: "UPCOMING",
  amenities: ["Security"],
  metaCampaigns: [
    {
      campaignLabel: "Skyline Launch",
      adId: "123456789",
      formId: "N/A",
      platform: "facebook",
      isActive: true
    }
  ]
};

fetch('http://localhost:5000/v1/projects', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(payload)
})
  .then(res => res.json())
  .then(data => {
    console.log("Response:", JSON.stringify(data, null, 2));
  })
  .catch(err => console.error("Error:", err));
