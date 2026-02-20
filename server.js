const express = require('express');
const cors = require('cors');

const app = express();
// CRITICAL TWEAK: Let Render assign the port, fallback to 3000 for local testing
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.post('/api/test-smm', async (req, res) => {
    try {
        const { link, service, quantity } = req.body;
        const smmUrl = "https://www.smmraja.com/api/v3";
        
        const data = new URLSearchParams();
        // CRITICAL TWEAK: Use an environment variable for your API key
        data.append("key", process.env.SMM_API_KEY);
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
        res.json(result);
        
    } catch (error) {
        console.error("Server Error:", error);
        res.status(500).json({ error: "Failed to fetch from the SMM API" });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server is running on port ${PORT}`);
});
