

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect.js';
import * as soundtrack from './soundtrack.js'
import {
    initCube, initTetrahedron, initTorus, initSphere, expansion, createGeometryFromFaces,
    makeEdges, createStarField } from './expansionUtils.js'
import vertexShader from './vertex.glsl?raw'
import fragmentShader from './fragment.glsl?raw'

// shortcuts
let rand = Math.random

// global audio
let playingaudio = false

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')



// @cursor-bookmark Scene Setup
// Scene
const scene = new THREE.Scene()
// Initialize cube

let starField = createStarField(4096, 2048, 1.5);
let reflectionField = createStarField(2048, 1024, 1);
// texture for background plane
const bgTexture = new THREE.CanvasTexture(starField);
bgTexture.wrapS = THREE.RepeatWrapping;
bgTexture.wrapT = THREE.RepeatWrapping;
// texture for reflection
const reflectionTexture = new THREE.CanvasTexture(reflectionField);

reflectionTexture.mapping = THREE.EquirectangularReflectionMapping;

// Cube definition (centered at origin, side length 2)
let expandedGeometry = {}

let seed = 0;
let darkmode = false;
let anaglyph = false;
let barrelling = false;
let barrellingYgoal = 0;
seed = Math.floor(rand() * 1000000)
console.log(seed)
let bestcombos = []
let bestcombostext = '['
let combinations = []
let polyname;
let combos = []

