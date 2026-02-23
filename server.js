const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/test-smm', async (req, res) => {
    try {
        // NEW: Grab 'provider' from the frontend request
        const { link, service, quantity, provider } = req.body;
        
        let smmUrl = "";
        let apiKey = "";

        // Dynamically set URL and API Key based on selected provider
        if (provider === 'smmPanelOne') {
            smmUrl = "https://smmpanelone.com/api/v2";
            apiKey = process.env.SMM_PANEL_ONE_KEY; // Add this to Render Env Vars
        } else {
            // Default to SMM Raja
            smmUrl = "https://www.smmraja.com/api/v3";
            apiKey = process.env.SMM_API_KEY; 
        }
        
        const data = new URLSearchParams();
        data.append("key", apiKey);
        data.append("action", "add");
        data.append("service", service);
        data.append("link", link);
        data.append("quantity", quantity);

        const apiResponse = await fetch(smmUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: data
        });

        const result = await apiResponse.json();
        
        // Pass the result back to the frontend
        res.json(result);
        
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Failed to fetch from the SMM API" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
