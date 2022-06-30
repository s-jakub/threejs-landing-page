import * as THREE from "three";
// import * as dat from "dat.gui";
import gsap, { CSSPlugin, Power4 } from "gsap";
import CSSRulePlugin from "gsap/CSSRulePlugin";
import vertexShader from "./shaders/vertex.glsl";
import fragmentShader from "./shaders/fragment.glsl";

import earth from "./assets/earth.jpg";

gsap.registerPlugin(CSSPlugin, CSSRulePlugin);
import atmosphereVertexShader from "./shaders/atmosphereVertex.glsl";
import atmosphereFragmentShader from "./shaders/atmosphereFragment.glsl";

// dodanie GUI kontrolera do manipulacji
// const gui = new dat.GUI();
const worldConfig = {
  plane: {
    width: 400,
    height: 400,
    widthSegments: 70,
    heightSegments: 70,
  },
};

// gui.add(worldConfig.plane, "width", 1, 500).onChange(generatePlane);
// gui.add(worldConfig.plane, "height", 1, 500).onChange(generatePlane);
// gui.add(worldConfig.plane, "widthSegments", 1, 500).onChange(generatePlane);
// gui.add(worldConfig.plane, "heightSegments", 1, 500).onChange(generatePlane);

function generatePlane() {
  planeMesh.geometry.dispose();
  planeMesh.geometry = new THREE.PlaneGeometry(
    worldConfig.plane.width,
    worldConfig.plane.height,
    worldConfig.plane.widthSegments,
    worldConfig.plane.heightSegments
  );

  // losowa pozycja vektora
  const { array } = planeMesh.geometry.attributes.position;
  const randomValues = [];
  for (let i = 0; i < array.length; i++) {
    if (i % 3 === 0) {
      const x = array[i];
      const y = array[i + 1];
      const z = array[i + 2];

      array[i] = x + (Math.random() - 0.5) * 3;
      array[i + 1] = y + (Math.random() - 0.5) * 3;
      array[i + 2] = z + (Math.random() - 0.5) * 3;
    }

    randomValues.push(Math.random() * Math.PI * 2);
  }

  planeMesh.geometry.attributes.position.randomValues = randomValues;

  planeMesh.geometry.attributes.position.originalPosition =
    planeMesh.geometry.attributes.position.array;

  // zdefiniowanie koloru kazdego wektora
  const colors = [];
  for (let i = 0; i < planeMesh.geometry.attributes.position.count; i++) {
    colors.push(0, 0.19, 0.4);
  }

  planeMesh.geometry.setAttribute(
    "color",
    new THREE.BufferAttribute(new Float32Array(colors), 3)
  );
}

const raycaster = new THREE.Raycaster();
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  innerWidth / innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
});

renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(devicePixelRatio);

document.body.appendChild(renderer.domElement);

camera.position.z = 50;

const planeGeometry = new THREE.PlaneGeometry(
  worldConfig.plane.width,
  worldConfig.plane.height,
  worldConfig.plane.widthSegments,
  worldConfig.plane.heightSegments
);

const sphereGeometry = new THREE.SphereGeometry(5, 50, 50);
const atmosphereGeometry = new THREE.SphereGeometry(5, 50, 50);

const particlesGeometry = new THREE.BufferGeometry();
const particlesAmmount = 50000;

const positionArray = new Float32Array(particlesAmmount * 3);

for (let i = 0; i < particlesAmmount * 3; i++) {
  positionArray[i] = (Math.random() - 0.5) * 5000;
}

particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positionArray, 3)
);

const planeMaterial = new THREE.MeshPhongMaterial({
  side: THREE.DoubleSide,
  flatShading: THREE.FlatShading,
  vertexColors: true,
});

const shaderMaterial = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  uniforms: {
    globeTexture: {
      value: new THREE.TextureLoader().load(earth),
    },
  },
});

const atmosphereMaterial = new THREE.ShaderMaterial({
  vertexShader: atmosphereVertexShader,
  fragmentShader: atmosphereFragmentShader,
  blending: THREE.AdditiveBlending,
  side: THREE.BackSide,
});

const pointsMaterial = new THREE.PointsMaterial({
  size: 0.005,
});

const planeMesh = new THREE.Mesh(planeGeometry, planeMaterial);
const sphereMesh = new THREE.Mesh(sphereGeometry, shaderMaterial);
const atmosphereMesh = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
const particlesMesh = new THREE.Points(particlesGeometry, pointsMaterial);

