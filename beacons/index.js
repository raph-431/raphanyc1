import * as THREE from 'three'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect.js';
// import { OrbitControls } from './addons/OrbitControls.js'
import { AnaglyphEffect } from './addons/AnaglyphEffect.js';
import * as soundtrack from './soundtrack.js'
import {
    xmur3, createPRNG, exportToOBJ, initCube, initTetrahedron, makeGalaxy, expansion, createGeometryFromFaces,
    createStarCubeMap, createStarField, filterNearFacesFast, createGalaxyCubeMap
} from './expansionUtils.js'
import vertexShader from './vertex.js'
import fragmentShader from './fragment.js'
import galaxyFragmentShader from './bloomfrag.js'
import galaxyVertexShader from './bloomvert.js'
import { VRButton } from './addons/VRButton.js';
let inscription_id = window.location.pathname.split("/").pop();
let seedHex = new URLSearchParams(location.search).get('iid') ?? '0';
let autonomousdelay = 300000; // 5 minutes


// for testing BEGINS
// inscription_id = new URLSearchParams(window.location.search).get("seed") || Array(64).fill(0).map(_ => chars[(Math.random() * chars.length) | 0]).join('');
console.log("ID", inscription_id)
// for testing ENDS
let blockHeight = 0;
let epoch = null;
let alreadySetBackground = false;
// block height
async function getBlockHeight() {
    const response = await fetch('/blockheight');
    blockHeight = await response.text() || 0;
    if (blockHeight.includes('<!DOCTYPE') || blockHeight.includes('not be found')) {
        blockHeight = 898828;
    }
    console.log("blockHeight", blockHeight)
    return blockHeight;
}

let lastBlock = null;

async function checkBlockLoop() {
    const currentBlock = await getBlockHeight();
    if (lastBlock !== null && currentBlock > lastBlock) {
        newBlockEffect(currentBlock)
    }
    lastBlock = currentBlock;
    epoch = Math.floor(currentBlock / 2016);// REMOVE BEFORE DEPLOYMENT
    // REMOVE BEFORE DEPLOYMENT// REMOVE BEFORE DEPLOYMENT// REMOVE BEFORE DEPLOYMENT// REMOVE BEFORE DEPLOYMENT
    // REMOVE BEFORE DEPLOYMENT// REMOVE BEFORE DEPLOYMENT// REMOVE BEFORE DEPLOYMENT// REMOVE BEFORE DEPLOYMENT
// epoch = 525
    console.log("difficulty epoch", epoch)
    setTimeout(checkBlockLoop, 10000); // poll every 10 sec
    if (!alreadySetBackground) {
        setBackground();
        alreadySetBackground = true;
    }
}
checkBlockLoop();

if (inscription_id == '') seedHex = 'c24b53e7733d72a8662676bd2067fa7e715fa5c2ea614b7727da9787def47aeai5';
 seedHex = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
let rand = createPRNG(seedHex);
console.log(inscription_id, seedHex)

///. END ORDINAL INTRINSICS

let isVR = false;
if (navigator.xr) {
    navigator.xr.isSessionSupported("immersive-vr").then((isSupported) => {
        if (isSupported) {
            isVR = true;
        }
    });
}
let notVR = !isVR;
// const isVR = (navigator.xr.isSessionSupported('immersive-vr') == true);
// const notVR = !isVR;
console.log(isVR, notVR)
let viewpoint = "outside"
// global audio
let playingaudio = false
// let hashseed = $fx.iteration;
let nbfaces = 0;
let nbvertices = 0;
// let rotationspeed = 1;
let firsttimemode = true;
 // flag to avoid multiple triggers
let firstSession = true;
let countdowntoauto = 0;
let stealthtime = 0;
let grading = new Array(160).fill(0);


/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

let isDragging = false;
let lastMouse = { x: 0, y: 0 };
let rotation = { x: 0, y: 0 };
let targetRotation = { x: 0, y: 0 };

document.addEventListener('mousedown', e => {
    isDragging = true;
    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
    if (autonomousActive) { stopAutonomousMode(); }
});

document.addEventListener('mouseup', () => {
    isDragging = false;
 
 
});

document.addEventListener('mousemove', e => {
    if (!isDragging) return;

    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;

    targetRotation.y += dx * 0.005;
    targetRotation.x += dy * 0.005;

    lastMouse.x = e.clientX;
    lastMouse.y = e.clientY;
});

// function for loading panel
function updateLoadingPanel(displaytext) {
    const loadingPanel = document.getElementById('loading-panel');
    loadingPanel.textContent = displaytext;
}
function hideLoadingPanel() {
    const loadingPanel = document.getElementById('loading-panel');
    loadingPanel.style.display = 'none';
}

updateLoadingPanel('initializing')

// add swipe detection for mobile
function isMobileDevice() {
    const isTouch =
        "ontouchstart" in window || navigator.maxTouchPoints > 0;
    const isCoarse = window.matchMedia("(pointer: coarse)").matches;
    const userAgentMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    return isTouch && (isCoarse || userAgentMobile);
}
const isMobile = isMobileDevice();


let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

const swipeThreshold = 50; // Minimum px distance to count as a swipe
window.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
});

window.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    touchEndY = e.changedTouches[0].screenY;

    handleSwipe();
});

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (Math.abs(deltaX) > swipeThreshold) {
            if (deltaX > 0) {
                // Swipe right
                toggleDarkmode();
            } else {
                // Swipe left
                backgroundPlane.visible = !backgroundPlane.visible;
            }
        }
    } else {
        // Vertical swipe
        if (Math.abs(deltaY) > swipeThreshold) {
            if (deltaY > 0) {
                // Swipe down
                movein();
            } else {
                // Swipe up
                moveout();
            }
        }
    }
}

// @cursor-bookmark Scene Setup
// Scene
const scene = new THREE.Scene()
// Initialize cube
const thickness = 0.2
const sectionPlane1 = new THREE.Plane(new THREE.Vector3(1,0, -1),-3); // y = 1 plane
const sectionPlane2 = new THREE.Plane(new THREE.Vector3(-1, 0, 1),3); // y = 1 plane
// const starField = createStarField(4096, 2048, 1.5)
// updateLoadingPanel('locating beacon')

// Cube definition (centered at origin, side length 2)
let expandedGeometry = {}

