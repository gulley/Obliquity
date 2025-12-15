# Earth's Obliquity Visualization

An interactive web application that demonstrates how Earth's axial tilt (obliquity) affects the angular mismatch between solar days and clock days, contributing to the Equation of Time.

## Overview

This visualization shows how the Earth's equatorial plane (rotation) is tilted relative to the ecliptic plane (orbit), creating a discrepancy between:
- **Solar noon** - when the sun is highest in the sky
- **Clock noon** - exactly 12:00 PM on our standardized clocks

This discrepancy varies throughout the year and can be up to 10 minutes at Earth's actual obliquity of 23.4°.

## Features

- **Interactive 3D Visualization**
  - Orbitable camera controls (click and drag to rotate, scroll to zoom)
  - Two concentric circles representing ecliptic (outer) and equatorial (inner) planes
  - Earth (blue) at center, Sun (yellow) moving along ecliptic
  - Visual lines showing the angular mismatch

- **Real-Time Parameter Controls**
  - Adjust obliquity angle (0-45°)
  - Change number of days in year (12-500)
  - Select current day to see specific mismatch
  - All changes update visualization immediately

- **Animation**
  - Play/Pause controls to step through days automatically
  - Watch how the mismatch changes throughout the year

- **Discrepancy Graph**
  - Chart showing time discrepancy (in minutes) across the full year
  - Updates dynamically as you change parameters

## Technology Stack

- **Three.js** - 3D rendering and camera controls
- **Chart.js** - Discrepancy plotting
- **Vanilla JavaScript** - No framework dependencies
- **CSS Grid** - Responsive layout

## File Structure

```
obliquity-visualization/
├── index.html              # Main HTML structure
├── css/
│   └── styles.css          # Styling and responsive layout
├── js/
│   ├── main.js             # Application initialization
│   ├── math.js             # Mathematical calculations (MATLAB port)
│   ├── scene3d.js          # Three.js 3D visualization
│   ├── chart.js            # Chart.js discrepancy plot
│   └── controls.js         # UI controls and event handlers
└── README.md               # This file
```

## How to Run

### Option 1: Local HTTP Server (Recommended)

Due to browser security restrictions with loading JavaScript modules, you should run this with a local HTTP server:

**Using Python:**
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

**Using Node.js:**
```bash
npx http-server
```

Then open your browser to `http://localhost:8000`

### Option 2: Direct File Access

Some browsers may allow direct file access. Simply open `index.html` in your browser. If you see errors, use Option 1 instead.

### Option 3: GitHub Pages

This application is designed to work with GitHub Pages:

1. Push this repository to GitHub
2. Go to repository Settings → Pages
3. Set source to root directory
4. Access at `https://yourusername.github.io/obliquity-visualization/`

## Usage Guide

1. **Camera Controls**
   - Click and drag to rotate the view
   - Scroll to zoom in/out
   - Click "Reset View" to return to default top-down view

2. **Parameter Controls**
   - **Obliquity**: Adjust Earth's axial tilt (default: 23.4°)
   - **Days in Year**: Change how many days are in a year (default: 365)
   - **Current Day**: Select which day to visualize (0 to numDays-1)

3. **Animation**
   - Click "Play" to automatically advance through days
   - Click "Pause" to stop animation
   - The current day slider will update as animation plays

4. **Interpreting the Visualization**
   - Red line: Solar noon position (on ecliptic)
   - Blue line: Clock noon position (on equatorial plane)
   - Orange arc: Angular mismatch between the two
   - The chart shows this mismatch in minutes across the full year

## Mathematical Background

This visualization is based on the MATLAB blog post "The Perils of Obliquity" which explains:

1. The ecliptic plane is where Earth orbits the Sun (defines the year)
2. The equatorial plane is Earth's rotation (defines the day)
3. These planes are tilted by the obliquity angle (~23.4°)
4. This tilt causes the projection of a point on the ecliptic to not align with the same point on the equatorial plane
5. The angular mismatch translates to time discrepancy (up to 10 minutes)

**Core Algorithm:**
```javascript
// For each day:
// 1. Get position on ecliptic (outer circle)
const p1 = [cos(t), sin(t), 0]

// 2. Rotate by obliquity angle
const p2 = rotateY(p1, obliquity)

// 3. Project back to x-y plane
p2.z = 0

// 4. Calculate angle between vectors
discrepancy = angle_between(p1, p2)
```

## Browser Compatibility

Tested and working on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

Requires:
- WebGL support for 3D visualization
- ES6 JavaScript support

## Credits

Based on the MATLAB blog post "The Perils of Obliquity" by Ned Gulley.

Original blog post: [The Perils of Obliquity » MATLAB Community](https://blogs.mathworks.com/community/2025/12/05/obliquity/)

## License

This project is open source and available for educational purposes.
