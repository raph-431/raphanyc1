import * as THREE from 'https://ordinals.com/content/0d013bb60fc5bf5a6c77da7371b07dc162ebc7d7f3af0ff3bd00ae5f0c546445i0';

const seedHex = new URLSearchParams(location.search).get('iid') ?? '0';
 let rand = createPRNG(seedHex);

export function xmur3(str) {
    let h = 1779033703 ^ str.length;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
    }
    return function () {
        h = Math.imul(h ^ (h >>> 16), 2246822507);
        h = Math.imul(h ^ (h >>> 13), 3266489909);
        return (h ^= (h >>> 16)) >>> 0;
    };
}

export function createPRNG(seed) {
    // turn number into a little hash:
    const seedHashFn = xmur3(seed.toString());
    const hashed = seedHashFn();
    // init PRNG with that hash:
    return simplePRNG(hashed);
}

export function simplePRNG(seed) {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return function () {
        s = s * 16807 % 2147483647;
        return (s - 1) / 2147483646;
    };
}

export function initCube() {
    let cubeVertices = [
        new THREE.Vector3(-1, -1, -1), // 0
        new THREE.Vector3(1, -1, -1), // 1
        new THREE.Vector3(1, 1, -1), // 2
        new THREE.Vector3(-1, 1, -1), // 3
        new THREE.Vector3(-1, -1, 1), // 4
        new THREE.Vector3(1, -1, 1), // 5
        new THREE.Vector3(1, 1, 1), // 6
        new THREE.Vector3(-1, 1, 1)  // 7
    ];
    let cubeFaces = [
        [0, 1, 2, 3],  // Back face (z = -1)
        [4, 5, 6, 7],  // Front face (z =  1)
        [0, 4, 7, 3],  // Left face (x = -1)
        [1, 5, 6, 2],  // Right face (x =  1)
        [3, 2, 6, 7],  // Top face (y =  1)
        [0, 1, 5, 4],   // Bottom face (y = -1)
    ];
    return { vertices: cubeVertices, faces: cubeFaces }
}

export function initTetrahedron() {
    // Vertices defined as THREE.Vector3 objects
    const vertices = [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(1, -1, -1),
        new THREE.Vector3(-1, 1, -1),
        new THREE.Vector3(-1, -1, 1)
    ];

    // Faces defined as arrays of vertex indices (each triangle is one face)
    const faces = [
        [0, 1, 2],
        [0, 3, 1],
        [0, 2, 3],
        [1, 3, 2]
    ];
    return { vertices: vertices, faces: faces }
}

export function initOctahedron() {
    // Triangular prism (D3 symmetry)
    const prismVerts = [
        new THREE.Vector3(1, 1, 1),
        new THREE.Vector3(-1, 1, 1),
        new THREE.Vector3(0, -1, 1),
        new THREE.Vector3(1, 1, -1),
        new THREE.Vector3(-1, 1, -1),
        new THREE.Vector3(0, -1, -1)
    ];
    const prismFaces = [
        [0, 1, 2], [3, 5, 4],              // two triangular ends
        [0, 2, 5, 3], [0, 3, 4, 1], [1, 4, 5, 2] // three rectangular sides
    ];
    return { vertices: prismVerts, faces: prismFaces }
}