let seed = 0;
let darkmode = false;
let stealthmode = false;
let shieldsmode = false;
let anaglyph = false;
let barrelling = false;
let barrellingYgoal = 0;
seed = Math.floor(rand() * 1000000)
let bestcombos = []
let bestcombostext = '['
let combinations = []
let polyname;
let combos = []
let burstTime = 0;
const combos1 = ['AcBcgIF', 'ciADDaG', 'BEaaBai', 'IaAaBBh', 'IbbciAd', 'hebjABB', 'AABaFJB', 'dDADFD', 'ieeaGDI', 'jiAdACA', 'EHDCAai', 'jJjCaj', 'jBDDaiB', 'EdAcbK', 'fGbAaIG', 'EAbAcba', 'fihbaBA', 'jaAcBjH', 'IaeaehA', 'dAAaJbK', 'jAAabaj', 'daFaABF']
const combos2 = ['dDADFD', 'gDGiBeA', 'GhdHaCJ', 'hcAjAAa', 'hCFHaAi', 'jAaAaad', 'BAJeaAg', 'FaAhJae', 'AHaAbha', 'aaafDaD', 'DBDcJAG', 'fbeBfAA', 'BjAbbAa', 'JaieAGF', 'CGdCaAj', 'CbDafaa', 'dEBAaAa', 'cbBaFbH', 'idcaBEA', 'ciCagAj', 'jjeBAae', 'cAAaD', 'HeIDBHh', 'heaaAa', 'ghjdiaG', 'CAhEacA', 'gcaAadj', 'gFBgbAb', 'EccBda', 'hgAACdG', 'ICaibg', 'BfecAAA', 'adAkafa', 'abEefBg', 'DdJaEjb', 'JabBai', 'AAJCajA', 'iaBibC', 'aIBaAAh', 'IGAjae', 'FHjacaA', 'aeJhBcb', 'DbHABja', 'CGjABIH', 'JbhBaba', 'bIccCdA', 'AbbbAdD']
combos = combos1.concat(combos2)
// combos = ['dDADFD', 'FIaaAAJ', 'gDGiBeA', 'GhdHaCJ', 'EEAHA', 'hcAjAAa', 'AbGbDDb', 'ieeaGDI', 'jiAdACA', 'jaFgCE', 'cbBaFbH', 'idcaBEA', 'caAbada', 'HfAbAE', 'hCFHaAi', 'bAbDHEf', 'EHDCAai', 'jAaAaad', 'afafCG', 'DEjDgDA', 'BAJeaAg', 'EAefabf', 'CbcbhAc', 'jiaADDj', 'ciCagAj',  'AcBcgIF', 'HDkbEDb', 'BFcKIF', 'jjeBAae', 'AaEeAIf', 'iDfGcAa', 'FaAhJae', 'gAhceA', 'cAAaD', 'jJjCaj', 'jBDDaiB', 'HeIDBHh', 'heaaAa', 'haHCaIH', 'ghjdiaG', 'CAhEacA', 'GgBBAAa', 'hfiIaaB', 'gcaAadj', 'dGfBbca', 'icadAHA', 'jACabAj', 'AHaAbha', 'aaafDaD', 'fEDBaAe', 'bAaCajh', 'gFBgbAb', 'EdAcbK', 'EccBda', 'bFdAgEa', 'GaaacCg', 'BEaaBai', 'JBadBgC', 'DBDcJAG', 'hgAACdG', 'ICaibg', 'jaBbAJa', 'fbeBfAA', 'IaAaBBh', 'fbbabAI', 'cJgjJA', 'IhaAaGJ', 'ChbAgE', 'hGiAAd', 'fGbAaIG', 'BfecAAA', 'adAkafa', 'BjAbbAa', 'IbbciAd', 'abEefBg', 'IgbacGa', 'giBAAJa', 'DdJaEjb', 'fDabaaB', 'eAdGcBc', 'hebjABB', 'jcdHFAE', 'JabBai', 'AAJCajA', 'JaieAGF', 'eGaAABd', 'EAbAcba', 'EcaAccA', 'adiDFFb', 'iaBibC', 'cCaaAA', 'IaabcAH', 'fihbaBA', 'iDcbfJi', 'jaAcBjH', 'CGdCaAj', 'IaeaehA', 'BIGFIA', 'aIBaAAh', 'IGAjae', 'jadEaeA', 'FHjacaA', 'ciADDaG', 'fgBIEcC', 'BEaCdAa', 'aeJhBcb', 'CbDafaa', 'EBgaADA', 'HACEabf', 'DbHABja', 'eBhAcBa', 'dEBAaAa', 'dAAaJbK', 'CGjABIH', 'jAAabaj', 'EEAiDAa', 'daFaABF', 'JbhBaba', 'bIccCdA', 'HceABbA', 'fbebceg', 'FcGGedd', 'hghHIAd', 'bDADBaE', 'AABaFJB', 'FaAGhb', 'AbbbAdD', 'dAfAaHh', 'DgGaaIa']

// console.log(combinations.length)
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
function generateExpansion(initialVertices, initialFaces, combi) {
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
    // let rr = rand()
    // if (rr < 0.05) {
    //     iterations = 5
    // } else if (rr < 0.20) {
    //     iterations = 6
    // }
    // pure random
    offsets = [];
    labels = [];
    let combochoice = 0;
    let rr = rand()
    if (rr < 0.5) { // choose from combos1
        combochoice = Math.floor(rand() * combos1.length)
        console.log('combos 1 ', combochoice)
    } else { //choose from combos2
        combochoice = combos1.length +Math.floor(rand() * combos2.length)
        console.log('combos 2 ', combochoice)
    }

    let combo = stringToType(combos[combochoice])
    if (combi) {
        combo = stringToType(combi);
       
    }
    // combo = stringToType('aIhBDhd')
    // combo = stringToType('AABaFJB')
    iterations = combo.length
    // console.log(combos[combochoice])
    let lastoffset = 0;
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
        // offsetAmount = (Math.pow(rand(), Math.pow(k, 0.5)+1) * 5 + 0.1) * (Math.floor(rand() * 2) * 2 - 1);
        // if (lastoffset > 0) offsetAmount -= 0.1
        // if (lastoffset < 0) offsetAmount += 0.1
        // if (Math.abs(offsetAmount) < 0.1) offsetAmount = (Math.pow(rand(), Math.pow(k, 0.5) + 1) * 5 + 0.1) * (Math.floor(rand() * 2) * 2 - 1);
        // lastoffset = offsetAmount
        // labels.push(String(Math.floor(offsetAmount*100))+'_')
        // if (sequence.length > 0) {
        //     index = sequence[k]
        //     offsetAmount = offsets[index]
        // }
        offsetAmount = (combo[k]+rand()*60 - 30)/100 //* (.9 + 0.2 * rand())/100
        
        // console.log(offsetAmount)
        polyname += String(Math.floor(offsetAmount * 100)) + ',' //labels[index]
        expandedGeometry = expansion(initialVertices, initialFaces, offsetAmount);
        initialVertices = expandedGeometry.vertices;
        initialFaces = expandedGeometry.faces;
    }
    // expandedGeometry = expansion(cubeVertices, cubeFaces, offsetAmount);
    // console.log(expandedGeometry);
    polyname = combos[combochoice]
    if (combi) {
        polyname = combi;
    }
    console.log(polyname)
    console.log(expandedGeometry.faces.length, 'faces')
    console.log(expandedGeometry.vertices.length, 'vertices')
    nbfaces = expandedGeometry.faces.length
    nbvertices = expandedGeometry.vertices.length
    return expandedGeometry
}



// @cursor-bookmark Material

const polyMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: .6,
    metalness:  0.7,
    roughness: 0.3, //0.1,
    // refractionRatio: 0.98,
    side: THREE.DoubleSide,
    polygonOffset: true,
    // // Factor and units control the depth offset.
    // // Experiment with these values to see what works best for your scene.
    polygonOffsetFactor: 1,  // How much to offset based on the slope of the polygon.
    polygonOffsetUnits: 1,    // Constant offset added to the depth.
    // wireframe: true,
})

const reflectionMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    reflectivity: 1,
    opacity: .6,
    transparent: true,
    combine: THREE.MixOperation,
    side: THREE.DoubleSide,
})

function setPolyMaterial() {
    // polyMaterial.metalness = 0.6 + rand() * 0.1;
    // polyMaterial.roughness = 0.4 + rand() * 0.2;
    // polyMaterial.color.setHex((0.9 + rand() * 0.1) * 0xffffff);
    // polyMaterial.roughness = 0
    // polyMaterial.metalness = 1
}

setPolyMaterial()
let polyMetalness = polyMaterial.metalness
let polyRoughness = polyMaterial.roughness
let pointsSize = 18
let pointsSizeTarget = 18