combinations = [[-162, 186, 19, 159, 290, 193,], [278, 447, -28, -26, 37, 10, 495,], [-346, 153, 301, -442, 61, -214, 20,], [337, -382, -169, 355, -39, 120, 462,], [229, 200, 16, 393, 21,], [-387, -125, 20, -473, 20, 44, -11,], [14, -55, 338, -96, 183, 186, -51,], [-424, -247, -224, -23, 346, 168, 412,], [-477, -424, 40, -186, 23, 119, 24,], [-453, -26, 285, -334, 147, 200,], [-145, -83, 92, -21, 281, -82, 375,], [-414, -151, -133, -44, 64, 206, 15,], [-141, -33, 35, -92, -34, -191, -12,], [361, -251, 46, -52, 20, 249,], [-380, 114, 294, 392, -49, 20, -410,], [-85, 47, -50, 182, 387, 222, -265,], [208, 374, 157, 132, 22, -30, -402,], [-496, 22, -39, 28, -22, -16, -190,], [-16, -270, -32, -267, 111, 304,], [154, 217, -454, 154, -309, 171, 45,], [213, -142, 20, -330, 471,], [98, 35, 496, -225, -35, 21, -345,], [240, 36, -245, -260, -27, -50, -275,], [112, -71, -117, -97, -396, 43, -141,], [-451, -436, -11, 26, 193, 186, -485,], [-120, -446, 111, -28, -325, 21, -460,], [305, -39, 377, 388, 132, -43,], [31, -103, 57, -118, -319, 410, 291,], [363, 160, -519, -63, 214, 152, -56,], [76, 281, -109, 503, 424, 253,], [-487, -487, -240, 78, 12, -29, -211,], [23, -21, 240, -213, 20, 417, -268,], [-437, 169, -293, 320, -116, 10, -36,], [275, -47, 27, -377, 479, -43, -200,], [-315, 33, -392, -128, -214, 37,], [-126, 20, 30, -24, 176,], [-483, 487, -450, 120, -21, -498,], [-457, 55, 169, 163, -21, -432, 55,], [376, -213, 434, 152, 90, 360, -395,], [-397, -213, -11, -11, 34, -21,], [-391, -49, 393, 132, -49, 421, 357,], [-316, -371, -456, -160, -401, -37, 328,], [121, 46, -354, 202, -21, -141, 21,], [321, -322, 59, 88, 48, 21, -21,], [-390, -258, -442, 440, -21, -24, 85,], [-309, -139, -21, 21, -21, -198, -482,], [-179, 332, -254, 92, -71, -102, -30,], [-445, -121, -34, -158, 23, 361, 23,], [-458, 25, 118, -14, -50, 29, -450,], [22, 391, -21, 29, -61, -365, -18,], [-42, -36, -36, -258, 150, -23, 160,], [-261, 217, 157, 84, -42, 25, -249,], [-90, 22, -22, 131, -47, -491, -365,], [-334, 280, 79, -308, -59, 28, -81,], [200, -188, 26, -118, -86, 500,], [234, -112, -124, 90, -169, -14,], [-69, 270, -189, 41, -317, 237, -47,], [346, -21, -25, -26, -108, 117, -323,], [58, 225, -11, -13, 58, -21, -435,], [459, 87, -21, -186, 58, -342, 102,], [172, 64, 152, -120, 483, 18, 309,], [-354, -338, 32, 16, 119, -197, 306,], [439, 148, -21, -444, -73, -307,], [-497, -25, 51, -75, 25, 476, -40,], [-282, -50, -230, 63, -253, 20, 20,], [429, -42, 20, -45, 51, 92, -397,], [-263, -81, -66, -15, -64, 10, 430,], [-124, 465, -301, -456, 474, 39,], [445, -392, -12, 42, -36, 300, 458,], [115, -363, -51, 20, -320, 200,], [-353, 307, -430, 20, 18, -167,], [-294, 307, -59, 46, -31, 408, 333,], [55, -274, -218, -106, 25, 25, 28,], [-27, -195, 20, -515, -27, -285, -11,], [64, -483, 22, -92, -85, 33, -18,], [405, -60, -51, -143, -425, 25, -176,], [-42, -97, 206, -229, -278, 55, -306,], [445, -337, -64, -45, -104, 323, -21,], [-327, -410, 59, 14, 28, 482, -32,], [174, -170, 451, -27, 211, -459, -51,], [-282, 193, -21, -53, -14, -48, 70,], [-230, 48, -191, 338, -130, 55, -135,], [-364, -201, -73, -483, 23, 78, 73,], [-495, -149, -159, 368, 272, 36, 233,], [454, -33, -74, 78, -22, -439,], [49, 45, 486, 105, -21, -471, 20,], [450, -23, -427, -204, 25, 300, 261,], [-212, 328, -15, 35, 40, 90, -167,], [218, 21, -64, 39, -121, -72, -47,], [231, -118, -26, 20, -110, -120, 20,], [-33, -152, -434, 186, 276, 298, -66,], [-424, -30, 98, -408, -75, 130,], [-126, 106, -31, -12, 28, 24,], [409, -40, -19, -93, -125, 22, 372,], [-282, -446, -398, -90, -27, 78, 11,], [-445, 196, -101, -90, -280, 464, -423,], [-466, -33, 32, -110, 75, -466, 367,], [111, 342, -180, 125, -21, 20, -480,], [423, -21, -207, -39, -232, -361, 20,], [95, 443, 323, 256, 443, 10,], [-26, 431, -370, 80, 178, -380, -169,], [-26, 429, 67, -15, 32, 11, -353,], [444, 313, 31, -481, -20, -238,], [-491, -37, -160, 200, -47, -225, 20,], [296, 371, -477, -42, -113, -36, 40,], [-460, 21, 14, -21, -129, 199, 139,], [-121, -410, 43, 153, 171, -11, 348,], [-296, -339, 84, 423, 220, -143, 123,], [78, 224, -25, 130, -191, 20, -21,], [-28, -247, 458, -378, 51, -101, -66,], [145, -90, 193, -21, -281, -22, -24,], [231, 51, -341, -13, 22, 160, 17,], [392, 48, 129, 231, -48, -84, -260,], [185, -70, 394, 41, 72, -472, -40,], [-236, 84, -350, 21, -148, 56, -29,], [-154, 206, 58, 35, -49, 10, -21,], [-194, 24, 20, -21, 488, -59, 502,], [121, 305, -468, 37, 90, 420, 362,], [-455, 44, 34, -21, -67, -44, -478,], [214, 213, 49, -420, 183, 10, -39,], [-155, -18, 280, -35, 37, 86, 255,], [460, -76, -399, 58, -32, -51, -23,], [-96, 436, -132, -104, 129, -185, 20,], [353, -145, -214, 40, 99, -53, 24,], [-296, -76, -217, -53, -116, -230, -344,], [280, -116, 316, 318, -242, -196, -194,], [-399, -317, -395, 371, 438, 35, -188,], [-81, 186, 22, 157, 90, -21, 235,], [41, 14, 95, -11, 273, 477, 71,], [273, -25, 20, 303, -359, -88,], [10, -55, -63, -57, 22, -173, 151,], [-196, 25, -275, 20, -21, 398, -392,], [168, -315, 347, -26, -20, 402, -48,]]
combos = ['dDADFD', 'FIaaAAJ', 'gDGiBeA', 'GhdHaCJ', 'EEAHA', 'hcAjAAa', 'AbGbDDb', 'ieeaGDI', 'jiAdACA', 'jaFgCE', 'cbBaFbH', 'idcaBEA', 'caAbada', 'HfAbAE', 'hCFHaAi', 'bAbDHEf', 'EHDCAai', 'jAaAaad', 'afafCG', 'DEjDgDA', 'EcAgJ', 'BAJeaAg', 'EAefabf', 'CbcbhAc', 'jiaADDj', 'ciCagAj', 'GaHHCa', 'AcBcgIF', 'HDkbEDb', 'BFcKIF', 'jjeBAae', 'AaEeAIf', 'iDfGcAa', 'FaAhJae', 'gAhceA', 'cAAaD', 'jJjCaj', 'jBDDaiB', 'HeIDBHh', 'heaaAa', 'haHCaIH', 'ghjdiaG', 'CAhEacA', 'GgBBAAa', 'hfiIaaB', 'gcaAadj', 'dGfBbca', 'icadAHA', 'jACabAj', 'AHaAbha', 'aaafDaD', 'fEDBaAe', 'bAaCajh', 'gFBgbAb', 'EdAcbK', 'EccBda', 'bFdAgEa', 'GaaacCg', 'BEaaBai', 'JBadBgC', 'DBDcJAG', 'hgAACdG', 'ICaibg', 'jaBbAJa', 'fbeBfAA', 'IaAaBBh', 'fbbabAI', 'cJgjJA', 'IhaAaGJ', 'ChbAgE', 'hGiAAd', 'fGbAaIG', 'BfecAAA', 'adAkafa', 'BjAbbAa', 'IbbciAd', 'abEefBg', 'IgbacGa', 'giBAAJa', 'DdJaEjb', 'fDabaaB', 'eAdGcBc', 'hebjABB', 'jcdHFAE', 'JabBai', 'AAJCajA', 'JaieAGF', 'eGaAABd', 'EAbAcba', 'EcaAccA', 'adiDFFb', 'iaBibC', 'cCaaAA', 'IaabcAH', 'fihbaBA', 'iDcbfJi', 'jaAcBjH', 'CGdCaAj', 'IaeaehA', 'BIGFIA', 'aIhBDhd', 'aIBaAAh', 'IGAjae', 'jadEaeA', 'FHjacaA', 'jAAacDC', 'ciADDaG', 'fgBIEcC', 'BEaCdAa', 'aeJhBcb', 'CbDafaa', 'EBgaADA', 'HACEabf', 'DbHABja', 'eBhAcBa', 'dEBAaAa', 'dAAaJbK', 'CGjABIH', 'jAAabaj', 'EEAiDAa', 'daFaABF', 'JbhBaba', 'bIccCdA', 'HceABbA', 'fbebceg', 'FcGGedd', 'hghHIAd', 'bDADBaE', 'AABaFJB', 'FaAGhb', 'AbbbAdD', 'dAfAaHh', 'DgGaaIa']