export function initTorus() {
    // Parameters for the torus
    const radialSegments = 7;   // segments along the main ring
    const tubularSegments = 6;  // segments along the tube
    const R = 3;                // major radius (distance from center of tube to center of torus)
    const r = 2;              // minor radius (radius of the tube)

    // Arrays to hold vertices and faces
    const vertices = [];
    const faces = [];

    // Generate vertices using the torus parametric equations:
    //   x = (R + r*cos(v)) * cos(u)
    //   y = (R + r*cos(v)) * sin(u)
    //   z = r*sin(v)
    // where u is the angle along the main ring and v is the angle along the tube.
    for (let i = 0; i < radialSegments; i++) {
        const u = i / radialSegments * Math.PI * 2;
        for (let j = 0; j < tubularSegments; j++) {
            const v = j / tubularSegments * Math.PI * 2;
            const x = (R + r * Math.cos(v)) * Math.cos(u);
            const y = (R + r * Math.cos(v)) * Math.sin(u);
            const z = r * Math.sin(v);
            vertices.push(new THREE.Vector3(x, y, z));
        }
    }

    // Generate faces (triangles) for the torus surface.
    // We treat the vertices as forming a grid (with wrapping) and for each grid cell we form 2 triangles.
    for (let i = 0; i < radialSegments; i++) {
        for (let j = 0; j < tubularSegments; j++) {
            // Wrap-around indices using modulo arithmetic.
            const nextI = (i + 1) % radialSegments;
            const nextJ = (j + 1) % tubularSegments;

            // Calculate vertex indices for the current grid cell.
            const a = i * tubularSegments + j;
            const b = nextI * tubularSegments + j;
            const c = nextI * tubularSegments + nextJ;
            const d = i * tubularSegments + nextJ;

            // Create two faces (triangles) for the grid cell.
            faces.push([a, b, c]); // Triangle 1
            faces.push([a, c, d]); // Triangle 2
        }
    }
    return { vertices: vertices, faces: faces }
}

export function initSphere() {
    // Parameters for the sphere.
    const radius = 1;
    const latSegments = 5;  // number of segments from top to bottom (including poles)
    const lonSegments = 8;  // number of segments around the sphere

    // Arrays to hold vertices and faces.
    const vertices = [];
    const faces = [];

    // --- Vertex Generation ---

    // Add the top pole vertex.
    // vertices.push(new THREE.Vector3(0, radius, 0)); // index 0

    // Generate vertices for the intermediate latitude rings (excluding poles).
    // lat runs from 1 to latSegments - 1.
    for (let lat = 1; lat < latSegments; lat++) {
        const phi = Math.PI * lat / latSegments; // phi ranges from 0 (top) to PI (bottom)
        const sinPhi = Math.sin(phi);
        const cosPhi = Math.cos(phi);

        // For each latitude, generate vertices along the longitude.
        for (let lon = 0; lon < lonSegments; lon++) {
            const theta = 2 * Math.PI * lon / lonSegments; // theta ranges from 0 to 2PI
            const sinTheta = Math.sin(theta);
            const cosTheta = Math.cos(theta);

            const x = radius * sinPhi * cosTheta;
            const y = radius * cosPhi;
            const z = radius * sinPhi * sinTheta;

            vertices.push(new THREE.Vector3(x, y, z));
        }
    }

    // Add the bottom pole vertex.
    vertices.push(new THREE.Vector3(0, -radius, 0)); // last index

    // --- Face Generation ---

    // The vertex indices are organized as follows:
    // - Top pole is index 0.
    // - Next, the intermediate vertices form (latSegments-1) rings with lonSegments vertices each.
    // - Bottom pole is the last vertex (index: 1 + (latSegments - 1)*lonSegments).

    // Index of bottom pole vertex:
    const bottomIndex = vertices.length - 1;

    // Top cap: Connect the top pole to the first latitude ring.
    for (let lon = 0; lon < lonSegments; lon++) {
        // The first ring vertices start at index 1.
        // Wrap around using modulo arithmetic.
        const current = 1 + lon;
        const next = 1 + ((lon + 1) % lonSegments);
        // Create a triangle from the top pole to these two vertices.
        faces.push([0, next, current]);
    }

    // Middle area: Create quads between rings, split each quad into two triangles.
    for (let lat = 0; lat < latSegments - 2; lat++) {
        // Starting index for the current ring:
        const currentRingStart = 1 + lat * lonSegments;
        // Starting index for the next ring:
        const nextRingStart = 1 + (lat + 1) * lonSegments;

        for (let lon = 0; lon < lonSegments; lon++) {
            // Get indices for the quad.
            const current = currentRingStart + lon;
            const next = currentRingStart + ((lon + 1) % lonSegments);
            const currentNext = nextRingStart + lon;
            const nextNext = nextRingStart + ((lon + 1) % lonSegments);

            // Two triangles per quad.
            faces.push([current, next, nextNext]);
            faces.push([current, nextNext, currentNext]);
        }
    }

    // Bottom cap: Connect the bottom pole to the last latitude ring.
    const lastRingStart = 1 + (latSegments - 2) * lonSegments;
    for (let lon = 0; lon < lonSegments; lon++) {
        const current = lastRingStart + lon;
        const next = lastRingStart + ((lon + 1) % lonSegments);
        // Create a triangle connecting the last ring to the bottom pole.
        faces.push([bottomIndex, current, next]);
    }

    return { vertices: vertices, faces: faces }
}