const pointsShaderMaterial = new THREE.ShaderMaterial({
    // depthWrite: true,
    // blending: THREE.AdditiveBlending,
    transparent: true,
    vertexColors: true,
    depthWrite: false,
    // depthTest: false,i
    vertexShader: vertexShader,
    fragmentShader: fragmentShader,
    uniforms: {
        // uSize: { value: 20 },
        uSize: { value: pointsSize },
        uTime: { value: 0 },
        uColor: { value: new THREE.Color(1, 1, 1) },
        uResolution: { value: window.innerHeight }
    }
})
function setPointsColor() {
    let rr = rand()
    if (rr < 0.11) {
        pointsShaderMaterial.uniforms.uColor.value.set(1, 0.3, 0.3)
    } else if (rr < 0.22) {
        pointsShaderMaterial.uniforms.uColor.value.set(0.3, 1, 0.3)
    } else if (rr < 0.33) {
        pointsShaderMaterial.uniforms.uColor.value.set(0.3, 0.3, 1)
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


function createPolyhedronAndPoints(x=0,y=0,z=0,rad=3,type=2,sequence) {
    // @cursor-bookmark Single object
    
    // meshes = []
    let totalvertices = 0
    let initialGeometry = {}
    console.log(type)
    while (totalvertices < 15000) {
        let rr = rand()
        initialGeometry = {}
        if (rr < 0.3 || type == 1) {
            initialGeometry = initTetrahedron()
        }
        if (rr>=0.3 || type == 0) {
            initialGeometry = initCube()
        }
        // initialGeometry = initTorus()
        console.log(initialGeometry.vertices.length)
        // initialGeometry = initOctahedron()
        expandedGeometry = generateExpansion(initialGeometry.vertices, initialGeometry.faces,sequence)
        totalvertices = expandedGeometry.vertices.length
     }
    
    // first clean up the faces
    let cleanFaces = filterNearFacesFast(expandedGeometry.vertices, expandedGeometry.faces)

    // now create the geometry
    let geometry = createGeometryFromFaces(expandedGeometry.vertices, cleanFaces)
    let polyMesh = new THREE.Mesh(geometry, polyMaterial)
    // console.log(material)
    polyMesh.geometry.computeBoundingSphere()
    
    let radius = polyMesh.geometry.boundingSphere.radius
    polyMesh.scale.set(rad / radius, rad / radius, rad / radius)
    meshes.push(polyMesh)
    polyMesh.position.set(x, y, z)
    if (isVR) {
        polyMesh.position.set(0, 1, -5); 
        viewpoint = "outside"
    }
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
    pointsMesh.scale.set(rad / pointsRadius, rad / pointsRadius, rad / pointsRadius)
    pointsMesh.position.set(x, y, z)
    if (isVR) { pointsMesh.position.set(0, 1, -5) }
    scene.add(pointsMesh);
    meshes.push(pointsMesh)

    // console.log(meshes)
}
updateLoadingPanel('calibrating signal')
// scene.clear()
let comboindex = 0
let sequence = combos[comboindex]
// scene.background = new THREE.Color(0xffffff);
// createPolyhedronAndPoints(-2.2, 0, 0, 2, 0, sequence) // original size: 3
// createPolyhedronAndPoints(2.2, 0, 0, 2, 1, sequence)
createPolyhedronAndPoints(0, 0, 0, 3, 2) 

// background plane

const backgroundPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(60, 30), // 60, 30
    new THREE.MeshBasicMaterial({
        //  color: 0xffffff,
        // map: bgTexture,
    })
);

if (notVR) {
    // backgroundPlane.material.map = bgTexture;
    // bgTexture.repeat.set(1, 1);

    backgroundPlane.position.set(0, 0, -10);
    backgroundPlane.visible = true;
} else {
    backgroundPlane.visible = false;
    backgroundPlane.position.set(0, 0, -20);
}

scene.add(backgroundPlane);

// small witness sphere
const witnessSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.003, 16, 16),
    new THREE.MeshBasicMaterial({ color: 0xffffff })
);
// witnessSphere.position.set(10, -2, -10);
scene.add(witnessSphere);
witnessSphere.visible = false;

// right hand spheres
const rightIndexSphere = witnessSphere.clone()
// rightIndexSphere.material.color.set(0xff0000)
rightIndexSphere.visible = false
const rightThumbSphere = witnessSphere.clone()
rightThumbSphere.visible = false
scene.add(rightIndexSphere)
scene.add(rightThumbSphere)

// left hand spheres
const leftIndexSphere = witnessSphere.clone()
leftIndexSphere.visible = false
leftIndexSphere.material.color.set(0x0000ff)
const leftThumbSphere = witnessSphere.clone()
leftThumbSphere.visible = false
scene.add(leftIndexSphere)
scene.add(leftThumbSphere)

const thumbSpheres = [leftThumbSphere, rightThumbSphere]
const indexSpheres = [leftIndexSphere, rightIndexSphere]

// info panel for VR
const vrCanvas = document.createElement('canvas');
const vrCtx = vrCanvas.getContext('2d');
const fontSize = 128;
vrCtx.font = "32px sans-serif";

// size canvas to fit text
vrCanvas.width = 400;
vrCanvas.height = 100; 
// optional: draw a panel background
vrCtx.fillStyle = 'rgba(0,0,0,.2)';
vrCtx.fillRect(0, 0, vrCanvas.width, vrCanvas.height);

// draw the text
vrCtx.fillStyle = 'white';
vrCtx.textBaseline = 'top';
vrCtx.fillText('right pinch + up/down: zoom in/out', 2, 0);
vrCtx.fillText('left swipe up/down: zoom in/out', 2, 20);
vrCtx.fillText('left swipe left/right: darkmode/shields', 2, 40);
vrCtx.fillText('left pinch: audio on/off', 2, 60);
const vrTexture = new THREE.CanvasTexture(vrCanvas);
vrTexture.minFilter = THREE.LinearFilter; // avoid mip-map flicker
vrTexture.magFilter = THREE.LinearFilter;
vrTexture.generateMipmaps = false;
vrTexture.needsUpdate = true;

const spriteMat = new THREE.MeshBasicMaterial({
    map: vrTexture, depthTest: false,
    depthWrite: false, transparent: true
});
const sprite    = new THREE.Mesh(new THREE.PlaneGeometry(4, 1), spriteMat);
// sprite.scale.set(0.2, 0.2, 0.2);
sprite.position.set(0, -6, 0);
sprite.rotation.x = -Math.PI / 2;
sprite.visible = false;
scene.add(sprite);


// @cursor-bookmark Lights
// lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
scene.add(ambientLight);

