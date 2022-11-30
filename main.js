import * as THREE from 'three';
import { OBJLoader } from './OBJLoader.js';
import { MTLLoader } from './MTLLoader.js';
import { OrbitControls } from './OrbitControls.js';
import { Mesh } from 'three';

function main() {
    const canvas = document.getElementById('c');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });

    renderer.setSize(600, 300);

    // 'frustum' defined by the four settings,
    // a pyramid-like 3d shape w/ no tip.
    // Anything inside the defined frustum will be be drawn.
    // Anything outside will not.

    // camera frustum
    const fov = 90;
    // default canvas = 300x150px, aspect = 300/150 || 2.
    const aspect = 2;
    const near = 0.01;
    const far = 100;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    camera.position.set(0, 10, 30);

    // Scene
    const scene = new THREE.Scene();

    // Orbit Controls
    const controls = new OrbitControls(camera, canvas);
    controls.target.set(0, 5, 0);
    controls.update();

    // Ground Plane
    const planeSize = 40;
    const loader = new THREE.TextureLoader();
    const texture = loader.load('./checker.png');
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

    {
        const color = 0xFFFFFF;
        const intensity = 2;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

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
    function makeDiceInstance(geometry, color, x) {
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
            cubes.push(cube)
        }

        loadManager.onProgress = (urlOfLastItemLoaded, itemsLoaded, itemsTotal) => {
            const progress = itemsLoaded / itemsTotal;
            progressBarElem.style.transform = `scaleX(${progress})`;
        };
    }

    const dice = [
        makeDiceInstance(geometry, 0x44aa88, 0),
        makeDiceInstance(geometry, 0xaa8844, -2),
        makeDiceInstance(geometry, 0xaa4488, 2),
    ];

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
        
        const sphereRadius = 3;
        const sphereWidthDivisions = 32;
        const sphereHeightDivisions = 16;
        const sphereGeo = new THREE.SphereGeometry(sphereRadius, sphereWidthDivisions, sphereHeightDivisions);
        const sphereMat = new THREE.MeshPhongMaterial({color: '#CA8'});
        
        mesh.position.set(cubeSize + 1, cubeSize / 2, 0);
        scene.add(mesh);
        
        mesh = new Mesh(sphereGeo, sphereMat);
        mesh.position.set(-sphereRadius - 1, sphereRadius + 2, 0);
        scene.add(mesh);
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








main();