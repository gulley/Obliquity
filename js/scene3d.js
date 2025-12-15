/**
 * Three.js 3D Scene for Obliquity Visualization
 */

class ObliquityScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.currentObliquity = 0;
        this.currentNumDays = 0;
        this.currentDay = 0;
        this.noonLines = [];
        this.mismatchArc = null;

        this.init();
        this.createGeometry();
        this.setupControls();
        this.animate();
    }

    init() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xf0f0f0);

        // Camera (orthographic for true 2D projection, no perspective)
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 5;
        this.camera = new THREE.OrthographicCamera(
            frustumSize * aspect / -2,  // left
            frustumSize * aspect / 2,   // right
            frustumSize / 2,            // top
            frustumSize / -2,           // bottom
            0.1,                        // near
            1000                        // far
        );
        this.defaultCameraPosition = new THREE.Vector3(0, 5, 0);  // Top-down
        this.camera.position.copy(this.defaultCameraPosition);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.container.appendChild(this.renderer.domElement);

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.4);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }

    createGeometry() {
        // Outer circle (ecliptic plane) - radius 2, black
        const eclipticCurve = new THREE.EllipseCurve(
            0, 0,            // center x, y
            2, 2,            // xRadius, yRadius
            0, 2 * Math.PI,  // start angle, end angle
            false,           // clockwise
            0                // rotation
        );
        const eclipticPoints = eclipticCurve.getPoints(64);
        const eclipticGeometry = new THREE.BufferGeometry().setFromPoints(eclipticPoints);
        const eclipticMaterial = new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2 });
        this.eclipticCircle = new THREE.Line(eclipticGeometry, eclipticMaterial);
        this.eclipticCircle.rotation.x = Math.PI / 2;  // Lay flat in x-z plane
        this.scene.add(this.eclipticCircle);

        // Inner circle (equatorial plane) - radius 1, gray outline with white fill

        // White filled disc (opaque background)
        const equatorialFillGeometry = new THREE.CircleGeometry(1, 64);
        const equatorialFillMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide
        });
        this.equatorialFill = new THREE.Mesh(equatorialFillGeometry, equatorialFillMaterial);
        this.equatorialFill.rotation.x = Math.PI / 2;  // Lay flat in x-z plane

        // Gray outline
        const equatorialCurve = new THREE.EllipseCurve(
            0, 0,
            1, 1,
            0, 2 * Math.PI,
            false,
            0
        );
        const equatorialPoints = equatorialCurve.getPoints(64);
        const equatorialGeometry = new THREE.BufferGeometry().setFromPoints(equatorialPoints);
        const equatorialMaterial = new THREE.LineBasicMaterial({ color: 0x666666, linewidth: 2 });
        this.equatorialCircle = new THREE.Line(equatorialGeometry, equatorialMaterial);
        this.equatorialCircle.rotation.x = Math.PI / 2;  // Lay flat

        // Group for equatorial plane and noon lines (will be rotated together)
        this.equatorialGroup = new THREE.Group();
        this.equatorialGroup.add(this.equatorialFill);    // Add fill first (renders behind)
        this.equatorialGroup.add(this.equatorialCircle);  // Add outline on top
        this.scene.add(this.equatorialGroup);

        // Earth (blue sphere at center with day/night shading)
        const earthGeometry = new THREE.SphereGeometry(0.1, 32, 32);

        // Custom shader material for day/night terminator
        this.earthMaterial = new THREE.ShaderMaterial({
            uniforms: {
                sunPosition: { value: new THREE.Vector3(2, 0, 0) },
                dayColor: { value: new THREE.Color(0x4d9fff) },
                nightColor: { value: new THREE.Color(0x000000) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    // Transform normal to world space (not view space)
                    vNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
                    vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 sunPosition;
                uniform vec3 dayColor;
                uniform vec3 nightColor;
                varying vec3 vNormal;
                varying vec3 vPosition;
                void main() {
                    // Direction from Earth center to sun
                    vec3 sunDir = normalize(sunPosition);
                    // Check if surface normal points toward sun
                    float intensity = dot(vNormal, sunDir);
                    // Sharp terminator: day side if facing sun, night side otherwise
                    vec3 color = mix(nightColor, dayColor, step(0.0, intensity));
                    gl_FragColor = vec4(color, 1.0);
                }
            `
        });

        this.earth = new THREE.Mesh(earthGeometry, this.earthMaterial);
        this.scene.add(this.earth);

        // North pole axis arrow (rotational axis)
        const axisDirection = new THREE.Vector3(0, 1, 0); // Initial: pointing up
        const axisOrigin = new THREE.Vector3(0, 0, 0);
        const axisLength = 1.5;
        const axisColor = 0x4d9fff; // Blue (matches Earth day color)
        this.northPoleArrow = new THREE.ArrowHelper(
            axisDirection,
            axisOrigin,
            axisLength,
            axisColor,
            0.2,  // Head length
            0.1   // Head width
        );
        this.scene.add(this.northPoleArrow);

        // Sun (yellow sphere, same size as Earth)
        const sunGeometry = new THREE.SphereGeometry(0.1, 32, 32);
        const sunMaterial = new THREE.MeshStandardMaterial({
            color: 0xffcc33,
            emissive: 0xffcc33,
            emissiveIntensity: 0.5
        });
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.scene.add(this.sun);
    }

    setupControls() {
        // OrbitControls for 3D navigation
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
    }

    resetCamera() {
        this.camera.position.copy(this.defaultCameraPosition);
        this.camera.lookAt(0, 0, 0);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
    }

    updateObliquity(obliquityDeg) {
        if (this.currentObliquity === obliquityDeg) return;
        this.currentObliquity = obliquityDeg;

        // Rotate equatorial group around Z-axis (creates visible tilt in x-z plane)
        const obliquityRad = THREE.MathUtils.degToRad(obliquityDeg);
        this.equatorialGroup.rotation.z = obliquityRad;

        // Update north pole arrow direction (perpendicular to equatorial plane)
        // When rotated around Z-axis, the Y-axis becomes [-sin(θ), cos(θ), 0]
        const newDirection = new THREE.Vector3(
            -Math.sin(obliquityRad),
            Math.cos(obliquityRad),
            0
        );
        this.northPoleArrow.setDirection(newDirection);
    }

    updateNoonLines(numDays) {
        if (this.currentNumDays === numDays) return;
        this.currentNumDays = numDays;

        // Remove existing noon lines
        this.noonLines.forEach(line => {
            if (line.parent === this.scene) {
                this.scene.remove(line);
            } else if (line.parent === this.equatorialGroup) {
                this.equatorialGroup.remove(line);
            }
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        });
        this.noonLines = [];

        // Only create lines if we have a reasonable number of days
        const lineStep = numDays > 100 ? Math.floor(numDays / 32) : 1;

        // Create both sets of noon lines
        for (let i = 0; i < numDays; i += lineStep) {
            const angle = (i / numDays) * 2 * Math.PI;

            // Solar noon lines: center to outer circle (ecliptic, radius 2)
            // Create directly in x-z plane (where the circles are)
            const eclipticPoints = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(2 * Math.cos(angle), 0, 2 * Math.sin(angle))
            ];
            const eclipticGeometry = new THREE.BufferGeometry().setFromPoints(eclipticPoints);
            const eclipticMaterial = new THREE.LineBasicMaterial({
                color: 0xcccccc,
                transparent: true,
                opacity: 0.3
            });
            const eclipticLine = new THREE.Line(eclipticGeometry, eclipticMaterial);
            // No rotation needed - already in x-z plane
            this.scene.add(eclipticLine);
            this.noonLines.push(eclipticLine);

            // Clock noon lines: center to inner circle (equatorial, radius 1)
            // These rotate with the equatorialGroup
            const equatorialPoints = [
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle))
            ];
            const equatorialGeometry = new THREE.BufferGeometry().setFromPoints(equatorialPoints);
            const equatorialMaterial = new THREE.LineBasicMaterial({
                color: 0xaaaaaa,
                transparent: true,
                opacity: 0.3
            });
            const equatorialLine = new THREE.Line(equatorialGeometry, equatorialMaterial);
            // No rotation needed - already in x-z plane
            this.equatorialGroup.add(equatorialLine);  // Add to group so it rotates with inner circle
            this.noonLines.push(equatorialLine);
        }
    }

    updateSunPosition(dayOfYear, numDays) {
        this.currentDay = dayOfYear;
        const position = getSunPosition(dayOfYear, numDays);
        position.multiplyScalar(2);  // Scale to ecliptic radius
        this.sun.position.copy(position);

        // Update Earth's shader to show day/night based on sun position
        this.earthMaterial.uniforms.sunPosition.value.copy(this.sun.position);
    }

    drawMismatchArc(dayOfYear, numDays, obliquityDeg) {
        // Remove previous arc
        if (this.mismatchArc) {
            this.scene.remove(this.mismatchArc);
            if (this.mismatchArc.geometry) this.mismatchArc.geometry.dispose();
            if (this.mismatchArc.material) this.mismatchArc.material.dispose();
        }

        // Solar noon position (on ecliptic, radius 2)
        const angle = (dayOfYear / numDays) * 2 * Math.PI;
        const eclipticPos = new THREE.Vector3(
            2 * Math.cos(angle),
            0,
            2 * Math.sin(angle)
        );

        // Clock noon position (on equatorial circle, radius 1, rotated by obliquity)
        // Start with position on inner circle at same angle
        const equatorialLocalPos = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));

        // Apply the obliquity rotation (same as equatorialGroup)
        const obliquityRad = THREE.MathUtils.degToRad(obliquityDeg);
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationZ(obliquityRad);
        const equatorialWorldPos = equatorialLocalPos.clone().applyMatrix4(rotationMatrix);

        // Draw orange line to solar noon (ecliptic)
        const eclipticPoints = [
            new THREE.Vector3(0, 0, 0),
            eclipticPos
        ];
        const eclipticGeometry = new THREE.BufferGeometry().setFromPoints(eclipticPoints);
        const eclipticMaterial = new THREE.LineBasicMaterial({
            color: 0xff8800,
            linewidth: 2
        });
        const eclipticLine = new THREE.Line(eclipticGeometry, eclipticMaterial);
        this.scene.add(eclipticLine);

        // Draw blue line to clock noon (equatorial, rotated)
        const equatorialPoints = [
            new THREE.Vector3(0, 0, 0),
            equatorialWorldPos
        ];
        const equatorialGeometry = new THREE.BufferGeometry().setFromPoints(equatorialPoints);
        const equatorialMaterial = new THREE.LineBasicMaterial({
            color: 0x0088ff,
            linewidth: 2
        });
        const equatorialLine = new THREE.Line(equatorialGeometry, equatorialMaterial);
        this.scene.add(equatorialLine);

        // Create thick red arc on inner circle (discrepancy arc)
        const arcRadius = 1.0; // Coincident with inner equatorial circle
        const angle1 = Math.atan2(eclipticPos.z, eclipticPos.x);
        const angle2 = Math.atan2(equatorialWorldPos.z, equatorialWorldPos.x);

        // Create arc curve points
        const arcPoints = [];
        const steps = 50;
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const arcAngle = angle1 + (angle2 - angle1) * t;
            arcPoints.push(new THREE.Vector3(
                arcRadius * Math.cos(arcAngle),
                0,
                arcRadius * Math.sin(arcAngle)
            ));
        }

        // Create a curve from the points
        const arcCurve = new THREE.CatmullRomCurve3(arcPoints);

        // Create thick tube geometry
        const tubeGeometry = new THREE.TubeGeometry(
            arcCurve,
            steps,           // segments
            0.04,            // radius (thickness of tube)
            8,               // radial segments
            false            // closed
        );
        const tubeMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const arc = new THREE.Mesh(tubeGeometry, tubeMaterial);
        this.scene.add(arc);

        // Store references for cleanup (group them)
        const group = new THREE.Group();
        group.add(eclipticLine);
        group.add(equatorialLine);
        group.add(arc);
        this.mismatchArc = group;
        this.scene.add(this.mismatchArc);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        const aspect = this.container.clientWidth / this.container.clientHeight;
        const frustumSize = 5;
        this.camera.left = frustumSize * aspect / -2;
        this.camera.right = frustumSize * aspect / 2;
        this.camera.top = frustumSize / 2;
        this.camera.bottom = frustumSize / -2;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }
}
