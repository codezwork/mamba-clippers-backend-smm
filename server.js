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
            // Default to SMM Lite
            smmUrl = "https://smmlite.com/api/v2";
            apiKey = process.env.SMM_LITE_KEY; 
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
        // 1. Fetch the Live USD to INR Exchange Rate
        let inrRate = 83.50; // Fallback rate just in case the exchange API goes down
        try {
            const rateResponse = await fetch("https://open.er-api.com/v6/latest/USD");
            const rateData = await rateResponse.json();
            if (rateData && rateData.rates && rateData.rates.INR) {
                inrRate = rateData.rates.INR;
            }
        } catch (rateError) {
            console.error("Warning: Exchange rate API failed, using fallback.", rateError);
        }

        // 2. Fetch SMM Lite Balance
        const liteData = new URLSearchParams();
        liteData.append("key", process.env.SMM_LITE_KEY);
        liteData.append("action", "balance");
        
        const liteResponse = await fetch("https://smmlite.com/api/v2", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: liteData
        });
        const liteResult = await liteResponse.json();

        // 3. Fetch SMM Panel One Balance
        const panelOneData = new URLSearchParams();
        panelOneData.append("key", process.env.SMM_PANEL_ONE_KEY); 
        panelOneData.append("action", "balance");

        const panelOneResponse = await fetch("https://smmpanelone.com/api/v2", {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: panelOneData
        });
        const panelOneResult = await panelOneResponse.json();

        // 4. Convert dynamically to INR
        const liteInr = liteResult.balance 
            ? (parseFloat(liteResult.balance) * inrRate).toFixed(2) 
            : "Err";
            
        const panelOneInr = panelOneResult.balance 
            ? (parseFloat(panelOneResult.balance) * inrRate).toFixed(2) 
            : "Err";

        // 5. Send converted JSON back to the frontend
        res.json({
            lite: liteInr,
            panelOne: panelOneInr,
            liveRate: inrRate
        });
        
    } catch (error) {
        console.error("Balance Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch SMM balances" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
