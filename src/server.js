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

// NEW: Endpoint to get all materials so the frontend dropdown can load them
app.get('/api/materials', (req, res) => {
    const dbPath = path.join(__dirname, 'data', 'materials.json');
    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read database' });
        try {
            res.json(JSON.parse(data));
        } catch (e) {
            res.json([]); // Return empty array if file is empty or corrupted
        }
    });
});

// UPDATED: Endpoint to Add or Update a material (Upsert)
app.post('/api/materials', express.json(), (req, res) => {
    const newMaterial = req.body;
    const dbPath = path.join(__dirname, 'data', 'materials.json');

    fs.readFile(dbPath, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Failed to read database' });
        
        let materials = [];
        try {
            if (data.trim() !== '') {
                const parsed = JSON.parse(data);
                if (Array.isArray(parsed)) materials = parsed;
            }
        } catch (parseError) {
            return res.status(500).json({ error: 'Database file is corrupted' });
        }

        // UPSERT LOGIC: Does this ASTM type already exist?
        const existingIndex = materials.findIndex(m => m.astmType.toLowerCase() === newMaterial.astmType.toLowerCase());

        if (existingIndex >= 0) {
            // Replace existing material
            materials[existingIndex] = newMaterial;
        } else {
            // Add new material
            materials.push(newMaterial);
        }

        fs.writeFile(dbPath, JSON.stringify(materials, null, 2), (writeErr) => {
            if (writeErr) return res.status(500).json({ error: 'Failed to save material' });
            res.status(201).json({ message: 'Material saved successfully', material: newMaterial });
        });
    });
});



// Start the server
app.listen(PORT, () => {
    console.log(`\n--- Bimetal Calculator Server ---`);
    console.log(`Server is running at http://localhost:${PORT}`);
    console.log(`Press Ctrl+C to stop.\n`);
});