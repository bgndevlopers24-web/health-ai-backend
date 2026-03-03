// server.js
require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static frontend files
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------------------------
// PROXY ENDPOINTS
// ----------------------------------------------------------------------

// 1. USDA Food Search
app.get('/api/nutrition/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
        const response = await fetch(
            `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=${process.env.USDA_API_KEY}&query=${encodeURIComponent(query)}&pageSize=5`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('USDA error:', error);
        res.status(500).json({ error: 'Failed to fetch from USDA' });
    }
});

// 2. Air Quality
// 2. Air Quality
app.get('/api/air-quality', async (req, res) => {
    const city = req.query.city;
    if (!city) return res.status(400).json({ error: 'Missing city' });

    try {
        const geoRes = await fetch(
            `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${process.env.OPENWEATHER_KEY}`
        );
        const geoData = await geoRes.json();
        if (!geoData.length) return res.status(404).json({ error: 'City not found' });

        const { lat, lon, name, country } = geoData[0];

        const airRes = await fetch(
            `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_KEY}`
        );
        const airData = await airRes.json();

        const weatherRes = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_KEY}&units=metric`
        );
        const weatherData = await weatherRes.json();

        res.json({
            name,       // ✅ changed from 'city' to 'name'
            country,
            air: airData,
            weather: weatherData
        });
    } catch (error) {
        console.error('Air quality error:', error);
        res.status(500).json({ error: 'Failed to fetch air quality' });
    }
});

// 3. Drug Lookup
app.get('/api/drug/search', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
        const response = await fetch(
            `https://api.fda.gov/drug/label.json?api_key=${process.env.OPENFDA_API_KEY}&search=openfda.generic_name:"${query}"+OR+openfda.brand_name:"${query}"&limit=5`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('OpenFDA error:', error);
        res.status(500).json({ error: 'Failed to fetch drug data' });
    }
});

// 4. Health News
app.get('/api/news', async (req, res) => {
    const query = req.query.q || '';
    try {
        const url = `https://newsdata.io/api/1/news?apikey=${process.env.NEWS_API_KEY}&language=en&category=health${query ? `&q=${encodeURIComponent(query)}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('News error:', error);
        res.status(500).json({ error: 'Failed to fetch news' });
    }
});

// 5. Disease Info (Wikipedia)
app.get('/api/disease', async (req, res) => {
    const query = req.query.q;
    if (!query) return res.status(400).json({ error: 'Missing query' });

    try {
        const response = await fetch(
            `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`
        );
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Wikipedia error:', error);
        res.status(500).json({ error: 'Failed to fetch disease info' });
    }
});

// Catch‑all middleware for SPA
app.use((req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Health AI backend running on http://localhost:${PORT}`);
});