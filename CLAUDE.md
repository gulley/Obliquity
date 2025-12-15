# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an educational web application visualizing Earth's obliquity (axial tilt) and its effect on the Equation of Time. It demonstrates the angular mismatch between solar noon (sun-defined) and clock noon (24-hour standard time), ported from a MATLAB blog post.

## Running the Application

Start a local HTTP server (required for loading JavaScript):

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Architecture

### Coordinate System and Geometry

**Critical:** The application uses a specific 3D coordinate system:
- **x-z plane** is the horizontal viewing plane (not x-y)
- All circles and noon lines are created in the x-z plane
- Camera looks down from (0, 5, 0) using **OrthographicCamera** (no perspective distortion)
- Rotation around **Z-axis** creates the visible obliquity tilt

### Key Geometric Elements

1. **Outer black circle** (radius 2): Ecliptic plane - Earth's orbital path
2. **Inner gray circle** (radius 1): Equatorial plane - rotates by obliquity angle around Z-axis, has white opaque fill
3. **Gray noon lines**: Two sets of spokes
   - Outer spokes: Solar noon positions (to ecliptic, static)
   - Inner spokes: Clock noon positions (to equatorial circle, rotates with obliquity)
4. **Orange line**: Current day's solar noon (to outer circle)
5. **Blue line**: Current day's clock noon (to inner circle at same angle, rotated by obliquity)
6. **Thick red arc**: Visual representation of angular mismatch (TubeGeometry at radius 1.0, coincident with inner circle)
7. **Blue north pole arrow**: Earth's rotational axis - tilts with obliquity, perpendicular to equatorial plane

### Mathematical Core (math.js)

The discrepancy calculation is a direct port from MATLAB (blog.m lines 105-117):

1. For each day, calculate angle: `t = (day / numDays) * 2π`
2. Get ecliptic position: `p1 = [cos(t), sin(t), 0]`
3. Apply Y-axis rotation by obliquity: `p2 = rotationMatrix * p1`
4. Project to x-y plane: `p2.z = 0`
5. Calculate angle between vectors: `atan2(||cross(p1,p2)||, dot(p1,p2))`
6. Convert to minutes: `(angle / 2π) * 24 * 60`

**Important:** The MATLAB code uses Y-rotation for the math, but the 3D visualization uses Z-rotation to create the visible tilt in the x-z plane.

### Component Responsibilities

- **scene3d.js**: Three.js scene management
  - Creates geometry in x-z plane (critical for alignment)
  - Uses custom shader for Earth's day/night terminator
  - `equatorialGroup` contains inner circle + inner spokes (rotates as unit)
  - `updateObliquity()`: Rotates equatorialGroup around Z-axis
  - `drawMismatchArc()`: Creates red/blue highlight lines for current day

- **controls.js**: UI state and updates
  - `update()`: Full recalculation (obliquity or numDays changed)
  - `updateDayOnly()`: Quick update (only current day changed)
  - `updateDiscrepancyDisplay()`: Calculates angle/time for current day

- **math.js**: Pure mathematical functions (MATLAB ports)
  - No DOM manipulation, only calculations
  - Returns positions in standard 3D space (y-up for math)

- **main.js**: Application initialization only

### Default Values

- Obliquity: 23.4° (Earth's actual value, range: 0-90°)
- Number of days: 16 (simplified year for clearer visualization, range: 8-80)
- Current day: 0
- Animation: 4 seconds per complete orbit (time-based, independent of numDays)

### Earth Day/Night Shader

The Earth uses a custom GLSL shader that:
- **Critical:** Transforms normals to world space using `modelMatrix` (NOT `normalMatrix` which gives view space)
- Calculates sun direction from Earth center: `normalize(sunPosition)`
- Compares surface normal with sun direction: `dot(vNormal, sunDir)`
- Day side (blue) when normal faces sun, night side (black) when facing away
- Updates shader uniform with sun position on every day change
- Works correctly from any viewing angle because normals and sun position are in same coordinate system

## GitHub Pages Deployment

This is a static site ready for GitHub Pages:
- All dependencies via CDN (Three.js r128 only)
- No build process required
- Uses relative paths (`./js/`, `./css/`)
- Deploy from repository root

**Note:** Chart.js was removed from the project - discrepancy values are shown in a text display instead.

## Common Issues

**Circles/lines not aligning**: Ensure all geometry is created in x-z plane with y=0, not x-y plane. Lines and circles must use same coordinate system.

**Blue line wrong position**: Must apply same Z-rotation as equatorialGroup to get the rotated inner spoke position.

**Earth shading inverted or not working**:
- Normals must be in world space (use `modelMatrix`), not view space (`normalMatrix`)
- Sun direction should be from Earth center (origin), not from each surface point

**Arc not visible/thick enough**: WebGL ignores `linewidth` parameter. Use `TubeGeometry` instead of `LineBasicMaterial` for thick, visible arcs.

## Source Material

Ported from MATLAB blog post "The Perils of Obliquity" (blog.m in repository). The blog demonstrates how obliquity causes solar days to vary in length, creating the Equation of Time effect.
