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

function main() {
    const canvas = document.getElementById('c');
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });

    renderer.setSize(600, 300);

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

    // Orbit Controls
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 0, 0);
    controls.update();

    scene.add(camera);

    // Background
    // let loader = new THREE.TextureLoader();
    // const bgTexture = loader.load('./sky.png');
    // scene.background = bgTexture;

    // Cube Texture 
    // {
    //     let loader = new THREE.CubeTextureLoader();
    //     let texture = loader.load([
    //         './sky.png', 
    //         './sky.png', 
    //         './sky.png', 
    //         './sky.png', 
    //         './sky.png', 
    //         './sky.png'
    //     ]);
    //     scene.background = texture;
    // }

    // 360 photo texture
    {
        const loader = new THREE.TextureLoader();
        const texture = loader.load(
            './dining_room.png',
            () => {
                const rt = new THREE.WebGLCubeRenderTarget(texture.image.height);
                rt.fromEquirectangularTexture(renderer, texture);
                scene.background = rt.texture;
            });
    }

    // Ground Plane
    const loader = new THREE.TextureLoader();
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
    const mesh = new THREE.Mesh(planeGeo, planeMat);
    mesh.rotation.x = Math.PI * -0.5;
    scene.add(mesh);

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
        room: null
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
    makeDiceInstance(geometry, 0xaa4488, 2,3, 4);

    makeDiceInstance(geometry, 0x44aa88, 4,3, 4);
    makeDiceInstance(geometry, 0xaa8844, -4,3, 4);

    makeDiceInstance(geometry, 0xaa4488, 6,3, 4);
    makeDiceInstance(geometry, 0x4488aa, -6,3, 4);

    makeDiceInstance(geometry, 0xaa4488, 8,3, 4);
    makeDiceInstance(geometry, 0x4488aa, -8,3, 4);


    makeDiceInstance(geometry, 0x44aa88, 0, 3, -4);
    makeDiceInstance(geometry, 0xaa8844, -2, 3, -4);
    makeDiceInstance(geometry, 0xaa4488, 2,3, -4);

    makeDiceInstance(geometry, 0x44aa88, 4,3, -4);
    makeDiceInstance(geometry, 0xaa8844, -4,3, -4);

    makeDiceInstance(geometry, 0xaa4488, 6,3, -4);
    makeDiceInstance(geometry, 0x4488aa, -6,3, -4);

    makeDiceInstance(geometry, 0xaa4488, 8,3, -4);
    makeDiceInstance(geometry, 0x4488aa, -8,3, -4);

    // loading an obj file
    {
        const objLoader = new OBJLoader();
        const mtlLoader = new MTLLoader();
        mtlLoader.load('../Skull_v3/Skull_v3.mtl', (mtl) => {
            mtl.preload();

            for (const material of Object.values(mtl.materials)) {
                material.side = THREE.DoubleSide;
            }

            objLoader.setMaterials(mtl);
            objLoader.load('../Skull_v3/Skull_v3.obj', (obj) => {
                scene.add(obj);
                sceneGraph.room = obj;
            });
        });
    }

    // Lighting - add Cube and Sphere
    {
        const cubeSize = 4;
        const cubeGeo = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
        const cubeMat = new THREE.MeshPhongMaterial({ color: '#8AC' });
        let mesh = new THREE.Mesh(cubeGeo, cubeMat);

        mesh.position.set(cubeSize + 12, cubeSize / 2, 0);
        scene.add(mesh);

        const rectSize = 5;
        const rectGeo = new THREE.BoxGeometry(rectSize, rectSize / 2, rectSize);
        const rectMat = new THREE.MeshPhongMaterial({ color: '#4DC' });
        mesh = new THREE.Mesh(rectGeo, rectMat);

        mesh.position.set(rectSize + 1, rectSize / 2, 10);
        scene.add(mesh);

        const sphereRadius = 3;
        const sphereWidthDivisions = 32;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        const sphereMat = new THREE.MeshPhongMaterial({ color: '#CA8' });

        mesh = new Mesh(sphereGeo, sphereMat);
        mesh.position.set(-sphereRadius - 10, sphereRadius + 2, 0);
        scene.add(mesh);

        const geometry = new THREE.CylinderGeometry(0, 5, 10, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x445500 });
        const cylinder = new THREE.Mesh(geometry, material);
        cylinder.position.set(10, 5, -5)
        scene.add(cylinder);
    }

    {
        const color = 0xFFFFFF;
        const intensity = 2;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    // Lighting 
    {
        // Ambient light
        const color = 0x446677;
        let intensity = 0.5;
        let light = new THREE.AmbientLight(color, intensity);
        scene.add(light);

        // GUI controls
        // Ambient
        const gui = new GUI();
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('Ambient Light');
        gui.add(light, 'intensity', 0, 2, 0.01);


        // Hemisphere light
        const skyColor = 0xB1E1FF;      // light blue
        const groundColor = 0xB97A20;   // brownish orange
        light = new THREE.HemisphereLight(skyColor, groundColor, intensity);
        scene.add(light);

        // Hemisphere
        gui.addColor(new ColorGUIHelper(light, 'color'), 'value').name('Hem - Sky Light');
        gui.addColor(new ColorGUIHelper(light, 'groundColor'), 'value').name('Hem - Floor Light');
        gui.add(light, 'intensity', 0, 2, 0.01);

        // Directional light
        const dirColor = 0xFFFFFF;
        intensity = .2;
        light = new THREE.DirectionalLight(dirColor, intensity);
        light.position.set(0, 10, 0);
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
    }



    function render(time) {
        time *= 0.001;

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.5;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        if (sceneGraph.room) {
            sceneGraph.room.rotation.y = time * 0.5;
            sceneGraph.room.position.y = -7;
            sceneGraph.room.position.y = -7;
        }


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