// Export the expansion function as an ES module function.
export function expansion(originalVertices, originalFaces, offset) {
    const newVertices = [];
    const newFaces = [];
    // console.log(originalVertices.length, originalFaces.length)
    // For each original face, map each vertex index to the index of its expanded copy.
    const faceVertexMapping = {};

    // Compute overall centroid of the original polyhedron.
    const centroid = new THREE.Vector3(0, 0, 0);
    let polySize = 0;
    for (let i = 0; i < originalVertices.length; i++) {
        centroid.add(originalVertices[i]);
        if (originalVertices[i].length()>polySize) {
            polySize = originalVertices[i].length()
        }
    }
    centroid.divideScalar(originalVertices.length);

    // Step 1: For each face, compute its (corrected) normal and create an expanded copy for each vertex.
    const faceNormals = [];
    // vertexmap will store, for each original vertex, the list of indices (in newVertices)
    // corresponding to its copies on incident faces.
    const vertexmap = [];
    for (let i = 0; i < originalVertices.length; i++) {
        vertexmap[i] = [];
    }

    for (let fi = 0; fi < originalFaces.length; fi++) {
        const face = originalFaces[fi];
        // Compute the face normal using the first three vertices.
        if (face.length < 3) continue;
    
        const v0 = originalVertices[face[0]];
        const v1 = originalVertices[face[1]];
        const v2 = originalVertices[face[2]];
        const normal = v1.clone().sub(v0).cross(v2.clone().sub(v0)).normalize();

        // Compute the face center as the average of its vertices.
        const faceCenter = new THREE.Vector3(0, 0, 0);
        face.forEach(idx => faceCenter.add(originalVertices[idx]));
        faceCenter.divideScalar(face.length);

        // Ensure the normal points away from the overall centroid.
        if (faceCenter.clone().sub(centroid).dot(normal) < 0) {
            normal.multiplyScalar(-1);
        }
        faceNormals[fi] = normal;
        faceVertexMapping[fi] = {};

        // For each vertex in this face, create an expanded copy moved along the face normal.
        for (let j = 0; j < face.length; j++) {
            const vi = face[j];
            const origV = originalVertices[vi];
            const localOffset = offset// * (1+Math.pow(j, 0.5)) ; // You can modify this if needed.
            const newV = origV.clone().add(normal.clone().multiplyScalar(localOffset));
            newVertices.push(newV);
            const newIndex = newVertices.length - 1;
            faceVertexMapping[fi][vi] = newIndex;
            vertexmap[vi].push(newIndex);
        }
    }

    // Step 2: For each original face, build a new face by connecting the expanded copies.
    for (let fi = 0; fi < originalFaces.length; fi++) {
        const face = originalFaces[fi];
        if (face.length < 3) continue;
        const newFace = [];
        for (let j = 0; j < face.length; j++) {
            const vi = face[j];
            newFace.push(faceVertexMapping[fi][vi]);
        }
        newFaces.push(newFace);
    }

    // Step 3: For each original edge (shared by 2 faces), create a new quadrilateral face.
    const edgeMap = {};
    const edges = [] // edges array
    for (let fi = 0; fi < originalFaces.length; fi++) {
        const face = originalFaces[fi];
        if (face.length < 3) continue;
        const n = face.length;
        for (let j = 0; j < n; j++) {
            const v1 = face[j];
            const v2 = face[(j + 1) % n];
            const key = (v1 < v2) ? `${v1}_${v2}` : `${v2}_${v1}`;
            if (!edgeMap[key]) { // if doesn't exist, create it
                edgeMap[key] = [];
                edges.push([v1,v2]) // and add to edges array
            }
            // Record the face index that uses this edge.
            edgeMap[key].push(fi);
        }
    }
    // console.log(edges)
    for (const key in edgeMap) {
        if (edgeMap[key].length === 2) {
            const f1 = edgeMap[key][0];
            const f2 = edgeMap[key][1];
            // Parse the key to get the two original vertex indices.
            const parts = key.split("_");
            const vA = parseInt(parts[0]);
            const vB = parseInt(parts[1]);

            // For each vertex, get the two copies corresponding to faces f1 and f2.
            const vA_f1 = faceVertexMapping[f1][vA];
            const vA_f2 = faceVertexMapping[f2][vA];
            const vB_f1 = faceVertexMapping[f1][vB];
            const vB_f2 = faceVertexMapping[f2][vB];

            // check if the face is degenerate (vertices too close)
            const vA_f1_f2 = newVertices[vA_f1].distanceTo(newVertices[vA_f2])
            const vB_f1_f2 = newVertices[vA_f1].distanceTo(newVertices[vB_f1])
            const treshold = 0.01 * polySize
            if (vA_f1_f2 < treshold || vB_f1_f2 < treshold) {
                continue
            }

            // One common ordering is: [vA_f1, vB_f1, vB_f2, vA_f2]
            newFaces.push([vA_f1, vB_f1, vB_f2, vA_f2]);
        }
    }

    // Add a new face for each original vertex by sorting its expanded copies.
    for (let i = 0; i < originalVertices.length; i++) {
        const sortedVertices = sortExpandedVertices(
            originalVertices[i],
            vertexmap[i],
            newVertices
        );
        newFaces.push(sortedVertices);
    }

    // For each new face, compute its normal.
    const newFaceNormals = [];
    // for (let fi = 0; fi < newFaces.length; fi++) {
    //     const face = newFaces[fi];
    //     if (face.length < 3) continue;
    //     const v0 = newVertices[face[0]];
    //     const v1 = newVertices[face[1]];
    //     const v2 = newVertices[face[2]];
    //     const normal = v1.clone().sub(v0).cross(v2.clone().sub(v0)).normalize();
    //     const faceCenter = new THREE.Vector3(0, 0, 0);
    //     face.forEach(idx => faceCenter.add(newVertices[idx]));
    //     faceCenter.divideScalar(face.length);

    //     if (faceCenter.clone().sub(centroid).dot(normal) < 0) {
    //         normal.multiplyScalar(-1);
    //     }
    //     newFaceNormals[fi] = normal;
    // }

    return {
        vertices: newVertices, faces: newFaces, normals: newFaceNormals,
        edges: edges
     };
}