console.log(combinations.length)
// let initialGeometry = initTetrahedron()
// let initialGeometry = initSphere()
function stringToType(code) {
    let expansionType = []
    for (let i = 0; i < code.length; i++) {
        let sign = -1
        let x = code[i].charCodeAt() - 64
        if (x < 32) { sign = 1; }
        else { x -= 32 }

        expansionType.push(sign * (x - 0.5) * 50)
    }
    return expansionType
}
// @cursor-bookmark Expansion
function generateExpansion(initialVertices, initialFaces, sequence = []) {
    let offsetAmount = 0.5;
    let offsets = [-0.912, -0.49, 0.249, .503] // ,1,1.5,2] // add -2 ??
    let labels = ["X", "C", "E", "L"]
    if (rand() < 0.20) {
        offsets = [-0.912, -0.48,-0.2, 0.249, .503, 1]
        labels = ["X", "C", "E","S", "L", "G"]
    }
   
    polyname = ""
    // sequence = [0,3,0,3,0,0,0] 
    let iterations = 7 // MAXIMUM 9 => 1.2 million faces
    let rr = rand()
    if (rr < 0.05) {
        iterations = 5
    } else if (rr < 0.20) {
        iterations = 6
    }
    // pure random
    offsets = [];
    labels = [];
    let combochoice = Math.floor(rand() * combos.length)
    let combo = stringToType(combos[combochoice])
    iterations = combo.length
    console.log(combos[combochoice])
    let lastoffset = 0;
    // iterations = 7
    // for (let i = 0; i < 10; i++) {
    //     rr = (rand()*0.9+0.1)*(Math.floor(rand()*2)*2-1)
    //     offsets.push(rr)
    //     labels.push(String(Math.floor(rr*100))+'_')
    // }

    for (let k = 0; k < iterations; k++) {
        // offsetAmount = rand() * 2 - 1
        // offsetAmount *= 1.5
        let index = Math.floor(rand() * offsets.length)
        // offsetAmount = offsets[index] // /(1+Math.pow(k, 0.5))
        offsetAmount = (Math.pow(rand(), Math.pow(k, 0.5)+1) * 5 + 0.1) * (Math.floor(rand() * 2) * 2 - 1);
        if (lastoffset > 0) offsetAmount -= 0.1
        if (lastoffset < 0) offsetAmount += 0.1
        if (Math.abs(offsetAmount) < 0.1) offsetAmount = (Math.pow(rand(), Math.pow(k, 0.5) + 1) * 5 + 0.1) * (Math.floor(rand() * 2) * 2 - 1);
        lastoffset = offsetAmount
        // labels.push(String(Math.floor(offsetAmount*100))+'_')
        if (sequence.length > 0) {
            index = sequence[k]
            offsetAmount = offsets[index]
        }
        offsetAmount = (combo[k]+rand()*30 - 15)/100 //* (.9 + 0.2 * rand())/100
        
        // console.log(offsetAmount)
        polyname += String(Math.floor(offsetAmount * 100)) + ',' //labels[index]
        expandedGeometry = expansion(initialVertices, initialFaces, offsetAmount);
        initialVertices = expandedGeometry.vertices;
        initialFaces = expandedGeometry.faces;
    }
    // expandedGeometry = expansion(cubeVertices, cubeFaces, offsetAmount);
    // console.log(expandedGeometry);
    polyname = combos[combochoice]
    console.log(polyname)
    console.log(expandedGeometry.faces.length, 'faces')
    console.log(expandedGeometry.vertices.length, 'vertices')
    return expandedGeometry
}



