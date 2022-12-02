import * as THREE from 'three';
import { Mesh } from 'three';
import { OBJLoader } from './OBJLoader.js';
import { MTLLoader } from './MTLLoader.js';
import { OrbitControls } from './OrbitControls.js';
import GUI from 'https://cdn.jsdelivr.net/npm/lil-gui@0.17/+esm';


class ColorGUIHelper {
    constructor(object, prop) {
        this.object = object;
        this.prop = prop;
    }
    get value() {
        return `#${this.object[this.prop].getHexString()}`;
    }
    set value(hexString) {
        this.object[this.prop].set(hexString);
    }
}

class DimensionGUIHelper {
    constructor(obj, minProp, maxProp) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
    }
    get value() {
        return this.obj[this.maxProp] * 2;
    }
    set value(v) {
        this.obj[this.maxProp] = v / 2;
        this.obj[this.minProp] = v / -2;
    }
}

class MinMaxGUIHelper {
    constructor(obj, minProp, maxProp, minDif) {
        this.obj = obj;
        this.minProp = minProp;
        this.maxProp = maxProp;
        this.minDif = minDif;
    }
    get min() {
        return this.obj[this.minProp];
    }
    set min(v) {
        this.obj[this.minProp] = v;
        this.obj[this.maxProp] = Math.max(this.obj[this.maxProp], v + this.minDif);
    }
    get max() {
        return this.obj[this.maxProp];
    }
    set max(v) {
        this.obj[this.maxProp] = v;
        this.min = this.min;  // this will call the min setter
    }
}

// We use this class to pass to lil-gui
// so when it manipulates near or far
// near is never > far and far is never < near
class FogGUIHelper {
    constructor(fog, backgroundColor) {
        this.fog = fog;
        this.backgroundColor = backgroundColor;

    }
    get near() {
        return this.fog.near;
    }
    set near(v) {
        this.fog.near = v;
        this.fog.far = Math.max(this.fog.far, v);
    }
    get far() {
        return this.fog.far;
    }
    set far(v) {
        this.fog.far = v;
        this.fog.near = Math.min(this.fog.near, v);
    }
    get color() {
        return `#${this.fog.color.getHexString()}`;
    }
    set color(hexString) {
        this.fog.color.set(hexString);
        this.backgroundColor.set(hexString);
    }
}