function addLights() {
   
    let lightsArray = [];
    let rr = rand()
    let numLights = 3
    if (rr < 0.5) {
        numLights = 1
    } else if (rr < 0.85) {
        numLights = 4
    } else {
        numLights = 9;
    }
    // numLights = 9;
    const hues = [
        0.0,            // Red
        20 / 360,       // Orange (~0.083)
        30 / 360,       // Yellow (~0.167)
        150 / 360,      // Green (~0.333)
        200 / 360,      // Aqua (0.5)
        235 / 360,      // Blue (~0.667)
        280 / 360,      // Purple (~0.833)
        350 / 360       // Pink (~0.917)
    ];

    // Randomly pick one hue from the array.
    

    // Set your desired saturation and lightness.
 const saturations = [0.1, 0,6, 0.5, 0.4]
 const lightnesses = [ 0.2, 0.4, 0.5] //, 0.8]
    // Now set the lignht's color using HSL.
    for (let i = 0; i < numLights; i++) {
        let saturation = saturations[Math.floor(rand() * saturations.length)] //0.2 + rand() * 0.4; // or adjust as needed
        let lightness = lightnesses[Math.floor(rand() * lightnesses.length)] //0.3 + 0.3 * rand();  // or adjust as needed
        let chosenHue = hues[Math.floor(rand() * hues.length)];
        // chosenHue = 100/360
        const light = new THREE.DirectionalLight();
        light.color.setHSL(chosenHue, saturation, lightness);
        const x = rand() * 20 - 10;
        const y = rand() * 20 - 10;
        const z = rand() * 20 - 10;
        light.position.set(x, y, z);
        light.target.position.set(0, 0, 0); // point to the center
        light.intensity = 2;
        scene.add(light);
        lightsArray.push(light);
        
    }
    return lightsArray
}
let lights = []
let lightsTwo = []
// lights = addLights()
// lightsTwo = addLights()

// Axis Helpers
// const axesHelper = new THREE.AxesHelper(50);
// scene.add(axesHelper);

// Sizes
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}



// Camera
const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.01, 100)
camera.position.z = 6
camera.focus = 10
let targetCameraPosition = 6
let targetMeshPosition = -1
scene.add(camera)

let starField, reflectionField, bgTexture,
    bloomTexture, bloomTextureVR, reflectionTexture, nebulaIntensity
let tex = null
let renderTarget = null
let renderTargetVR = null   
let sceneA = null
let cameraA = null
let quadA = null

function setBackground() {
    if (navigator.xr) {
        navigator.xr.isSessionSupported("immersive-vr").then((isSupported) => {
            if (isSupported) {
                isVR = true;
            }
        });
    }
    notVR = !isVR;
    const newseed = xmur3(seedHex+epoch.toString())()
    rand = createPRNG(newseed)
    starField = makeGalaxy(2048, 2048, newseed)
    console.log('newseed', String(newseed))
    // reflectionField = createStarField(8192, 8192, 5);
    reflectionField = createStarCubeMap(1024, 2.2, 0.2);
    // console.log('reflectionField', reflectionField)
    bgTexture = starField;  //new THREE.CanvasTexture(starField);
    bgTexture.wrapS = THREE.RepeatWrapping;
    bgTexture.wrapT = THREE.RepeatWrapping;
    // bgTexture.repeat.set(1, 1);
  
    tex = new THREE.CanvasTexture(starField);
    console.log("epoch", epoch, "seedHex", seedHex)
    // scene.background = reflectionField;
    

    // const texVR = new THREE.CanvasTexture(vrstarField);
    renderTarget = new THREE.WebGLRenderTarget(4096, 2048, 
        {
            type: THREE.HalfFloatType
        });
    
    // First scene: shader pass that renders into texture
    sceneA = new THREE.Scene();
    cameraA = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 3);
    // const seed = Math.random() * 1000;

    const maxGalaxies = 100;
    const nbGalaxies = Math.floor(Math.pow(rand(), 3) * 30);
    let galaxyPositions = [];
    let galaxySizes = [];
    let galaxyRotations = [];
    function initGalaxies() {
        galaxyPositions = [];
        galaxySizes = [];
        galaxyRotations = [];
        for (let i = 0; i < maxGalaxies; i++) {
            let xpos = 0.05 + rand() * 0.9;
            let ypos = 0.05 + rand() * 0.9;
            if (i > nbGalaxies) { xpos = -1; }
            galaxyPositions.push(new THREE.Vector2(xpos, ypos));
            let xSize = 0.003 + 0.006 * rand();
            let ySize = 0.003 + 0.006 * rand();
            galaxySizes.push(new THREE.Vector2(xSize, ySize));
            let rot = rand() * 6.28;
            galaxyRotations.push(rot);

        }
    }
    initGalaxies()
    
    let shaderSeed = rand() * 100;
    // shaderSeed = 0.0471932
    console.log('shader seed', shaderSeed)
    nebulaIntensity = Math.pow(rand(), 2) * 2;
    let textureType = 0;
    if (isVR) {
        textureType = 1;
    }
    quadA = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.ShaderMaterial({
            uniforms: {
                uTexture: { value: tex },
                uThreshold: { value: 0.7 },
                uIntensity: { value: 1.0 },
                uNebulaIntensity: { value: nebulaIntensity },
                uBlurSize: { value: 1.0 / 4096.0 }, // depends on resolution
                uSeed: { value: shaderSeed },
                uGalaxyPositions: { value: galaxyPositions },
                uGalaxySizes: { value: galaxySizes },
                uGalaxyRotations: { value: galaxyRotations },
                uTextureType: { value: textureType },
                uTime: { value: 0 }
            },
            vertexShader: galaxyVertexShader,
            fragmentShader: galaxyFragmentShader,
        })
    );
    sceneA.add(quadA);
    // renderer.outputEncoding = THREE.sRGBEncoding;

    renderer.setRenderTarget(renderTarget);
    renderer.render(sceneA, cameraA);
    bloomTexture = renderTarget.texture;
    bloomTexture.mapping = THREE.EquirectangularReflectionMapping;
    // bloomTexture.encoding = THREE.sRGBEncoding;
    bloomTexture.repeat.set(1, 1);
    bloomTexture.generateMipmaps = false;

    quadA.material.uniforms.uTextureType.value = 1;
    quadA.material.uniforms.uThreshold.value = 0.9;
    quadA.material.uniforms.uIntensity.value = 0.25;
    quadA.material.uniforms.uNebulaIntensity.value = 2 * nebulaIntensity;
    // quadA.material.uniforms.uTexture.value = texVR;
    quadA.material.needsUpdate = true;
    renderTargetVR = new THREE.WebGLRenderTarget(4096, 2048,
        {
            type: THREE.HalfFloatType
        });

    renderer.setRenderTarget(renderTargetVR);
    renderer.render(sceneA, cameraA);
    bloomTextureVR = renderTargetVR.texture;
    // bloomTextureVR.encoding = THREE.sRGBEncoding;
    bloomTextureVR.repeat.set(1, 1);
    bloomTextureVR.generateMipmaps = false;


    renderer.setRenderTarget(null);
    renderer.preserveDrawingBuffer = true;

    const displayMaterial = new THREE.MeshBasicMaterial({
        map: bloomTexture
    });

    // if (notVR) {
        backgroundPlane.material = displayMaterial;
    // }

    // const pmremGen = new THREE.PMREMGenerator(renderer);
    // const reflectionTexture = pmremGen.fromEquirectangular(bloomTexture).texture;
    // // reflectionTexture = new THREE.CanvasTexture(reflectionField);
    reflectionTexture = reflectionField;
    // reflectionTexture = createGalaxyCubeMap(newtexture);
    // reflectionTexture.anisotropy = 16;
    reflectionTexture.minFilter = THREE.LinearFilter;
    reflectionTexture.magFilter = THREE.LinearFilter;
    reflectionTexture.generateMipmaps = false;
    // reflectionTexture.mapping = THREE.EquirectangularReflectionMapping;
    reflectionTexture.mapping = THREE.CubeReflectionMapping;
    reflectionTexture.needsUpdate = true;
    reflectionMaterial.envMap = reflectionTexture;
    reflectionMaterial.envMapIntensity = 1;
    // reflectionTexture.colorSpace = THREE.SRGBColorSpace;
    bloomTextureVR.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = bloomTextureVR

    lights.forEach(light => {
        scene.remove(light)
    })
    lightsTwo.forEach(light => {
        scene.remove(light)
    })
    lights = []
    lightsTwo = []
    lights = addLights()
    lightsTwo = addLights()

}







