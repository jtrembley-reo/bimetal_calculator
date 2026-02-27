/**
 * Advanced Bimetal Coil Calculator
 * Calculates active length, tolerances, helical geometry, and torque forces.
 */
function calculateCoil(material, t1, t2, sweep, thickness, thickTol, maxOD, width, gap) {
    if (t2 > material.maxRecommendedTempF) {
        return { error: `Max temp exceeds material limit (${material.maxRecommendedTempF}°F)` };
    }

    let selectedFlexivity = null;
    for (const flex of material.flexivities) {
        if (t1 >= flex.minTempF && t2 <= flex.maxTempF) {
            selectedFlexivity = flex;
            break;
        }
    }
    
    if (!selectedFlexivity) return { error: 'No flexivity data for this temperature range.' };

    let sensitivityWarning = false;
    if (material.maxSensitivityRangeF && material.maxSensitivityRangeF.length === 2) {
        if (t1 < material.maxSensitivityRangeF[0] || t2 > material.maxSensitivityRangeF[1]) {
            sensitivityWarning = true;
        }
    }

    // Extract Base Values
    const F = selectedFlexivity.baseValue * selectedFlexivity.multiplier;
    
    // Safety check: Ensure Modulus of Elasticity exists in the DB before calculating
    let E = 0;
    if (material.modulusOfElasticityPsi && material.modulusOfElasticityPsi.baseValue) {
        E = material.modulusOfElasticityPsi.baseValue * material.modulusOfElasticityPsi.multiplier;
    }

    const deltaT = t2 - t1;

    // Length & Tolerances
    const targetLength = (sweep * thickness) / (67 * F * deltaT);
    const fTolDec = selectedFlexivity.tolerancePercent / 100;
    const fMin = F * (1 - fTolDec);
    const fMax = F * (1 + fTolDec);
    const maxLength = (sweep * (thickness + thickTol)) / (67 * fMin * deltaT);
    const minLength = (sweep * (thickness - thickTol)) / (67 * fMax * deltaT);

    // Helical Geometry & Finished Length
    const meanDiameter = maxOD - thickness;
    const targetTurns = targetLength / (Math.PI * meanDiameter);
    // Solid Axial Length: The height of the coil if the turns are touching
    const solidAxialLength = targetTurns * width; 
    const coilHeight = targetTurns * (width + gap);
    // Torque Calculations (Outputs in ounce-inches)
    let thermalTorque = 0;
    let mechTorqueRate = 0;
    
    if (E > 0) {
        // Torque = P * r = 1.55 * E * F * deltaT * w * t^2
        thermalTorque = 1.55 * E * F * deltaT * width * Math.pow(thickness, 2);
        
        // Mechanical Torque Rate (Torque per degree) = (0.0232 * E * w * t^3) / L
        mechTorqueRate = (0.0232 * E * width * Math.pow(thickness, 3)) / targetLength;
    }

    return {
        astmType: material.astmType,
        targetLength,
        minLength,
        maxLength,
        meanDiameter,
        targetTurns,
        solidAxialLength,
        coilHeight,
        thermalTorque,
        mechTorqueRate,
        sensitivityWarning,
        appliedFlexivityRange: `${selectedFlexivity.minTempF}°F to ${selectedFlexivity.maxTempF}°F`
    };
}

module.exports = { calculateCoil };