// @cursor-bookmark Material

const polyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
    metalness:  0.6, //0.8,
    roughness: 0.5, //0.1,
    side: THREE.DoubleSide,
    polygonOffset: true,
    // // Factor and units control the depth offset.
    // // Experiment with these values to see what works best for your scene.
    polygonOffsetFactor: 1,  // How much to offset based on the slope of the polygon.
    polygonOffsetUnits: 1,    // Constant offset added to the depth.
    // wireframe: true,
})
function setPolyMaterial() {
    polyMaterial.metalness = 0.6 + rand() * 0.4;
    polyMaterial.roughness = 0.1 + rand() * 0.4;
}

setPolyMaterial()

const pointsShaderMaterial = new THREE.ShaderMaterial({
    depthWrite: true,
    // blending: THREE.AdditiveBlending,
    vertexColors: true,
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        uSize: { value: 20 },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(1, 1, 1) }
    }
})
function setPointsColor() {
    let rr = rand()
    if (rr < 0.1) {
        pointsShaderMaterial.uniforms.uColor.value.set(1, 0.5, 0.5)
    } else if (rr < 0.2) {
        pointsShaderMaterial.uniforms.uColor.value.set(0.5, 1, 0.5)
    } else if (rr < 0.3) {
        pointsShaderMaterial.uniforms.uColor.value.set(0.5, 0.5, 1)
    }
}

setPointsColor()



// Objects
// const geometry = new THREE.BoxGeometry(1, 1, 1, 2, 2, 2) // the 2s are for the subdivision of the faces
let geometries = []
let meshes = []
let radii = []
let rowcol = 16
let x0 = 6
let y0 = x0
let spacing = 6 * x0 / (rowcol + 1)
let mesh = {}
let pointsMesh = {}
let pointsGeometry = {}
let indices = []


