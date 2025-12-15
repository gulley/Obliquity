/**
 * Mathematical calculations for obliquity visualization
 * Ported from MATLAB blog.m code
 */

/**
 * Calculate angular discrepancy for all days of the year
 * This is the core calculation from MATLAB lines 105-117
 *
 * @param {number} obliquityDeg - Obliquity angle in degrees
 * @param {number} numDays - Number of days in year
 * @returns {Array} - Array of {day, angle, minutes} objects
 */
function calculateDiscrepancy(obliquityDeg, numDays) {
    const obliquityRad = THREE.MathUtils.degToRad(obliquityDeg);
    const discrepancies = [];

    // Create Y-axis rotation matrix (equivalent to MATLAB's makehgtform)
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(obliquityRad);

    // Calculate for each day (t ranges from 0 to 2*PI)
    for (let n = 0; n < numDays; n++) {
        const t = (n / numDays) * 2 * Math.PI;

        // Point on ecliptic (outer circle)
        const p1 = new THREE.Vector3(Math.cos(t), Math.sin(t), 0);

        // Rotate to get corresponding point on equatorial plane
        const p2 = p1.clone().applyMatrix4(rotationMatrix);

        // Project back onto x-y plane (set z = 0)
        p2.z = 0;

        // Calculate angle between the two vectors
        const crossProduct = new THREE.Vector3().crossVectors(p1, p2);
        const dotProduct = p1.dot(p2);
        const angleRad = Math.atan2(crossProduct.length(), dotProduct);

        // Convert to minutes (angle / (2*PI) * 24 hours * 60 minutes)
        const angleMinutes = (angleRad / (2 * Math.PI)) * 24 * 60;

        discrepancies.push({
            day: n,
            angle: t,  // Position in orbit (radians)
            minutes: angleMinutes
        });
    }

    return discrepancies;
}

/**
 * Calculate sun position for a given day
 *
 * @param {number} dayOfYear - Current day (0 to numDays-1)
 * @param {number} numDays - Total days in year
 * @returns {THREE.Vector3} - Position on ecliptic circle (in x-z plane)
 */
function getSunPosition(dayOfYear, numDays) {
    const t = (dayOfYear / numDays) * 2 * Math.PI;
    // Return position in x-z plane (where the circles are)
    return new THREE.Vector3(Math.cos(t), 0, Math.sin(t));
}

/**
 * Calculate corresponding position on equatorial plane
 *
 * @param {THREE.Vector3} eclipticPos - Position on ecliptic
 * @param {number} obliquityDeg - Obliquity in degrees
 * @returns {THREE.Vector3} - Projected position on equatorial plane
 */
function projectToEquatorialPlane(eclipticPos, obliquityDeg) {
    const obliquityRad = THREE.MathUtils.degToRad(obliquityDeg);
    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationY(obliquityRad);

    const projected = eclipticPos.clone().applyMatrix4(rotationMatrix);
    projected.z = 0;  // Project to x-y plane

    return projected;
}
