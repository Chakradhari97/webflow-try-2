import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import * as dat from 'lil-gui'
import gsap from 'gsap'
import { FlatShading } from 'three'

/**
 * Base
 */
// Debug
//const gui = new dat.GUI()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color(0x00ffff)

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const front = textureLoader.load('./textures/white.png')
const back = textureLoader.load('./textures/black.png')

/**
 * Object
 */

const geometry = new THREE.SphereBufferGeometry(.5, 30, 30)
const material = new THREE.MeshBasicMaterial({color: 0x00ffff})
const sphere = new THREE.Mesh(geometry, material)
material.wireframe = true
//scene.add(sphere)
//Texture

const photoRibbon = [front, back].forEach(t =>{
    t.wrapS = 1000;
    t.wrapT = 1000;
    t.repeat.set(1,1);
    t.offset.setX(0.5)
    t.flipY = false
})

back.repeat.set(-1,1)

let frontMaterial = new THREE.MeshStandardMaterial({
    map: front,
    side: THREE.BackSide,
    roughness: 0.65,
    metalness: 0.25,
    alphaTest: true,
    flatShading: true
}) 
let backMaterial = new THREE.MeshStandardMaterial({
    map: back,
    side: THREE.FrontSide,
    roughness: 0.65,
    metalness: 0.25,
    alphaTest: true,
    flatShading: true
}) 

//Curve

let  num = 7;
let curvePoints = []
for (let i = 0; i < num; i++) {

    let theta = i/num * Math.PI * 2
    curvePoints.push(
        new THREE.Vector3().setFromSphericalCoords(
            1, Math.PI / 2 + 0.9*(Math.random() - 0.5), theta
        )
    )
    
}

const curve = new THREE.CatmullRomCurve3( curvePoints );
curve.tension = 1
curve.closed = true

const points = curve.getPoints( 50 );
const geometry1= new THREE.BufferGeometry().setFromPoints( points );

const material1 = new THREE.LineBasicMaterial( { color: 0xff0000 } );

// Create the final object to add to the scene
const curveObject = new THREE.Line( geometry1, material1 );

//scene.add(curveObject)

let number = 1000

let fernetFrames = curve.computeFrenetFrames(number, true)
let spacedPoints = curve.getSpacedPoints(number)
const tempPlane = new THREE.PlaneBufferGeometry(1, 1, number, 1)
let dimensions = [-.15,0,.15]


let materials = [frontMaterial, backMaterial]

tempPlane.addGroup(0, 6000, 0)
tempPlane.addGroup(0, 6000, 1)

let point = new THREE.Vector3()
let binormalShift = new THREE.Vector3()

let finalPoints = []

dimensions.forEach(d=> {
    for (let i = 0; i <= number; i++) {
        point = spacedPoints[i]
        binormalShift.add(fernetFrames.binormals[i]).multiplyScalar(d)
        
        finalPoints.push(new THREE.Vector3().copy(point).add(binormalShift).normalize())
    }
})

finalPoints[0].copy(finalPoints[number])
finalPoints[number+1].copy(finalPoints[2*number+1])

tempPlane.setFromPoints(finalPoints)

const tempMaterial = new THREE.MeshBasicMaterial({color: 0x0000ff, wireframe: true})
const finalMesh = new THREE.Mesh(tempPlane, materials)


scene.add(finalMesh)

/**
 * Sizes
 */
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

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
camera.position.z = 2
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Light
 */

const ambientLight = new THREE.AmbientLight(0xffffff, 0.86)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff,1)
directionalLight.position.set(0, -5, 5)
scene.add(directionalLight)

const help = new THREE.DirectionalLightHelper(directionalLight)
//scene.add(help)
/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()

const tick = () =>
{
    const elapsedTime = clock.getElapsedTime()

    //Update Object
    materials.forEach((m,i)=> {
        m.map.offset.setX(elapsedTime * 0.05)
        if(i>0){
            m.map.offset.setX(-elapsedTime * 0.05)
        }
    })
    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()