function createPolyhedronAndPoints() {
    // @cursor-bookmark Single object
    scene.clear()
    meshes = []
    let rr = rand()
    let initialGeometry = {}
    if (rr < 0.25) {
        initialGeometry = initTetrahedron() 
    } else  {
        initialGeometry = initCube()
    }
    expandedGeometry = generateExpansion(initialGeometry.vertices, initialGeometry.faces)
    let geometry = createGeometryFromFaces(expandedGeometry.vertices, expandedGeometry.faces)
    let polyMesh = new THREE.Mesh(geometry, polyMaterial)
    // console.log(material)
    polyMesh.geometry.computeBoundingSphere()
    
    let radius = polyMesh.geometry.boundingSphere.radius
    polyMesh.scale.set(3 / radius, 3 / radius, 3 / radius)
    meshes.push(polyMesh)
    scene.add(polyMesh)
    // @cursor-bookmark Points
    let numPoints = expandedGeometry.vertices.length

    let indices = new Float32Array(numPoints)
    for (let i = 0; i < numPoints; i++) { // init colors of points
        indices[i] = i
    }

    let pointsGeometry = new THREE.BufferGeometry().setFromPoints(expandedGeometry.vertices);
    pointsGeometry.setAttribute('index', new THREE.BufferAttribute(indices, 1));

    let pointsMesh = new THREE.Points(pointsGeometry, pointsShaderMaterial);
    pointsMesh.geometry.computeBoundingSphere()
    let pointsRadius = pointsMesh.geometry.boundingSphere.radius
    pointsMesh.scale.set(3 / pointsRadius, 3 / pointsRadius, 3 / pointsRadius)
    scene.add(pointsMesh);
    meshes.push(pointsMesh)

    console.log(meshes)
}

createPolyhedronAndPoints()

// background plane

const backgroundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(100, 50),
    new THREE.MeshBasicMaterial({
        map: bgTexture,
    })
);
bgTexture.repeat.set(1, 1);
backgroundPlane.position.set(0, 0, -10);

scene.add(backgroundPlane);


// @cursor-bookmark Lights
// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);

function addLights() {
    scene.add(ambientLight);
    lights = [];
    let rr = rand()
    let numLights = 3
    if (rr < 0.15) {
        numLights = 1
    } else if (rr < 0.35) {
        numLights = 2
    } else if (rr < 0.85) {
        numLights = 5
    } else {
        numLights = 10;
    }
    // numLights = 9;
    for (let i = 0; i < numLights; i++) {
        const light = new THREE.DirectionalLight();
        light.color.setHex((0.1+rand() * 0.9) * 0xffffff);
        const x = rand() * 20 - 10;
        const y = rand() * 20 - 10;
        const z = rand() * 20 - 10;
        light.position.set(x, y, z);
        light.target.position.set(1, 1, 1); // point to the center
        light.intensity = 2;
        scene.add(light);
        lights.push(light);
    }
}
let lights = []
addLights()

// Axis Helpers
// const axesHelper = new THREE.AxesHelper(50);
// scene.add(axesHelper);

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight 

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Camera
const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
camera.focus = 10
let targetCameraPosition = 6
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

// Renderer
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    preserveDrawingBuffer: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement);

// Create an AnaglyphEffect
const anaglyphEffect = new AnaglyphEffect(renderer, 1500, innerWidth, innerHeight);
anaglyphEffect.eyeSeparation = 10;

// Add the AnaglyphEffect to the scene
// scene.add(anaglyphEffect);

// adjust textures
// const pmremGenerator = new THREE.PMREMGenerator(renderer);
// const envMap = pmremGenerator.fromEquirectangular(reflectionTexture).texture;
// envMap.mapping = THREE.EquirectangularReflectionMapping;


