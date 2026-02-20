/**
 * Calculates the required active length of a spiral/helical bimetal coil.
 * @param {number} A - Angular deflection (dial sweep in degrees)
 * @param {number} F - Flexivity of the material ((in/in)/°F)
 * @param {number} deltaT - Temperature change (T2 - T1 in °F)
 * @param {number} t - Thickness of the material (inches)
 * @returns {number} - Required active length (L) in inches
 */
function calculateLength(A, F, deltaT, t) {
    // Formula: L = (A * t) / (67 * F * deltaT)
    return (A * t) / (67 * F * deltaT);
}

module.exports = {
    calculateLength
};