// -----------------------------------------------------------------
// The helper function that sorts expanded vertices around an original vertex.
export function sortExpandedVertices(original, expandedIndices, expandedVertices, incidentNormals) {
    // Compute the vertex normal as the average of incident face normals if provided.
    const vertexNormal = new THREE.Vector3(0, 0, 0);
    if (incidentNormals && incidentNormals.length > 0) {
        incidentNormals.forEach(n => vertexNormal.add(n));
    } else {
        // Fallback: average the directions from the original vertex to each expanded vertex.
        expandedIndices.forEach(i => {
            const d = expandedVertices[i].clone().sub(original);
            vertexNormal.add(d);
        });
    }
    vertexNormal.normalize();

    // Build a tangent basis on the plane orthogonal to vertexNormal.
    // Use the first expanded vertex to define the first tangent direction.
    const firstVec = expandedVertices[expandedIndices[0]].clone().sub(original);
    let T1 = firstVec.clone().sub(vertexNormal.clone().multiplyScalar(firstVec.dot(vertexNormal)));
    if (T1.length() < 1e-6) {
        T1 = new THREE.Vector3(1, 0, 0); // Fallback if degenerate.
    }
    T1.normalize();
    // The second tangent is orthogonal to both.
    const T2 = vertexNormal.clone().cross(T1).normalize();

    // Compute an angle for each expanded vertex (projected onto the tangent plane).
    const entries = expandedIndices.map(i => {
        const d = expandedVertices[i].clone().sub(original);
        const x = d.dot(T1);
        const y = d.dot(T2);
        const angle = Math.atan2(y, x);
        return { index: i, angle: angle };
    });

    // Sort the entries by angle.
    entries.sort((a, b) => a.angle - b.angle);
    return entries.map(entry => entry.index);
}