// Add a click event listener to the canvas
window.addEventListener('keydown', function (event) {
    // Check if the key pressed is "s" (or "S")
    if (event.key.toLowerCase() === 's') {
        // Convert the renderer's canvas content to a PNG data URL.
        const dataURL = renderer.domElement.toDataURL('image/png');

        // Create a temporary link element.
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'expansions'+polyname+seed+'.png';

        // Append the link, trigger a click to start download, then remove the link.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    if (event.key.toLowerCase() === 'c') {
        console.log(bestcombostext)
    }
    if (event.key.toLowerCase() === 'z') {
        bestcombostext += '[' + polyname + '],'
    }
    if (event.key.toLowerCase() === '1') {
        camera.focus += 1
        console.log(camera.focus)
    }
    if (event.key.toLowerCase() === '3') {
        camera.focus -= 1
        console.log(camera.focus)
    }
    if (event.key.toLowerCase() === 'n') {
        setPolyMaterial()
        createPolyhedronAndPoints()
        setPointsColor()
        addLights()
        scene.add(backgroundPlane);
        // initialGeometry = initCube()
        // // console.log(initialGeometry)
        // expandedGeometry = {}
        // expandedGeometry = generateExpansion(initialGeometry.vertices, initialGeometry.faces)
        // geometry = createGeometryFromFaces(expandedGeometry.vertices, expandedGeometry.faces)
        // mesh.geometry = geometry
        // mesh.geometry.computeBoundingSphere()
        // let radius = mesh.geometry.boundingSphere.radius
        // mesh.scale.set(3 / radius, 3 / radius, 3 / radius)
        // numPoints = expandedGeometry.vertices.length
        // pointsGeometry = new THREE.BufferGeometry().setFromPoints(expandedGeometry.vertices);
        // pointsMesh.geometry = pointsGeometry;
        // pointsMesh.geometry.computeBoundingSphere()
        // let pointsRadius = pointsMesh.geometry.boundingSphere.radius
        
        // pointsMesh.scale.set(3 / pointsRadius, 3 / pointsRadius, 3 / pointsRadius)
        // for (let i = 0; i < numPoints; i++) {
        //     indices[i] = i
        // }
        // pointsGeometry.setAttribute('index', new THREE.BufferAttribute(indices, 1));
    }
        if (event.key.toLowerCase() === 'i') {
            targetCameraPosition = 0.5
            camera.focus = 7
            // camera.lookAt(0,0,-6)
        }
    if (event.key.toLowerCase() === 'o') {
        targetCameraPosition = 6
        camera.focus = 10
        // camera.lookAt(0,0,0)
    }
    if (event.key.toLowerCase() === 'p') {
        targetCameraPosition = 3
        camera.focus = 1
        // camera.lookAt(0,0,0)
    }
    if (event.key.toLowerCase() === 'b') { // toggle background
        backgroundPlane.visible = !backgroundPlane.visible
    }
    if (event.key.toLowerCase() === 'd') { // darkmode
        darkmode = !darkmode;
        if (darkmode) {
            lights.forEach(light => {
                light.intensity = 0
                backgroundPlane.visible = true
                polyMaterial.metalness = 1
                polyMaterial.roughness = 0
                polyMaterial.envMap = reflectionTexture
                polyMaterial.envMapIntensity = 5
                // mesh.material.transparent = false
            })
        } else {
            lights.forEach(light => {
                light.intensity = 2
                polyMaterial.metalness = 0.6
                polyMaterial.roughness = 0.5
                polyMaterial.envMap = null
            })
        }
    }
    if (event.key.toLowerCase() === 'a') {
        anaglyph = !anaglyph;
        if (anaglyph) {
            // targetCameraPosition = 4
        } else {
            // targetCameraPosition = 6
        }
    }
    if (event.key.toLowerCase() === 'm') {
        playingaudio = !playingaudio;
        console.log(soundtrack.audioCtx)
        if (playingaudio) {
            soundtrack.audioCtx.resume();
        } else {
            soundtrack.audioCtx.suspend();
        }
    }

    
});