function main() {
    const canvas = document.getElementById('c');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.shadowMap.enabled = true;
    renderer.setSize(600, 300);
    const gui = new GUI();

    // 'frustum' defined by the four settings,
    // a pyramid-like 3d shape w/ no tip.
    // Anything inside the defined frustum will be be drawn.
    // Anything outside will not.

    // camera frustum
    const fov = 90;
    // default canvas = 300x150px, aspect = 300/150 || 2.
    const aspect = 2;
    const near = 0.1;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(0, 10, 30);

    // Scene
    const scene = new THREE.Scene();

    // Fog
    {
        const near = 1;
        const far = 20;
        const color = 0xc7e7ff;
        scene.fog = new THREE.Fog(color, near, far);
        scene.background = new THREE.Color(color);

        const fogGUIHelper = new FogGUIHelper(scene.fog);
        gui.add(fogGUIHelper, 'near', near, far).listen();
        gui.add(fogGUIHelper, 'far', near, far).listen();
        gui.addColor(fogGUIHelper, 'color');
    }

    // Orbit Controls
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    scene.add(camera);

    // 360 photo texture
    let loader = new THREE.TextureLoader();
    {
        const texture = loader.load(
            './dining_room.png',
            () => {
                const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
                rt.fromEquirectangularTexture(renderer, texture);
                scene.background = rt.texture;
            });
    }

    // Ground Plane
    const texture = loader.load('./checker.png');
    const planeSize = 40;
    const repeats = planeSize / 2;

    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.magFilter = THREE.NearestFilter;
    texture.repeat.set(repeats, repeats);

    const planeGeo = new THREE.PlaneGeometry(planeSize, planeSize);
    const planeMat = new THREE.MeshPhongMaterial({
        map: texture,
        side: THREE.DoubleSide,
    });

    planeMat.color.setRGB(1.5, 1.5, 1.5);

    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.receiveShadow = true;
    mesh.rotation.x = Math.PI * -0.5;
    mesh.position.z = -7;
    scene.add(mesh);

    // Shadow
    const shadowTexture = loader.load('./round_shadow.png');
    const sphereShadowBases = [];
    const sphereRadius = 1;
    const sphereWidthDivisions = 32;
    const sphereHeightDivisions = 16;
    const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
    const shadowPlaneSize = 1;
    const shadowGeo = new THREE.PlaneGeometry(shadowPlaneSize, shadowPlaneSize);
    const numSpheres = 15;

    for (let i = 0; i < numSpheres; ++i) {
        // make a base for the shadow and the sphere
        // so they move together.
        const base = new THREE.Object3D();
        scene.add(base);

        // add the shadow to the base
        // note: we make a new material for each sphere
        // so we can set that sphere's material transparency
        // separately.
        const shadowMat = new THREE.MeshBasicMaterial({
            map: shadowTexture,
            transparent: true,    // so we can see the ground
            depthWrite: false,    // so we don't have to sort
        });
        const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
        shadowMesh.position.y = 0.001;  // so we're above the ground slightly
        shadowMesh.rotation.x = Math.PI * -.5;
        const shadowSize = sphereRadius * 4;
        shadowMesh.scale.set(shadowSize, shadowSize, shadowSize);
        base.add(shadowMesh);

        // add the sphere to the base
        const u = i / numSpheres;   // goes from 0 to 1 as we iterate the spheres.
        const sphereMat = new THREE.MeshPhongMaterial();
        sphereMat.color.setHSL(u, 1, .75);
        const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
        sphereMesh.position.set(0, sphereRadius + 2, 0);
        base.add(sphereMesh);

        // remember all 3 plus the y position
        sphereShadowBases.push({ base, sphereMesh, shadowMesh, y: sphereMesh.position.y });
    }

    // Box Geometry
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    // for slower connnections, display a loading progress bar
    const loadingElem = document.querySelector('#loading');
    const progressBarElem = loadingElem.querySelector('.progressbar');

    // "scene graph"
    let sceneGraph = {
        cubes: [],
        skull: null
    }

    // create's an instance of a cube, using six distinct imgs
    let cubes = sceneGraph.cubes;
    function makeDiceInstance(geometry, color, x, y, z) {
        const loadManager = new THREE.LoadingManager();
        const loader = new THREE.TextureLoader(loadManager);

        const materials = [
            new THREE.MeshPhongMaterial({ map: loader.load('img/flower-1.jpg') }),
            new THREE.MeshPhongMaterial({ map: loader.load('img/flower-2.jpg') }),
            new THREE.MeshPhongMaterial({ map: loader.load('img/flower-3.jpg') }),
            new THREE.MeshPhongMaterial({ map: loader.load('img/flower-4.jpg') }),
            new THREE.MeshPhongMaterial({ map: loader.load('img/flower-5.jpg') }),
            new THREE.MeshPhongMaterial({ map: loader.load('img/flower-6.jpg') })
        ]

        loadManager.onLoad = () => {
            loadingElem.style.display = 'none';
            const cube = new THREE.Mesh(geometry, materials);
            scene.add(cube); // add Mesh to Scene
            cube.position.x = x;
            cube.position.y = y;
            cube.position.z = z;
            cubes.push(cube)
        }

        loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
            const progress = itemsLoaded / itemsTotal;
            progressBarElem.style.transform = `scaleX(${progress})`;
        };
    }


    makeDiceInstance(geometry, 0x44aa88, 0, 3, 4);
    makeDiceInstance(geometry, 0xaa8844, -2, 3, 4);
    makeDiceInstance(geometry, 0xaa4488, 2, 3, 4);

    makeDiceInstance(geometry, 0x44aa88, 4, 3, 4);
    makeDiceInstance(geometry, 0xaa8844, -4, 3, 4);

    makeDiceInstance(geometry, 0xaa4488, 6, 3, 4);
    makeDiceInstance(geometry, 0x4488aa, -6, 3, 4);

    makeDiceInstance(geometry, 0xaa4488, 8, 3, 4);
    makeDiceInstance(geometry, 0x4488aa, -8, 3, 4);


    makeDiceInstance(geometry, 0x44aa88, 0, 3, -4);
    makeDiceInstance(geometry, 0xaa8844, -2, 3, -4);
    makeDiceInstance(geometry, 0xaa4488, 2, 3, -4);

    makeDiceInstance(geometry, 0x44aa88, 4, 3, -4);
    makeDiceInstance(geometry, 0xaa8844, -4, 3, -4);

    makeDiceInstance(geometry, 0xaa4488, 6, 3, -4);
    makeDiceInstance(geometry, 0x4488aa, -6, 3, -4);

    makeDiceInstance(geometry, 0xaa4488, 8, 3, -4);
    makeDiceInstance(geometry, 0x4488aa, -8, 3, -4);

    // loading an obj file
    {
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        mtlLoader.load('./Skull_v3/Skull_v3.mtl', (mtl) => {
            mtl.preload();

            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }

            objLoader.setMaterials(mtl);
            objLoader.load('./Skull_v3/Skull_v3.obj', (obj) => {
                scene.add(obj);
                sceneGraph.skull = obj;
            });
        });
    }

    // Lighting - add Cube and Sphere
    {
        const cubeSize = 4;
        const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
        let mesh = new THREE.Mesh(cubeGeo, cubeMat);

        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(cubeSize + 12, cubeSize / 2, 0);
        scene.add(mesh);

        const rectSize = 5;
        const rectGeo = new THREE.BoxGeometry(rectSize, rectSize / 2, rectSize);
        const rectMat = new THREE.MeshPhongMaterial({ color: '#4DC' });

        mesh = new THREE.Mesh(rectGeo, rectMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(rectSize + 1, rectSize / 2, 10);
        scene.add(mesh);

        const sphereRadius = 3;
        const sphereWidthDivisions = 32;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });

        mesh = new Mesh(sphereGeo, sphereMat);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.position.set(-sphereRadius - 10, sphereRadius + 2, 0);
        scene.add(mesh);

        const geometry = new THREE.CylinderGeometry(0, 5, 10, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x445500 });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.castShadow = true;
        cylinder.receiveShadow = true;
        cylinder.position.set(10, 5, -5)
        scene.add(cylinder);
    }

    // Lighting 
    {
        // Ambient light
        const color = 0x446677;
        let intensity = 1;
        let light = new THREE.AmbientLight(color, intensity);
        scene.add(light);

        // Ambient
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('Ambient Light');
        gui.add(light, 'intensity', 0, 2, 0.01);

        // Hemisphere light
        const skyColor = 0xB1E1FF;      // light blue
        const groundColor = 0xB97A20;   // brownish orange
        intensity = 1;
        light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);

        // Hemisphere
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('Hem - Sky Light');
        gui.addColor(new ColorGUIHelper(light, 'groundColor'), 'value').name('Hem - Floor Light');
        gui.add(light, 'intensity', 0, 2, 0.01);

        // Directional light
        const dirColor = 0xFFFFFF;
        light = new THREE.DirectionalLight(dirColor, intensity);
        light.castShadow = true;
        light.position.set(0, 10, 5);
        light.target.position.set(-5, 0, 0);
        scene.add(light);
        scene.add(light.target);

        const helper = new THREE.DirectionalLightHelper(light);
        scene.add(helper);

        // Directional
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('Directional Light');
        gui.add(light, 'intensity', 0, 2, 0.01);
        gui.add(light.target.position, 'x', -10, 10);
        gui.add(light.target.position, 'z', -10, 10);
        gui.add(light.target.position, 'y', 0, 10);

        updateLight(light, helper);

        makeXYZGUI(gui, light.position, 'position', updateLight);
        makeXYZGUI(gui, light.target.position, 'target', updateLight);

        const updateCamera = () => {
            // update the light target's matrixWorld because it's needed by the helper
            light.target.updateMatrixWorld();
            helper.update();
            // update the light's shadow camera's projection matrix
            light.shadow.camera.updateProjectionMatrix();
            // and now update the camera helper we're using to show the light's shadow camera
            cameraHelper.update();
        }

        {
            const folder = gui.addFolder('Shadow Camera');
            folder.open();
            folder.add(new DimensionGUIHelper(light.shadow.camera, 'left', 'right'), 'value', 1, 100)
                .name('width')
                .onChange(updateCamera);
            folder.add(new DimensionGUIHelper(light.shadow.camera, 'bottom', 'top'), 'value', 1, 100)
                .name('height')
                .onChange(updateCamera);
            const minMaxGUIHelper = new MinMaxGUIHelper(light.shadow.camera, 'near', 'far', 0.1);
            folder.add(minMaxGUIHelper, 'min', 0.1, 50, 0.1).name('near').onChange(updateCamera);
            folder.add(minMaxGUIHelper, 'max', 0.1, 50, 0.1).name('far').onChange(updateCamera);
            folder.add(light.shadow.camera, 'zoom', 0.01, 1.5, 0.01).onChange(updateCamera);
        }
    }



    function render(time) {
        time *= 0.001;

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.5;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        if (sceneGraph.skull) {
            sceneGraph.skull.rotation.x = -90
            sceneGraph.skull.position.y = 0;
            sceneGraph.skull.position.z = -15;
            sceneGraph.skull.scale.x = 0.6;
            sceneGraph.skull.scale.y = 0.6;
            sceneGraph.skull.scale.z = 0.6;
        }

        // shadow
        sphereShadowBases.forEach((sphereShadowBase, ndx) => {
            const { base, sphereMesh, shadowMesh, y } = sphereShadowBase;

            // u is a value that goes from 0 to 1 as we iterate the spheres
            const u = ndx / sphereShadowBases.length;

            // compute a position for the base. This will move
            // both the sphere and its shadow
            const speed = time * .2;
            const angle = speed + u * Math.PI * 2 * (ndx % 1 ? 1 : -1);
            const radius = Math.sin(speed - ndx) * 10;
            base.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);

            // yOff is a value that goes from 0 to 1
            const yOff = Math.abs(Math.sin(time * 2 + ndx));
            // move the sphere up and down
            sphereMesh.position.y = y + THREE.MathUtils.lerp(-2, 2, yOff);
            // fade the shadow as the sphere goes up
            shadowMesh.material.opacity = THREE.MathUtils.lerp(1, .25, yOff);
        });

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}

function makeXYZGUI(gui, vector3, name, onChangeFn) {
    const folder = gui.addFolder(name);
    folder.add(vector3, 'x', -10, 10).onChange(onChangeFn);
    folder.add(vector3, 'y', 0, 10).onChange(onChangeFn);
    folder.add(vector3, 'z', -10, 10).onChange(onChangeFn);
    folder.open();
}


function updateLight(light, helper) {
    light.target.updateMatrixWorld();
    helper.update();
}

// ====================================

main();