// Renderer
const renderer = new THREE.WebGLRenderer({
    preserveDrawingBuffer: true,
    // optionalFeatures: ['local-floor', 'bounded-floor']
}
)
// if (isVR) {
    renderer.xr.enabled = true;
// }
renderer.antialias = true;
renderer.xr.addEventListener('sessionstart', () => {
    moveOutside()
    if (!playingaudio) {
        toggleSound();
    }
    textureType = 1;
    bloomTexture.mapping = THREE.EquirectangularReflectionMapping;
    bloomTextureVR.mapping = THREE.EquirectangularReflectionMapping;
    scene.background = bloomTextureVR; //vrBgTexture;
    backgroundPlane.visible = false;
    // const session = renderer.xr.getSession();
    
});

renderer.xr.addEventListener('sessionend', () => {
    if (playingaudio) {
        toggleSound();
    }
});


updateLoadingPanel('signal calibrated')

// add bloom shader



const sessionInit = { optionalFeatures: ['hand-tracking'] };
const vrButton = VRButton.createButton(renderer, sessionInit);
vrButton.id = 'VRButton';
document.body.appendChild(vrButton);


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


// define modes
function toggleDarkmode() {
    darkmode = !darkmode;
    if (darkmode) {
        
        // lights.forEach(light => {
        //     light.intensity = 0
        // })
        // lightsTwo.forEach(light => {
        //     light.intensity = 0
        // })
            // polyMetalness = polyMaterial.metalness
        // polyRoughness = polyMaterial.roughness
       
        // reflectionMaterial.envMap = bloomTexture;
        // reflectionTexture
        meshes[0].material = reflectionMaterial
        //     polyMaterial.metalness = 1
        //     polyMaterial.roughness = 0
        //     polyMaterial.envMap = reflectionTexture
        // polyMaterial.envMapIntensity = 5
        
        setTimeout(() => {
            if (autonomousActive && darkmode) { toggleDarkmode() }
        }, 60000) // stay dark for 1 minute
    } else {
        // lights.forEach(light => {
        //     light.intensity = 2
        // })
        // lightsTwo.forEach(light => {
        //     light.intensity = 0
        // })
        meshes[0].material = polyMaterial
        // polyMaterial.metalness = polyMetalness
        // polyMaterial.roughness = polyRoughness
        // polyMaterial.envMap = null
    }
}

function toggleShields() {
    if (darkmode) { toggleDarkmode() }
    shieldsmode = !shieldsmode
    polyMaterial.opacity = polyMaterial.opacity === 0.6 ? 1 : 0.6;
    polyMaterial.metalness = polyMaterial.metalness === 0.7 ? 1 : 0.7;
    // polyMaterial.roughness = polyMaterial.roughness === 0.3 ? 1 : 0.3;
    if (shieldsmode) {
        const timer = Math.floor(rand() * 10000) + 2500
        setTimeout(toggleShields, timer)
    }
}

function toggleStealth() {
    stealthmode = !stealthmode
    if (stealthmode) {
        renderer.localClippingEnabled = true;
        pointsShaderMaterial.visible = false;
        stealthtime = Date.now()
        setTimeout(() => {
            if (autonomousActive) { toggleStealth() }
        }, 5000)
    } else {
        // renderer.localClippingEnabled = false;
        // pointsShaderMaterial.visible = true;
        stealthtime = Date.now()
    }
}

function toggleVRbackground() {
    
    if (scene.background === bloomTextureVR) {
        scene.background = null;
    } else {
        scene.background = bloomTextureVR;
    }
}

function moveInside() {
    viewpoint = "inside"
    if (isVR) {
        targetMeshPosition = -1
        pointsSizeTarget = 5
    } else {
        targetCameraPosition = 0.5
        camera.focus = 7
        camera.near = 0.5
        pointsSizeTarget = 10
        camera.updateProjectionMatrix()
    }
    
}

function moveOutside() {
    viewpoint = "outside"
    if (isVR) {
        targetMeshPosition = -5
        pointsSizeTarget = 10
    } else {
        targetCameraPosition = 6
        camera.focus = 10
        camera.near = 0.1
        camera.updateProjectionMatrix()
        pointsSizeTarget = 18
    }
}

function moveFarout() {
    viewpoint = "farout"
    if (isVR) {
        targetMeshPosition = -10
        pointsSizeTarget = 10
    } else {
        targetCameraPosition = 12
        camera.focus = 12
        camera.near = 0.1
        camera.updateProjectionMatrix()
        pointsSizeTarget = 22
    }
}

function moveCloser() {
    viewpoint = "closer"
    if (isVR) {
        targetMeshPosition = -3
        pointsSizeTarget = 5
    } else {
        targetCameraPosition = 3
        pointsSizeTarget = 8
        camera.focus = 1
        camera.near = 0.1
        camera.updateProjectionMatrix()
    }
}

function movein() {
    if (viewpoint === "farout") {
        moveOutside()
    } else if (viewpoint === "outside") {
        moveCloser()
    } else if (viewpoint === "closer") {
        moveInside()
    }
}

function moveout() {
    if (viewpoint === "inside") {
        moveCloser()
    } else if (viewpoint === "closer") {
        moveOutside()
    } else if (viewpoint === "outside") {
        moveFarout()
    }
}

function toggleAnaglyph() {
    anaglyph = !anaglyph;
    if (anaglyph) {
        setTimeout(() => {
            if (autonomousActive) { toggleAnaglyph() }
        }, 20000)
    }
}

function donothing() {
    // console.log("donothing")
}

// autonomouse mode
const modes = [
    () => toggleDarkmode(),
    () => movein(),
    () => moveout(),
    () => donothing(),
    () => toggleShields(),
    () => toggleStealth(),
    // () => toggleAnaglyph(),
    // () => moveInside(),
];
const modeProbabilities = [
    0.0,
    0.20,
    0.40,
    0.57,
    0.95,
    0.995
]

let autonomousActive = true;
let autonomousTimeout = null;

function startAutonomousMode() {
    if (!autonomousActive) return;

    // Pick a random mode
    const randompick = Math.random();
    let modeIndex = 0;
    for (let i = 0; i < modes.length; i++) {
        if (randompick > modeProbabilities[i]) {
            modeIndex = i;
            // break;
        }
    }
    // console.log(randompick, modeIndex)
    const mode = modes[modeIndex];
    if (firsttimemode) {
        firsttimemode = false;
    } else {
        mode(); // Activate it
    }
    const monitor = document.getElementById('mode');
    monitor.innerHTML = 'monitoring: autonomous';
    // Set next random delay
    const nextDelay = 10000 + Math.random() * 15000; // 15 to 30 seconds
    // console.log(nextDelay)
    console.log(randompick, modes[modeIndex])
    autonomousTimeout = setTimeout(startAutonomousMode, nextDelay);
}

function stopAutonomousMode() {
    autonomousActive = false;
    const monitor = document.getElementById('mode')

    monitor.innerHTML = 'monitoring: <span style="color: red;">manual</span>'
    if (autonomousTimeout) {
        clearTimeout(autonomousTimeout);
        autonomousTimeout = null;
        console.log("stopped autonomous mode")
    }
    autonomousTimeout = setTimeout(() => {
        autonomousActive = true;
        startAutonomousMode();
    }, autonomousdelay)
    countdowntoauto = Date.now()
}