// @cursor-bookmark Animation Loop
// Animate
const clock = new THREE.Clock()
const initialposition = rand() * 6.28;

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()
  
    const time = Date.now() * .01;
    pointsShaderMaterial.uniforms.uTime.value = elapsedTime;

    // Update controls
    controls.update()
    // rotate object
    meshes.forEach(mesh => {
        mesh.rotation.y = 0.05*elapsedTime + initialposition;
        if (barrelling) {
            mesh.rotation.x += (barrellingYgoal - mesh.rotation.x) * 0.03
            if (Math.abs(mesh.rotation.x - barrellingYgoal) < 0.01) {
                barrelling = false;
            }
        }

    });
    // pointsMesh.rotation.y = 0.05 * elapsedTime + initialposition;
    // update lights
    // let lightcounter = 0;
    // lights.forEach(light => {
    //     // light.intensity = 2 + Math.sin(time * Math.cos(lightcounter) + lightcounter) * .1;
    //     //     light.position.x = Math.sin(time * Math.cos(lightcounter) + lightcounter) * 10;
    //     // light.position.y = Math.cos(time * Math.cos(lightcounter) + lightcounter) * 10;
    //     // light.position.z = Math.sin(time * Math.cos(lightcounter) + lightcounter) * 10;
    //     lightcounter += 1;
    // });
    // update camera if needed
    if (Math.abs(camera.position.z - targetCameraPosition) > 0.01) {
        camera.position.z += (targetCameraPosition - camera.position.z) * 0.03
    }
    
    // Render
    // renderer.render(scene, camera)
    // pointsMesh.visible = false
    if (anaglyph) {
        anaglyphEffect.render(scene, camera)
    } else {
        renderer.render(scene, camera)
    }
    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()

function initBarrelling() {
    if (barrelling) {
        return;
    }
    else {
        barrelling = true;
        barrellingYgoal = Math.floor(rand() * 9) - 4;  
        setTimeout(initBarrelling, 30000);
    }
}

// setTimeout(initBarrelling, 20000);






// for (let x = 0; x < rowcol; x++) {
//     for (let y = 0; y < rowcol; y++) {
//         let x1 = Math.floor(x / 4)
//         let x2 = x % 4
//         let y1 = Math.floor(y / 4)
//         let y2 = y % 4
//         let expandedGeometry = generateExpansion(initialGeometry.vertices,
//                                 initialGeometry.faces, 
//                                 [x1,x2,y1,y2])
//         let geometry = createGeometryFromFaces(expandedGeometry.vertices,
//                                 expandedGeometry.faces)
//         geometries.push(geometry)
//         let mesh = new THREE.Mesh(geometry, material)
//         mesh.position.set((x + 0.25) * spacing - 2.5*x0 , -(y + 0.25) * spacing + 2.5*y0 , 0)
//         mesh.geometry.computeBoundingSphere()
//         let radius = mesh.geometry.boundingSphere.radius
//         radii.push(radius)
//         mesh.scale.set(1/radius, 1/radius, 1/radius)
//         meshes.push(mesh)
//         scene.add(mesh)
//     }
// }





// update positions of points
// for (let i = 1; i < numPoints; i++) {
//     // let newindex = Math.floor(i+time)%numPoints
//     pointsMesh.geometry.attributes.position.array[i * 3] += (newPositions[i * 3] - pointsMesh.geometry.attributes.position.array[i * 3]) * 0.01
//     pointsMesh.geometry.attributes.position.array[i * 3 + 1] += (newPositions[i * 3 + 1] - pointsMesh.geometry.attributes.position.array[i * 3 + 1]) * 0.01
//     pointsMesh.geometry.attributes.position.array[i * 3 + 2] += (newPositions[i * 3 + 2] - pointsMesh.geometry.attributes.position.array[i * 3 + 2]) * 0.01
// }
// pointsMesh.geometry.attributes.position.needsUpdate = true;

// edges.rotation.y += 0.003;


// mesh.needsUpdate = true;
// mesh.geometry.computeVertexNormals();







// edges  object
// const points = makeEdges(expandedGeometry.vertices, expandedGeometry.edges)
// const edgesGeometry = new THREE.BufferGeometry().setFromPoints(points);
// // edgesGeometry.setAttribute('position', new THREE.BufferAttribute(points, 3));
// const edgesMaterial = new THREE.LineBasicMaterial({ color: 0xffffff });
// const edges = new THREE.LineSegments(edgesGeometry, edgesMaterial);
// edges.geometry.computeBoundingSphere()
// let edgesRadius = edges.geometry.boundingSphere.radius
// edges.scale.set(3/edgesRadius, 3/edgesRadius, 3/edgesRadius)
// scene.add(edges);





// const pointsMaterial = new THREE.PointsMaterial({
//      color: 0xffffff,
//     size : 0.01,
//     // vertexColors: true,
// });