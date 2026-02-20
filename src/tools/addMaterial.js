const fs = require('fs');
const path = require('path');

// Point to the master data file
const filePath = path.join(__dirname, 'materials.json');

/**
 * Appends a new material object to the JSON database.
 * @param {Object} newMaterial 
 */
function addMaterial(newMaterial) {
    try {
        // 1. Read the existing JSON file synchronously
        const data = fs.readFileSync(filePath, 'utf8');
        
        // 2. Parse the data into a JavaScript array
        const materials = JSON.parse(data);
        
        // 3. Push the new material to the array
        materials.push(newMaterial);
        
        // 4. Serialize the array back to a formatted JSON string and overwrite the file
        fs.writeFileSync(filePath, JSON.stringify(materials, null, 4), 'utf8');
        
        console.log(`Successfully added ${newMaterial.truflexType} to the database.`);
    } catch (err) {
        console.error('Error updating materials.json:', err);
    }
}

// Example Execution: Adding "GB14" from your documents
const gb14 = {
    "truflexType": "GB14",
    "astmType": "N/A",
    "maxRecommendedTempF": 1000,
    "flexivity": 0.0000100, // 100 flexivity
    "elasticModulusPsi": 26000000, // 26.0 Modulus
    "description": "Good corrosion resistance in aqueous environments." //
};

// Run the function
addMaterial(gb14);