// create a geometry from arrays of vertices and faces

export function createGeometryFromFaces(vertices, faces) {
    // Create a new BufferGeometry.
    const treshold = rand() * 0.20;
    const geometry = new THREE.BufferGeometry();

    // Flatten the vertices into a Float32Array.
    const positions = new Float32Array(vertices.length * 3);
    for (let i = 0; i < vertices.length; i++) {
        positions[i * 3] = vertices[i].x;
        positions[i * 3 + 1] = vertices[i].y;
        positions[i * 3 + 2] = vertices[i].z;
    }
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Triangulate each face (assuming the face vertices are in order)
    const indices = [];
    let maxVperF = 0;
    faces.forEach(face => {
        if (face.length < 3) return; // Skip degenerate faces.
        // Triangle fan: (face[0], face[1], face[2]), (face[0], face[2], face[3]), etc.
        if (rand() < treshold) return; // skip 10% of the faces
        for (let i = 1; i < face.length - 1; i++) {
            indices.push(face[0], face[i], face[i + 1]);
        }
        if (face.length > maxVperF) maxVperF = face.length;
    });
    console.log("max vertices per face", maxVperF)
    geometry.setIndex(indices);

    // Optionally, compute normals for proper lighting.
    geometry.computeVertexNormals();
    // geometry.computeFaceNormals();
    // // Create a material (double sided so backfaces are visible)
    // const material = new THREE.MeshStandardMaterial({
    //     color: 0xffaa00,
    //     side: THREE.DoubleSide
    // });

    // // Create and return the mesh.
    // const mesh = new THREE.Mesh(geometry, material);
    return geometry;
}

// CLEAN UP THE FACES

export function filterNearFacesFast(vertices, faces,
    normalTol = 0.01,
    distTol = 2) {
    const seen = new Map();
    const kept = [];

    for (const face of faces) {
        if (face.length < 3) continue;

        // 1) Compute normal
        const v0 = vertices[face[0]],
            v1 = vertices[face[1]],
            v2 = vertices[face[2]];
        const normal = v1.clone().sub(v0)
            .cross(v2.clone().sub(v0))
            .normalize();

        // 2) Compute centroid
        const center = new THREE.Vector3();
        face.forEach(i => center.add(vertices[i]));
        center.divideScalar(face.length);

        // 3) Compute signed distance from origin along the normal:
        const d = normal.dot(center);

        // 4) Quantize
        const nx = Math.round(normal.x / normalTol);
        const ny = Math.round(normal.y / normalTol);
        const nz = Math.round(normal.z / normalTol);
        const dd = Math.round(d / distTol);

        const key = `${nx},${ny},${nz},${dd}`;

        // 5) Skip if we’ve already seen this bucket
        if (!seen.has(key)) {
            seen.set(key, true);
            kept.push(face);
        }
    }

    return kept;
}


/// MAKE EDGES

export function makeEdges(vertices, edges) {
    const positions = [];
    for (let i = 0; i < edges.length; i++) {
        const edge = edges[i];
        const v1 = vertices[edge[0]];
        const v2 = vertices[edge[1]];
        positions.push(v1);
        positions.push(v2);
    }
    return positions;
}

export function createGalaxyCubeMap(mytexture) {
    const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
    const canvases = faces.map(() => mytexture);
    const cubeMap = new THREE.CubeTexture();

    cubeMap.images = canvases;
    cubeMap.needsUpdate = true;
    return cubeMap;
}

export function createStarCubeMap(size = 1024, starSize = 3, band = 0.15) {
    const faces = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
    const canvases = faces.map(() => createStarField(size, size, starSize, band));
    const cubeMap = new THREE.CubeTexture();

    cubeMap.images = canvases;
    cubeMap.needsUpdate = true;
    return cubeMap;
}

