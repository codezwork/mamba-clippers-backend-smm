const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/test-smm', async (req, res) => {
    try {
        // NEW: Grab 'provider' from the frontend request
        const { link, service, quantity, provider, runs, interval } = req.body;
        
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

        // 2. ADD THESE CONDITIONAL CHECKS
        // This guarantees your live app won't break. If runs/interval are missing, it skips this.
        if (runs) data.append("runs", runs);
        if (interval) data.append("interval", interval);

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

app.get('/api/smm-balance', async (req, res) => {
    try {
        // 1. Fetch SMM Raja Balance First
        const rajaData = new URLSearchParams();
        rajaData.append("key", process.env.SMM_API_KEY);
        rajaData.append("action", "balance");
        
        const rajaResponse = await fetch("https://www.smmraja.com/api/v3", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: rajaData
        });
        const rajaResult = await rajaResponse.json();

        // 2. Fetch SMM Panel One Balance Second
        const panelOneData = new URLSearchParams();
        panelOneData.append("key", process.env.SMM_PANEL_ONE_KEY); // Ensure this is in your Render Env Vars
        panelOneData.append("action", "balance");

        const panelOneResponse = await fetch("https://smmpanelone.com/api/v2", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: panelOneData
        });
        const panelOneResult = await panelOneResponse.json();

        // Send formatted JSON back to the frontend
        res.json({
            raja: rajaResult.balance ? parseFloat(rajaResult.balance).toFixed(2) : "Err",
            panelOne: panelOneResult.balance ? parseFloat(panelOneResult.balance).toFixed(2) : "Err"
        });
        
    } catch (error) {
        console.error("Balance Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch SMM balances" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