function enableAutonomousMode() {
    autonomousActive = true;
    startAutonomousMode();
}

enableAutonomousMode();

function enterFullscreen() {
    const elem = document.documentElement; // or any other element
    if (elem.requestFullscreen) {
        elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) { // Safari
        elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) { // IE11
        elem.msRequestFullscreen();
    }
}

function exitFullscreen() {
    if (document.exitFullscreen) {
        document.exitFullscreen();
    } else if (document.webkitExitFullscreen) { // Safari
        document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) { // IE11
        document.msExitFullscreen();
    }
}

function toggleSound() {
    playingaudio = !playingaudio;
    // console.log(soundtrack.audioCtx)
    if (playingaudio) {
        soundtrack.audioCtx.resume().then(() => {
            soundtrack.masterGain.gain.setValueAtTime(0, soundtrack.audioCtx.currentTime);
            soundtrack.masterGain.gain.linearRampToValueAtTime(1, soundtrack.audioCtx.currentTime + 1);
            soundtrack.scheduleSoundtrack();
        })

    } else {
        soundtrack.masterGain.gain.setValueAtTime(soundtrack.masterGain.gain.value, soundtrack.audioCtx.currentTime);
        soundtrack.masterGain.gain.linearRampToValueAtTime(0, soundtrack.audioCtx.currentTime + 1);
        setTimeout(() => {
            soundtrack.audioCtx.suspend();
        }, 1100);
    }
}

// Make toggleSound available globally
window.toggleSound = toggleSound;

// Add a click event listener to the canvas
window.addEventListener('keydown', function (event) {
    // Check if the key pressed is "s" (or "S")
    // if (event.key.toLowerCase() === 's') {
    //     // Convert the renderer's canvas content to a PNG data URL.
    //     const dataURL = renderer.domElement.toDataURL('image/png');
    //     const helpPanel = document.getElementById('help-panel');
    //     const saveHelpPanel = helpPanel.style.opacity
    //     helpPanel.style.opacity = '0'; 
    //     // Create a temporary link element.
    //     const link = document.createElement('a');
    //     link.href = dataURL;
    //     link.download = 'beacon_'+polyname+'.png';

    //     // Append the link, trigger a click to start download, then remove the link.
    //     document.body.appendChild(link);
    //     link.click();
    //     document.body.removeChild(link);
    //     helpPanel.style.opacity = saveHelpPanel
    // }
    // if (event.key.toLowerCase() === 'x') {
    //     if (lastBlock === null) {
            
    //         lastBlock = 735835;
    //     }
    //     burstTime =  clock.getElapsedTime();
    //     lastBlock += 1
        
    //     newBlockEffect(lastBlock)
    // }

    // }
    // if (event.key.toLowerCase() === 'x') {
    //     toggleStealth()
    //     stopAutonomousMode()
    // }
    // if (event.key.toLowerCase() === '+') {
    //     grading[comboindex] += 1;
    // }
    // if (event.key.toLowerCase() === '-') {
    //     grading[comboindex] -= 1;
    // }
    // if (event.key.toLowerCase() === '=') {
    //     console.log(comboindex, combos[comboindex], grading[comboindex])
    // }
    // if (event.key.toLowerCase() === 'q') {
    //     combos.forEach((combo, index) => {
    //         console.log(index, combo, grading[index])
    //     })
    // }

//     if (event.key.toLowerCase() === 'n') {
//         scene.clear()
//         meshes = []
//         setPolyMaterial()
//         comboindex++;
//         if (comboindex >= combos.length) {
//             comboindex = 0;
//         }
//         sequence = combos[comboindex]
//         infoPanel.innerHTML = `
//    <div class='label'>beacon type:  ${sequence}</div>
//    <div class='label'>unique id: ${seed}</div> 
//    <div class='label'>detected faces: ${nbfaces}</div> 
//    <div class='label' id='mode'>monitoring: autonomous</div>
// `;
//         stopAutonomousMode()
//         // scene.background = new THREE.Color(0xffffff);

//         createPolyhedronAndPoints(-2.2, 0, 0, 2, 0) // original size: 3
//         createPolyhedronAndPoints(2.2, 0, 0, 2, 1)
//         setPointsColor()
//         lights = addLights()
//         lightsTwo = addLights()
//         // scene.add(backgroundPlane);
//     }
    if (event.key.toLowerCase() === 'i') {
        stopAutonomousMode()
            movein()  
        }
    if (event.key.toLowerCase() === 'o') {
        stopAutonomousMode()
        moveout()
       
    }

    // if (event.key.toLowerCase() === 'e') {
    //     exportToOBJ(expandedGeometry.vertices, expandedGeometry.faces, 'model.obj');
    // }

 
    // if (event.key.toLowerCase() === 'b') { // toggle background
    //     backgroundPlane.visible = !backgroundPlane.visible
    //     if (!isVR) { scene.background = new THREE.Color(0x000000)}
    // }
   
    // if (event.key.toLowerCase() === 'd') { // darkmode
    //     stopAutonomousMode()
    //     toggleDarkmode()
    // }
    // if (event.key.toLowerCase() === 'g') {
    //     stopAutonomousMode()
    //     toggleAnaglyph()
    //     // if (anaglyph) {
    //     //     // targetCameraPosition = 4
    //     // } else {
    //     //     // targetCameraPosition = 6
    //     // }
    // }

    // if (event.key.toLowerCase() === 'f') {
    //     if (!document.fullscreenElement) {
    //         enterFullscreen();
    //     } else {
    //         exitFullscreen();
    //     }
    // }

    if (event.key.toLowerCase() === 'a') {
        toggleSound();
        
    }
    // if (event.key.toLowerCase() === 'w') {
    //     polyMaterial.wireframe = !polyMaterial.wireframe
    // }
    // if (event.key.toLowerCase() === 'h') {
    //     const helpPanel = document.getElementById('help-panel');
    //     helpPanel.style.opacity = helpPanel.style.opacity === '0.6' ? '0' : '0.6';
    // }
    
});

// fill info panel
const infoPanel = document.getElementById('info-panel');
const helpPanel = document.getElementById('help-panel');
// if ($fx.isPreview) {
//     infoPanel.style.display = 'none';
//     helpPanel.style.display = 'none';
// }

infoPanel.innerHTML = `
   <div class='label'>beacon type:  ${polyname}</div>
    <div class='label'>unique id: ${seed}</div> 
    <div class='label'>detected faces: ${nbfaces}</div> 
<div class='label' id='mode'>monitoring: autonomous</div>
`;
if (isMobile) {
    // infoPanel.style.display = 'none';
    helpPanel.style.display = 'none';
    // infoPanel.style.opacity = '0';
    // helpPanel.style.opacity = '0';
    // document.documentElement.requestFullscreen()
} else {
    setTimeout(() => {
        // infoPanel.style.opacity = '0';
        helpPanel.style.opacity = '0';
    }, 5)
}

// @cursor-bookmark Animation Loop
// Animate

hideLoadingPanel()

const clock = new THREE.Clock()
const initialposition = rand() * 6.28;
// time sync
let serverOffset = 0;

// fetch('/now')
//     .then(res => res.json())
//     .then(({ now }) => {
//         const clientNow = Date.now();
//         serverOffset = clientNow - now;
//         startSyncedLoop();
//     });

// function getSyncedNow() {
//     return Date.now() - serverOffset;
// }
function hashToRandom(n) {
    let x = Math.sin(n) * 10000;
    return x - Math.floor(x); // returns value in [0, 1)
}