export function createStarField(envWidth, envHeight, starSize = 1.5, band = 0.15) {
    const starCanvas = document.createElement('canvas');
    starCanvas.width = envWidth;
    starCanvas.height = envHeight;
    const ctx = starCanvas.getContext('2d');
    
    // Fill the canvases with black (space)
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, envWidth, envHeight);

    //  Parameters for star generation
    const numStars = 3000;
    const L_min = 0.4;  // minimum brightness
    const L_max = 1;  // maximum brightness
    const alpha = 5 //7;    // power-law exponent ; somewhere between 5 and 7

    // Gaussian random number generator using the Box-Muller transform.
    function gaussianRandom(mean, stdev) {
        const u = rand();
        const v = rand();
        return mean + stdev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // Sample theta from a Gaussian distribution centered at π/2 (Milky Way plane)
    function sampleThetaGaussian() {
        const sigma = Math.PI * band; // adjust sigma to control band thickness
        let theta;
        // Ensure theta stays in the valid range [0, π]
        do {
            theta = gaussianRandom(Math.PI/2, sigma);
        } while (theta < 0 || theta > 2*Math.PI);
        return theta;
    }


    // Sample brightness from a power-law distribution using inverse transform sampling
    function sampleBrightness() {
        const u = rand();
        const brightness = Math.pow(
            u * (Math.pow(L_max, 1 - alpha) - Math.pow(L_min, 1 - alpha)) + Math.pow(L_min, 1 - alpha),
            1 / (1 - alpha)
        );
        return brightness;
    }

    // Define a density modulation function along φ.
    // A fixed offset ensures the pattern remains consistent each run.
    const phiModOffset = rand() * 2 * Math.PI;
    function densityModulation(phi) {
        // Compute a modulation value between 0.5 and 1 using a sine function.
        // Adjust the multiplier (here 4) to control the modulation frequency.
        return 0.75 + 0.25 * Math.sin(4 * (phi + phiModOffset));
    }

    // Draw each star on the canvas
    for (let i = 0; i < numStars; i++) {
        // Uniformly sample spherical coordinates:
        const u = rand();
        const v = rand();
        const phi = 2 * Math.PI * u;           // azimuth angle in [0, 2π)
        // const theta = Math.acos(2 * v - 1);      // polar angle
        const theta = sampleThetaGaussian();
        
        // Use modulation along φ to vary the star density.
        // For a given φ, a lower modulation value means fewer stars.
        const modulator = densityModulation(phi); // value between ~0.5 and 1
        // if (rand() > modulator) continue; // Skip star for low-density regions

        // Map spherical (θ, φ) to equirectangular UV coordinates:
        const U = phi / (2 * Math.PI);  // horizontal coordinate [0,1]
        const V = theta / Math.PI;      // vertical coordinate [0,1]
        

        // Convert UV to pixel coordinates
        const x = U * envWidth;
        const y = V * envHeight;

        // Sample star brightness
        const brightness = sampleBrightness(); // Value between L_min and L_max

        let starType = rand();
        let hue, sat, light;
        if (starType < 0.33) {
            // Bluish tint: base hue around 210° ±10°
            hue = 210 + (rand() * 20 - 10);
            sat = 80 + (rand() * 20);
        } else if (starType < 0.66) {
            // Reddish tint: base hue around 0° ±10°
            hue = 0 + (rand() * 20 - 10);
            sat = 80 + (rand() * 20);
        } else {
            // Yellowish tint: base hue around 60° ±10°
            hue = 60 + (rand() * 20 - 10);
            sat = 60 + (rand() * 20);
        }
        // sat = 85;   // very low saturation for subtle color
        light = 93; // high lightness keeps the color near white

        // Draw the star as a small circle
        // const starSize = 1.5;
        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${brightness})`;
        ctx.beginPath();
        ctx.arc(x, y, starSize * brightness, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        // const haloBrightness = 0.5 * brightness;
        // ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${haloBrightness})`;
        // ctx.beginPath();
        // ctx.arc(x, y, starSize * brightness * 2, 0, Math.PI * 2);
        // ctx.fill();
    }
   
    return starCanvas;
}