scene.add(planeMesh);
scene.add(sphereMesh);
scene.add(atmosphereMesh);
scene.add(particlesMesh);

sphereMesh.position.y = 750;
sphereMesh.position.x = -5;
sphereMesh.position.z = 7;

atmosphereMesh.scale.set(1.1, 1.1, 1.1);
atmosphereMesh.position.y = 750;
atmosphereMesh.position.x = -5.3;
atmosphereMesh.position.z = 7;

sphereMesh.rotateX(-300);
generatePlane();

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(0, -1, 1);
scene.add(light);

// const lightBack = new THREE.DirectionalLight(0xffffff, 1);
// lightBack.position.set(0, -1, -1);
// scene.add(lightBack);

const mouse = {
  x: undefined,
  y: undefined,
};

let frame = 0;

function animate() {
  requestAnimationFrame(animate);
  frame += 0.01;
  renderer.render(scene, camera);
  raycaster.setFromCamera(mouse, camera);

  const { array, originalPosition, randomValues } =
    planeMesh.geometry.attributes.position;

  for (let i = 0; i < array.length; i += 3) {
    array[i] = originalPosition[i] + Math.cos(frame + randomValues[i]) * 0.01;

    array[i + 1] =
      originalPosition[i + 1] + Math.sin(frame + randomValues[i + 1]) * 0.001;
  }

  planeMesh.geometry.attributes.position.needsUpdate = true;

  const intersect = raycaster.intersectObject(planeMesh);

  if (intersect.length > 0) {
    const { color } = intersect[0].object.geometry.attributes;

    intersect[0].object.geometry.attributes.color.needsUpdate = true;

    const intiColor = {
      r: 0,
      g: 0.19,
      b: 0.4,
    };

    const hoverColor = {
      r: 0.1,
      g: 0.5,
      b: 1,
    };

    gsap.to(hoverColor, {
      r: intiColor.r,
      g: intiColor.g,
      b: intiColor.b,
      onUpdate: () => {
        color.setX(intersect[0].face.a, hoverColor.r);
        color.setY(intersect[0].face.a, hoverColor.g);
        color.setZ(intersect[0].face.a, hoverColor.b);

        color.setX(intersect[0].face.b, hoverColor.r);
        color.setY(intersect[0].face.b, hoverColor.g);
        color.setZ(intersect[0].face.b, hoverColor.b);

        color.setX(intersect[0].face.c, hoverColor.r);
        color.setY(intersect[0].face.c, hoverColor.g);
        color.setZ(intersect[0].face.c, hoverColor.b);
      },
    });
  }

  particlesMesh.rotation.z = 0.01 * frame;

  if (mouse.x) {
    particlesMesh.rotation.x = -mouse.y * 0.07;
    particlesMesh.rotation.y = -mouse.x * 0.07;
  }

  sphereMesh.rotation.y = -0.1 * frame;
}

animate();

addEventListener("mousemove", (e) => {
  mouse.x = (e.clientX / innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / innerHeight) * 2 + 1;
});

const button = document.querySelector(".go-further");
const container = document.querySelector(".container");

const border = CSSRulePlugin.getRule(".content:before");
const title = document.querySelector(".title");
const paragraph = document.querySelector(".paragraph");

const cameraPosition = {
  positionX: camera.position.x,
  positionY: camera.position.y,
  positionZ: camera.position.z,
  rotationX: camera.rotation.x,
  rotationY: camera.rotation.y,
  rotationZ: camera.rotation.z,
};

const tl = gsap.timeline();

button.addEventListener("click", () => {
  tl.to(container, { opacity: 0, duration: 1, display: "none" });
  tl.to(
    cameraPosition,
    {
      positionZ: 7,
      rotationX: 1.5,
      duration: 1,
      onUpdate: () => {
        camera.position.z = cameraPosition.positionZ;
        camera.rotation.x = cameraPosition.rotationX;
      },
    },
    "-=1"
  )
    .to(cameraPosition, {
      positionY: 735,
      duration: 1,
      ease: Power4.easeOut,
      onUpdate: () => {
        camera.position.y = cameraPosition.positionY;
      },
    })
    .to(
      border,
      {
        duration: 4,
        cssRule: {
          scaleX: 1,
        },
      },
      "-=0.5"
    )
    .to(
      title,
      {
        y: "30px",
        duration: 2,
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      },
      "-=3"
    )
    .to(
      paragraph,
      {
        y: "30px",
        duration: 4,
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
      },
      "-=2"
    );
});
