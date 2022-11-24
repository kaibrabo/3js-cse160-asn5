import * as THREE from 'three';

function main() {
    const canvas = document.getElementById('c');
    const renderer = new THREE.WebGLRenderer({ canvas });

    // 'frustum' defined by the four settings,
    // a pyramid-like 3d shape w/ no tip.
    // Anything inside the defined frustum will be be drawn.
    // Anything outside will not.

    // camera frustum
    const fov = 105;
    // default canvas = 300x150px, aspect = 300/150 || 2.
    const aspect = 2;
    const near = 0.1;
    const far = 5;
    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    // Scene
    const scene = new THREE.Scene();

    // Box Geometry
    const boxWidth = 1;
    const boxHeight = 1;
    const boxDepth = 1;
    const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);

    camera.position.z = 2;

    {
        const color = 0xFFFFFF;
        const intensity = 2;
        const light = new THREE.DirectionalLight(color, intensity);
        light.position.set(-1, 2, 4);
        scene.add(light);
    }

    // function makeCubeInstance(geometry, color, texture, x) {
    //     const material = new THREE.MeshPhongMaterial({ 
    //         color,
    //         map: texture
    //     });
    //     const cube = new THREE.Mesh(geometry, material);
        
    //     scene.add(cube); // add Mesh to Scene
        
    //     cube.position.x = x;
        
    //     return cube;
    // }
    

    
    // function makeTexture(texture) {
    //     const loader = new THREE.TextureLoader();
    //     return loader.load(texture);
    // }
    
    // const cubes = [
        //     makeCubeInstance(geometry, 0x44aa88, makeTexture('wall.jpg'), 0),
        //     makeCubeInstance(geometry, 0xaa8844, makeTexture('wall.jpg'), -2),
        //     makeCubeInstance(geometry, 0xaa4488, makeTexture('wall.jpg'), 2),
    // ];

    // const cubes = [
    //     makeCubeInstance(geometry, 0x44aa88, 0),
    //     makeCubeInstance(geometry, 0xaa8844, -2),
    //     makeCubeInstance(geometry, 0xaa4488, 2),
    // ];

    const loadingElem = document.querySelector('#loading');
    const progressBarElem = loadingElem.querySelector('.progressbar');

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
        
        // return cube;
    }

    let cubes = [];
        
    const dice = [
        makeDiceInstance(geometry, 0x44aa88, 0),
        makeDiceInstance(geometry, 0xaa8844, -2),
        makeDiceInstance(geometry, 0xaa4488, 2),
    ];

    function render(time) {
        time *= 0.001;

        cubes.forEach((cube, ndx) => {
            const speed = 1 + ndx * 0.5;
            const rot = time * speed;
            cube.rotation.x = rot;
            cube.rotation.y = rot;
        });

        // dice.forEach((di, ndx) => {
        //     const speed = 1 + ndx * 0.5;
        //     const rot = time * speed;
        //     di.rotation.x = rot;
        //     di.rotation.y = rot;
        // })

        renderer.render(scene, camera);

        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}








main();