export function makeGalaxy(w, h, seed) {

    const starCanvas = document.createElement('canvas');
    starCanvas.width = w;
    starCanvas.height = h;
    if (seed) {
        rand = createPRNG(seed);
        console.log("seed inside makeGalaxy", seed)
    }
    let rotation = (rand() - 0.5) * 3.14 * 1; // -PI/4 to PI/4
    let rotationCenterX = gaussianRandom(w / 2, w / 6);
    let rotationCenterY = gaussianRandom(h / 2, h / 6);
    const ctx = starCanvas.getContext('2d');
    const permutation = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [permutation[i], permutation[j]] = [permutation[j], permutation[i]];
    }
    const p = [...permutation, ...permutation]; // Repeat the array

    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    function lerp(a, b, t) {
        return a + t * (b - a);
    }

    function grad(hash, x, y) {
        const h = hash & 3;
        const u = h < 2 ? x : y;
        const v = h < 2 ? y : x;
        return ((h & 1) ? -u : u) + ((h & 2) ? -2.0 * v : 2.0 * v);
    }

    function perlin(x, y) {
        const xi = Math.floor(x) & 255;
        const yi = Math.floor(y) & 255;
        const xf = x - Math.floor(x);
        const yf = y - Math.floor(y);

        const u = fade(xf);
        const v = fade(yf);

        const aa = p[p[xi] + yi];
        const ab = p[p[xi] + yi + 1];
        const ba = p[p[xi + 1] + yi];
        const bb = p[p[xi + 1] + yi + 1];

        const x1 = lerp(grad(aa, xf, yf), grad(ba, xf - 1, yf), u);
        const x2 = lerp(grad(ab, xf, yf - 1), grad(bb, xf - 1, yf - 1), u);
        return (lerp(x1, x2, v) + 1) / 2; // Normalize to [0, 1]
    }

    // Gaussian random number generator using the Box-Muller transform.
    function gaussianRandom(mean, stdev) {
        const u = rand();
        const v = rand();
        return mean + stdev * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
    }

    // Star color based on temperature
    function starColor(temp, brightness) {
        temp = Math.max(0, Math.min(1, temp));
        let r, g, b;

        if (temp < 0.3) {
            // Warm stars: orange to white
            const t = temp / 0.3;
            r = lerp(255, 255, t);   // stays high
            g = lerp(170, 255, t);   // warm to neutral
            b = lerp(110, 255, t);    // low to neutral
        } else if (temp < 0.4) {
            r = 255;
            g = 255;
            b = 255;
        } else {
            // Hot stars: white to bluish
            const t = (temp - 0.4) / 0.6;
            r = lerp(255, 160, t);   // slight drop
            g = lerp(255, 180, t);   // slight drop
            b = lerp(255, 255, t);   // stays high
        }

        // Optional: brightness variation (subtle)
        // const brightness = lerp(0.8, 1.0, Math.random());
        return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
    }
    //    function starColor(temp) {
    //         // Clamp temp between 0 and 1
    //         temp = Math.max(0, Math.min(1, temp));

    //         // Gentle, desaturated gradient from warm to cool
    //         const r = lerp(255, 200, temp);    // red to bluish
    //         const g = lerp(180, 220, temp);    // creamy to pale blue
    //         const b = lerp(120, 255, temp);    // muted to soft white-blue

    //         // Optional: apply slight dimming for more realism
    //         const brightness = lerp(0.6, 1.0, Math.random() * 0.7); // subtle flicker or luminosity range

    //         return `rgb(${Math.floor(r * brightness)}, ${Math.floor(g * brightness)}, ${Math.floor(b * brightness)})`;
    //     }

    // Helper: draw stars

    function rotate(cx, cy, x, y, radians) {
        const cos = Math.cos(radians);
        const sin = Math.sin(radians);
        const nx = (cos * scale*(x - cx)) + (sin * scale*(y - cy)) + cx;
        const ny = (cos * scale*(y - cy)) - (sin * scale*(x - cx)) + cy;
        return [nx, ny];
    }

    function drawStars(count, band = null) {
        // 
        // const iceblue = `rgb(100,190,255,.01)`
       

        

        for (let i = 0; i < count; i++) {
            let x, y, brightness;

            if (band == null) {
                x = rand() * w;
                y = gaussianRandom(h / 2, h / 2);
                brightness = 3. * Math.pow(rand(), 5); //3
            } else {
                y = gaussianRandom(h / 2, h / 4);
                x = gaussianRandom(w / 2, w / 6);
                brightness = 1.5 * Math.pow(rand(), 5); //3
            }

            let [rotatedX, rotatedY] = rotate(rotationCenterX, rotationCenterY, x, y, rotation);

            let size = 1 * brightness;
            let temp = gaussianRandom(0.8, 0.4);
            // Increase density along the band
            if (band) {
                // let dx = x - width / 2;
                let dy = y - h / 2;
                let angle = (dy - 0.2 * h * (perlin(0.0015 * x, 0.002 * y) - 0.5)) / h * 2;
                let bandAngle = band.angle;
                let angleDiff = perlin(0.001 * x, 0.005 * y) * Math.abs(angle - bandAngle);
                if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
                size *= 0.8 * Math.pow(0.80, 35 * Math.abs(angle));
                // if (angleDiff > band.width) size = size *0.28/ angleDiff; // skip if not in band
                temp = 2.5 * Math.abs((angle));
            }


            ctx.beginPath();
            ctx.fillStyle = starColor(temp, brightness);
            // ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fillRect(rotatedX - 0.5 * size, rotatedY, 1.5 * size, size * 0.5);
            ctx.fillRect(rotatedX, rotatedY - 0.5 * size, size * 0.5, 1.5 * size);
            // ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;

            ctx.fill();
            // if (band && temp > .0 && Math.random() < 0.95) {
            //     ctx.beginPath();
            //     ctx.fillStyle = iceblue;
            //     ctx.arc(x, y, 1.3*brightness, 0, Math.PI * 2);
            //     ctx.fill();
            // }
        }
        // ctx.shadowBlur = 0;
    }

    // Helper: draw dusty bands using noise
    function drawDust() {
        for (let i = 0; i < 100000; i++) {
            let x = rand() * w;
            // let y = Math.random() * height;
            let y = gaussianRandom(h / 2, h / 3);
            let r = rand() * 25;
            let newy = Math.abs(y - h / 2 - 0.2 * h * (perlin(0.0015 * (x + 40), 0.002 * (y - 40)) - 0.5))
                * (0.2 + perlin(0.01 * (1000 + x), 0.005 * (2000 + y)));
            if (Math.abs(newy) < 20) {
                let [rotatedX, rotatedY] = rotate(rotationCenterX, rotationCenterY, x, y, rotation);

                ctx.beginPath();
                ctx.arc(rotatedX, rotatedY, scale*r, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0,0,1,0.2)';
                // ctx.fillRect(x, y, r, r);

                ctx.fill();
            }
        }
    }

    // Clear black background
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, w, h);

   const scale = rand() + 0.5; // 0.5 to 1.5

    // Step 2: Milky Way band
    let nbstars = 500000 //+rand()*1000000;
    drawStars(nbstars, { angle: 0, width: 0.05 });

    // Step 3: Dust overlay
    drawDust();

    // Step 1: Stars
    drawStars(2000);

    return starCanvas;
}

export function exportToOBJ(vertices, faces, filename = 'model.obj') {
    let obj = '';

    // Write vertices
    for (const v of vertices) {
        obj += `v ${v.x} ${v.y} ${v.z}\n`;
    }

    // Write faces (OBJ is 1-based, so add 1 to each index)
    for (const f of faces) {
        const i1 = f[0] + 1;
        const i2 = f[1] + 1;
        const i3 = f[2] + 1;
        obj += `f ${i1} ${i2} ${i3}\n`;
    }

    // Trigger download in browser
    const blob = new Blob([obj], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
