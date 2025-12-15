/**
 * UI Controls and Event Handlers
 */

class UIControls {
    constructor(scene) {
        this.scene = scene;
        this.isAnimating = false;
        this.animationFrame = null;
        this.lastAnimationTime = 0;

        // Default values
        this.obliquity = 23.4;
        this.numDays = 16;
        this.currentDay = 0;

        this.setupEventListeners();
        this.update();
    }

    setupEventListeners() {
        // Obliquity slider + number input (bidirectional binding)
        const obliquitySlider = document.getElementById('obliquity-slider');
        const obliquityNumber = document.getElementById('obliquity-number');

        obliquitySlider.addEventListener('input', (e) => {
            this.obliquity = parseFloat(e.target.value);
            obliquityNumber.value = this.obliquity;
            this.update();
        });

        obliquityNumber.addEventListener('input', (e) => {
            this.obliquity = parseFloat(e.target.value);
            obliquitySlider.value = this.obliquity;
            this.update();
        });

        // Number of days slider + number input
        const numDaysSlider = document.getElementById('numdays-slider');
        const numDaysNumber = document.getElementById('numdays-number');

        numDaysSlider.addEventListener('input', (e) => {
            this.numDays = parseInt(e.target.value);
            numDaysNumber.value = this.numDays;
            this.currentDay = Math.min(this.currentDay, this.numDays - 1);
            this.updateCurrentDayMax();
            this.update();
        });

        numDaysNumber.addEventListener('input', (e) => {
            this.numDays = parseInt(e.target.value);
            numDaysSlider.value = this.numDays;
            this.currentDay = Math.min(this.currentDay, this.numDays - 1);
            this.updateCurrentDayMax();
            this.update();
        });

        // Current day slider + number input
        const currentDaySlider = document.getElementById('currentday-slider');
        const currentDayNumber = document.getElementById('currentday-number');

        currentDaySlider.addEventListener('input', (e) => {
            this.currentDay = parseInt(e.target.value);
            currentDayNumber.value = this.currentDay;
            this.updateDayOnly();
        });

        currentDayNumber.addEventListener('input', (e) => {
            this.currentDay = parseInt(e.target.value);
            currentDaySlider.value = this.currentDay;
            this.updateDayOnly();
        });

        // Animation controls
        document.getElementById('play-btn').addEventListener('click', () => {
            this.startAnimation();
        });

        document.getElementById('pause-btn').addEventListener('click', () => {
            this.stopAnimation();
        });

        // Reset camera button
        document.getElementById('reset-camera-btn').addEventListener('click', () => {
            this.scene.resetCamera();
        });
    }

    updateCurrentDayMax() {
        const currentDaySlider = document.getElementById('currentday-slider');
        const currentDayNumber = document.getElementById('currentday-number');
        currentDaySlider.max = this.numDays - 1;
        currentDayNumber.max = this.numDays - 1;
    }

    update() {
        // Full update (recalculate everything)
        this.scene.updateObliquity(this.obliquity);
        this.scene.updateNoonLines(this.numDays);

        this.updateDayOnly();
    }

    updateDayOnly() {
        // Quick update (only current day position)
        this.scene.updateSunPosition(this.currentDay, this.numDays);
        this.scene.drawMismatchArc(this.currentDay, this.numDays, this.obliquity);
        this.updateDiscrepancyDisplay();
    }

    updateDiscrepancyDisplay() {
        // Calculate discrepancy for current day
        const t = (this.currentDay / this.numDays) * 2 * Math.PI;
        const obliquityRad = THREE.MathUtils.degToRad(this.obliquity);

        // Point on ecliptic (solar noon)
        const p1 = new THREE.Vector3(Math.cos(t), Math.sin(t), 0);

        // Rotate to get equatorial position (clock noon)
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(obliquityRad);
        const p2 = p1.clone().applyMatrix4(rotationMatrix);
        p2.z = 0; // Project to x-y plane

        // Calculate angle between vectors
        const crossProduct = new THREE.Vector3().crossVectors(p1, p2);
        const dotProduct = p1.dot(p2);
        const angleRad = Math.atan2(crossProduct.length(), dotProduct);
        const angleDeg = THREE.MathUtils.radToDeg(angleRad);

        // Convert to minutes
        const angleMinutes = (angleRad / (2 * Math.PI)) * 24 * 60;

        // Update display
        document.getElementById('angle-discrepancy').textContent = angleDeg.toFixed(2) + '°';
        document.getElementById('time-discrepancy').textContent = angleMinutes.toFixed(2) + ' minutes';
    }

    startAnimation() {
        if (this.isAnimating) return;
        this.isAnimating = true;
        this.animationStartTime = Date.now();
        this.animationStartDay = this.currentDay;

        const animate = () => {
            if (!this.isAnimating) return;

            const now = Date.now();
            const elapsed = now - this.animationStartTime;

            // Complete orbit in 4 seconds (4000ms), regardless of numDays
            const orbitDuration = 4000;
            const progress = (elapsed % orbitDuration) / orbitDuration;
            const newDay = Math.floor((this.animationStartDay + progress * this.numDays) % this.numDays);

            if (newDay !== this.currentDay) {
                this.currentDay = newDay;
                document.getElementById('currentday-slider').value = this.currentDay;
                document.getElementById('currentday-number').value = this.currentDay;
                this.updateDayOnly();
            }

            this.animationFrame = requestAnimationFrame(animate);
        };

        animate();
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
    }
}
