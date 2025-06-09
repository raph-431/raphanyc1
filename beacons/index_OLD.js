

import * as THREE from 'three' 
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
// import { AnaglyphEffect } from 'three/examples/jsm/effects/AnaglyphEffect.js';
// import { OrbitControls } from './addons/OrbitControls.js'
import { AnaglyphEffect } from './addons/AnaglyphEffect.js';
import * as soundtrack from './soundtrack.js'
import {
    initCube, initTetrahedron, initTorus, initSphere, expansion, createGeometryFromFaces,
    makeEdges, createStarField } from './expansionUtils.js'
import vertexShader from './vertex.js'
import fragmentShader from './fragment.js'

// shortcuts
let rand = Math.random

// global audio
let playingaudio = false
// let hashseed = $fx.iteration;
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
// seed = $fx.iteration
console.log(seed)
let bestcombos = []
let bestcombostext = '['
let combinations = []
let polyname;
let combos = []

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
    // combo = stringToType('AABaFJB')
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
    opacity: .6,
    metalness:  0.7,
    roughness: 0.3, //0.1,
    refractionRatio: 0.98,
    side: THREE.DoubleSide,
    polygonOffset: true,
    // // Factor and units control the depth offset.
    // // Experiment with these values to see what works best for your scene.
    polygonOffsetFactor: 1,  // How much to offset based on the slope of the polygon.
    polygonOffsetUnits: 1,    // Constant offset added to the depth.
    // wireframe: true,
})
function setPolyMaterial() {
    // polyMaterial.metalness = 0.6 + rand() * 0.1;
    // polyMaterial.roughness = 0.4 + rand() * 0.2;
    // polyMaterial.color.setHex((0.9 + rand() * 0.1) * 0xffffff);
    // polyMaterial.roughness = 0
    // polyMaterial.metalness = 1
}

setPolyMaterial()
const polyMetalness = polyMaterial.metalness
const polyRoughness = polyMaterial.roughness

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



// Camera
const camera = new THREE.PerspectiveCamera(65, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 6
camera.focus = 10
let targetCameraPosition = 6
scene.add(camera)

// Controls
// const controls = new OrbitControls(camera, canvas)
// controls.enableDamping = true

// Renderer
const renderer = new THREE.WebGLRenderer({preserveDrawingBuffer: true})
renderer.canvas = canvas

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
        const helpPanel = document.getElementById('help-panel');
        const saveHelpPanel = helpPanel.style.opacity
        helpPanel.style.opacity = '0';
        // Create a temporary link element.
        const link = document.createElement('a');
        link.href = dataURL;
        link.download = 'expansions'+polyname+seed+'.png';

        // Append the link, trigger a click to start download, then remove the link.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        helpPanel.style.opacity = saveHelpPanel
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
            pointsShaderMaterial.uniforms.uSize.value = 15
            // camera.lookAt(0,0,-6)
        }
    if (event.key.toLowerCase() === 'o') {
        targetCameraPosition = 6
        camera.focus = 10
        pointsShaderMaterial.uniforms.uSize.value = 20
        // camera.lookAt(0,0,0)
    }
    if (event.key.toLowerCase() === 'p') {
        targetCameraPosition = 3
        camera.focus = 1
        pointsShaderMaterial.uniforms.uSize.value = 10
        // camera.lookAt(0,0,0)
    }
    if (event.key.toLowerCase() === 'b') { // toggle background
        backgroundPlane.visible = !backgroundPlane.visible
    }
    if (event.key.toLocaleLowerCase() === 'q') {
        polyMaterial.opacity = polyMaterial.opacity === '0.6' ? '1' : '0.6';
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
                polyMaterial.metalness = polyMetalness
                polyMaterial.roughness = polyRoughness
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
    if (event.key.toLowerCase() === 'w') {
        polyMaterial.wireframe = !polyMaterial.wireframe
    }
    if (event.key.toLowerCase() === 'h') {
        const helpPanel = document.getElementById('help-panel');
        helpPanel.style.opacity = helpPanel.style.opacity === '0.6' ? '0' : '0.6';
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
    // controls.update()
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
        soundtrack.scheduleMorseTransmission();
    }
}

setTimeout(initBarrelling, 20000);



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
})


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