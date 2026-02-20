const express = require('express');
const path = require('path');
const fs = require('fs');
const { calculateLength } = require('./math/calculator');

const app = express();
const PORT = 3000;

// Middleware to serve static files (our HTML frontend)
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

// API Endpoint to process the calculation
app.post('/api/calculate', (req, res) => {
    // Extract inputs sent from the browser
    const { minTemp, maxTemp, dialSweep, thickness } = req.body;
    const deltaT = maxTemp - minTemp;

    // Load materials database
    const materialsPath = path.join(__dirname, 'data', 'materials.json');
    const materialsData = JSON.parse(fs.readFileSync(materialsPath, 'utf8'));

    // Filter by max temperature and sort by highest flexivity
    const viableMaterials = materialsData
        .filter(mat => mat.maxRecommendedTempF >= maxTemp)
        .sort((a, b) => b.flexivity - a.flexivity);

    // Calculate required lengths
    const results = viableMaterials.map(mat => {
        const requiredLength = calculateLength(dialSweep, mat.flexivity, deltaT, thickness);
        return {
            alloy: mat.truflexType,
            astm: mat.astmType,
            flexivity: mat.flexivity,
            requiredLength: requiredLength.toFixed(3)
        };
    });

    // Send the results back to the browser
    res.json({ span: deltaT, results });
});

// Start the server
app.listen(PORT, () => {
    console.log(`\n--- Bimetal Calculator Server ---`);
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop.\n`);
});