const debug = document.getElementById('debug');
debug.style.display = 'none';

// console.log(scene)

// add rectangle for timing cuts
const rectGeometry = new THREE.PlaneGeometry(0.2, 0.2); // width, height
const rectMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
const tempoRect = new THREE.Mesh(rectGeometry, rectMaterial);
tempoRect.position.set(-4.1, -4.3, -1);
tempoRect.visible = false;
scene.add(tempoRect);

// globals for hand gestures

let pinchactive = [false, false];
let swiping = [false, false];
let energyH = [0, 0] // energy build up when swiping horizontally
let energyV = [0, 0] // energy build up when swiping vertically
let rzoomdistance = 0;
let lzoomdistance = 0;
let leftPos, rightPos;
let leftindex, rightindex;
const lineMat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const goalMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const lineGeo = new THREE.CylinderGeometry(0.003,0.003, .001, 8);
const pinchLine = new THREE.Mesh(lineGeo, lineMat);
pinchLine.visible = false;
scene.add(pinchLine);
const pinchGoal = new THREE.Mesh(lineGeo, goalMat);
pinchGoal.visible = false;
scene.add(pinchGoal);

let firstFrame = true; // used to trigger preview

// renderer.toneMapping = THREE.NeutralToneMapping;
// renderer.toneMappingExposure = 0.2;

// BEGIN ANIMATION LOOP
// BEGIN ANIMATION LOOP
// BEGIN ANIMATION LOOP
// BEGIN ANIMATION LOOP

let nebulaIntensityBurst = 0;

renderer.setAnimationLoop((timestamp, xrFrame) => {
    const interval = 30000; // sync every 30 seconds
    const elapsedTime = clock.getElapsedTime()
    const syncedNow = Date.now() - serverOffset;
    const mod = syncedNow % interval;
    const phase = Math.floor(syncedNow / interval);
    const timeSeries = hashToRandom(phase);
    debug.textContent = `mod: ${mod.toFixed(2)} offset: ${serverOffset}ms syncedNow: ${new Date(syncedNow).toISOString()}`;
    if (!autonomousActive) {
        const monitor = document.getElementById('mode');
        let at = autonomousdelay/1000 - Math.floor((Date.now() - countdowntoauto) / 1000)
        monitor.innerHTML = `monitoring: <span style="color: red;">manual ${at}s</span>`
    }
    if (nebulaIntensityBurst > 0.01 && !isVR) { // SHADER EFFECTS if new block 
        quadA.material.uniforms.uNebulaIntensity.value = (1+nebulaIntensityBurst) * nebulaIntensity;
        if (newDifficulty) { quadA.material.uniforms.uTime.value = Math.exp((-elapsedTime + burstTime) / 1); }
        renderer.setRenderTarget(renderTarget)
        renderer.render(sceneA, cameraA)
        renderer.setRenderTarget(null)
        nebulaIntensityBurst *= 0.97;
        if (nebulaIntensityBurst < 0.01) {
            nebulaIntensityBurst = 0;
        }
    }
    // debug.textContent = `${isVR}`;
    // const time = Date.now() * .01;
    pointsShaderMaterial.uniforms.uTime.value = elapsedTime;
    pointsSize += (pointsSizeTarget - pointsSize) * 0.03
    pointsShaderMaterial.uniforms.uSize.value = pointsSize;
    if (isVR) {
        // meshes.forEach(mesh => {
        //     mesh.position.set(0, 1, -5)
        // }) 
        
    } else {
        vrButton.style.display = 'none';
    }
 

    // rotate object
    const damping = 0.1; // lower = slower

    rotation.x += (targetRotation.x - rotation.x) * damping;
    rotation.y += (targetRotation.y - rotation.y) * damping;

    meshes.forEach(mesh => {
        if (!autonomousActive) { mesh.rotation.x += (rotation.x - mesh.rotation.x) * 0.5; }
        mesh.rotation.y = 0.05 * elapsedTime + initialposition+rotation.y;
        if (barrelling && autonomousActive) {
            mesh.rotation.x += (barrellingYgoal - mesh.rotation.x) * 0.03
            rotation.x = mesh.rotation.x;
            targetRotation.x = mesh.rotation.x;
            if (Math.abs(mesh.rotation.x - barrellingYgoal) < 0.01) {
                barrelling = false;
            }
        }
        if (!epoch) { mesh.visible = false; }
        else { mesh.visible = true; }
    });
    // pointsMesh.rotation.y = 0.05 * elapsedTime + initialposition;
    // update lights
    // let lightcounter = 0;
    lights.forEach(light => {
        light.intensity = 1 + Math.sin(elapsedTime * 0.1);
    });
    lightsTwo.forEach(light => {
        light.intensity = 1 + Math.cos(elapsedTime * 0.1);
    });
    // update camera if needed
    if (Math.abs(camera.position.z - targetCameraPosition) > 0.01) {
        camera.position.z += (targetCameraPosition - camera.position.z) * 0.02
    }
// FOR TRAILER PURPOSES ONLY --- COMMENT BEFORE RELEASE
    // if (renderer.info.render.frame % 60 == 0) {
    //     tempoRect.visible = true;
    // } else {
    //     tempoRect.visible = false;
    // }

// END OF TRAILER PURPOSES ONLY --- COMMENT BEFORE RELEASE
    
    // clipping planes
    if (stealthmode) {
        sectionPlane1.constant = 2 - (Date.now() - stealthtime)/500;
        polyMaterial.clippingPlanes = [sectionPlane1, sectionPlane2]
    } else {
        sectionPlane1.constant = (Date.now() - stealthtime) / 500 - 2;
        // polyMaterial.clippingPlanes = []
        if (sectionPlane1.constant > 2) {
            renderer.localClippingEnabled = false;
            pointsShaderMaterial.visible = true;
        } else {
            polyMaterial.clippingPlanes = [sectionPlane1, sectionPlane2]
        }
    }
   
    // Get the reference space from the renderer
    const refSpace = renderer.xr.getReferenceSpace();
    const session = renderer.xr.getSession();
    let found = false;
    
    // look through each input source for hand tracking
    if (session) {
        backgroundPlane.visible = false;
        // move geometries if in VR

        meshes.forEach(mesh => {
            let newPosition = targetMeshPosition * 0.05 + 0.95 * mesh.position.z;
            mesh.position.set(0, 1, newPosition);
        })
        
        // display VR info panel
       sprite.visible = true;
       
        session.inputSources.forEach((inputSource) => {
            let handindex = 0;
            // console.log(inputSource)
            if (inputSource.hand) {
                let indexSphere = null;
                let thumbSphere = null;
                found = true;
                // get the index-finger tip joint space
                const joint1 = inputSource.hand.get('index-finger-tip');
                const joint2 = inputSource.hand.get('thumb-tip');
                if (inputSource.handedness === 'right') {
                    handindex = 1;
                 } else {
                    handindex = 0;
                 }
                if (joint1) {
                    indexSphere = indexSpheres[handindex];
                    // get its pose in world coordinates
                    const pose = xrFrame.getJointPose(joint1, refSpace);
                    if (pose) {
                        let indexspeedy = 0;
                        let indexspeedx = 0;
                        indexSphere.position.set(pose.transform.position.x,pose.transform.position.y,pose.transform.position.z);
                        indexSphere.visible = true;
                        if (handindex == 0) {
                            if (leftindex) {
                                indexspeedy = pose.transform.position.y - leftindex.y;
                                indexspeedx = pose.transform.position.x - leftindex.x;
                            }
                            leftindex = pose.transform.position;
                         }

                       
                        if (handindex == 0 && !swiping[0] && Math.abs(indexspeedy) > 0.04) {
                            swiping[0] = true;
                            if (indexspeedy > 0) {
                                stopAutonomousMode();
                                moveout();
                            } else {
                                stopAutonomousMode();
                                movein();
                            }
                        }
                        if (handindex == 0 && !swiping[0] && Math.abs(indexspeedx) > 0.04) {
                            swiping[0] = true;
                            if (indexspeedx > 0) {
                                stopAutonomousMode();
                                toggleDarkmode();
                            } else {
                                stopAutonomousMode();
                                toggleShields();
                            }
                        }
                        if (handindex == 0 && Math.abs(indexspeedy) < 0.02) {
                            swiping[0] = false;
                        }
                        if (handindex == 0 && Math.abs(indexspeedx) < 0.02) {
                            swiping[0] = false;
                        }
                    }
                }
                if (joint2) {
                    thumbSphere = thumbSpheres[handindex];
                    const pose2 = xrFrame.getJointPose(joint2, refSpace);
                    if (pose2) {
                        thumbSphere.position.set(pose2.transform.position.x, pose2.transform.position.y, pose2.transform.position.z);
                        thumbSphere.visible = true;
                    }
                }
                if (joint1 && joint2) {
                    const pose1 = xrFrame.getJointPose(joint1, refSpace);
                    const pose2 = xrFrame.getJointPose(joint2, refSpace);
                    
                    if (pose1 && pose2) {
                        const dx = pose1.transform.position.x - pose2.transform.position.x;
                        const dy = pose1.transform.position.y - pose2.transform.position.y;
                        const dz = pose1.transform.position.z - pose2.transform.position.z;
                        const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
                        // console.log(distance);
                        if (distance < 0.01 && !pinchactive[handindex]) {
                            // pinch started
                            console.log('pinch', inputSource.handedness);
                            pinchactive[handindex] = true;
                            if (inputSource.handedness === 'left') { // left pinch
                                leftPos = pose1.transform.position.y;
                                lzoomdistance = 0;  
                                // toggleVRbackground();
                                toggleSound();
                            } else { // right pinch
                                rightPos = pose1.transform.position.y;
                                rzoomdistance = 0;
                                pinchLine.scale.y = 0;
                                pinchLine.position.set(pose1.transform.position.x, pose1.transform.position.y, pose1.transform.position.z);
                                pinchLine.visible = true;
                                pinchGoal.position.set(pose1.transform.position.x,pose1.transform.position.y, pose1.transform.position.z);
                                pinchGoal.visible = true;
                            }
                            // witnessSphere.material.color.set(0xff0000);
                            
                        }
                        else if (distance > 0.03) {
                            // pinch released
                            if (handindex==1) { // right pinch released
                                pinchLine.visible = false;
                                pinchGoal.visible = false;
                            }
                            pinchactive[handindex] = false;
                            // witnessSphere.material.color.set(0x0000ff);
                            if (rzoomdistance > .2) {
                                stopAutonomousMode();
                                moveout();
                                rzoomdistance = 0;
                                rightPos = pose1.transform.position.y;

                                // leftIndexSphere.scale.setScalar(0.003);
                                // rightIndexSphere.scale.setScalar(0.003);
                            }
                            if (rzoomdistance < -0.2) {
                                stopAutonomousMode();
                                movein();
                                rzoomdistance = 0;
                                rightPos = pose1.transform.position.y;

                                // leftIndexSphere.scale.setScalar(0.003);
                                // rightIndexSphere.scale.setScalar(0.003);
                            }
                            if (inputSource.handedness === 'left') {
                                lzoomdistance = 0;
                            } else {
                                rzoomdistance = 0;
                            }
                        }
                        if (inputSource.handedness === 'left' && distance < 0.01) {
                            lzoomdistance = leftPos - pose1.transform.position.y;
                         
                        } else if (inputSource.handedness === 'right' && distance < 0.01) {
                            rzoomdistance = rightPos - pose1.transform.position.y;
                            pinchLine.scale.y = 100 * rzoomdistance;
                            pinchGoal.position.y = rightPos - 1*0.01 * Math.sign(rzoomdistance);

                        }
                        
                       
                    }
                }
            }
        });
        if (!found) {
            // hide if no hand/joint this frame
            rightIndexSphere.visible = false;
            rightThumbSphere.visible = false;
            leftIndexSphere.visible = false;
            leftThumbSphere.visible = false;
        }
    }

  


    // Render

    if (anaglyph && !isVR) {
        anaglyphEffect.render(scene, camera)
    } else {
        renderer.render(scene, camera)
    }

    // sync action

    if (mod < 500 && !barrelling) {
        setTimeout(initBarrelling(timeSeries), 2000);
    }




});

// END ANIMATION LOOP// END ANIMATION LOOP// END ANIMATION LOOP
// END ANIMATION LOOP// END ANIMATION LOOP// END ANIMATION LOOP
// END ANIMATION LOOP// END ANIMATION LOOP// END ANIMATION LOOP
// END ANIMATION LOOP// END ANIMATION LOOP// END ANIMATION LOOP





function initBarrelling(phase) {
    if (barrelling || isDragging || !autonomousActive) {
        return;
    }
    else {
        // const prng = simplePRNG(syncedNow)
        barrelling = true;
        // barrellingYgoal = Math.floor(rand() * 9) - 4;  
        barrellingYgoal = Math.floor(phase * 9) - 4;
        // console.log(r)
        // setTimeout(initBarrelling, 30000);
        
    }
}

// setTimeout(initBarrelling, 20000);



window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

    // Update points shader material
    pointsShaderMaterial.uniforms.uResolution.value = window.innerHeight;
})


document.addEventListener('visibilitychange', async () => {
    if (document.visibilityState === 'visible') {
        const currentBlock = await getBlock();
        lastBlock = currentBlock;
        // lastUpdateTime = Date.now();
        // console.log('[Focus restored] Syncing block height to', currentBlock);
    }
});

let newDifficulty = false;
function newBlockEffect(thisBlock) {
    newDifficulty = false;
    epoch = Math.floor(thisBlock / 2016)
    if (thisBlock % 2016 == 0) {
        newDifficulty = true;
        console.log("new difficulty epoch, block", thisBlock);
        console.log("epoch", epoch)
        setBackground(epoch)
    };

    // quadA.material.uniforms.uSeed.value = currentBlock;
    
    // const newstarField = makeGalaxy(4096, 2048)
    // const newtex = new THREE.CanvasTexture(newstarField);
    // quadA.material.uniforms.uTexture.value = newtex
    // initGalaxies()
    // quadA.material.uniforms.uGalaxyPositions.value = galaxyPositions
    // quadA.material.uniforms.uGalaxySizes.value = galaxySizes
    // quadA.material.uniforms.uGalaxyRotations.value = galaxyRotations
    if (!isVR) {
        quadA.material.uniforms.uTexture.value = tex
        quadA.material.uniforms.uThreshold.value = 0.7;
        quadA.material.uniforms.uIntensity.value = 1;
        quadA.material.uniforms.uTextureType.value = 0
        quadA.material.uniforms.uNebulaIntensity.value = 50 * nebulaIntensity;
        nebulaIntensityBurst = 100;
        renderer.setRenderTarget(renderTarget)
        renderer.render(sceneA, cameraA)
        renderer.setRenderTarget(null) // trigger new block animation
        console.log("new block", thisBlock)
        if (playingaudio) soundtrack.playChime()
    }
}
