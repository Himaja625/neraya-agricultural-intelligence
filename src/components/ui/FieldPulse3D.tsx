import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { Field, CropAssessment, WeatherData } from '@/types';

export interface FieldPulse3DProps {
  field: Field;
  assessments: CropAssessment[];
  weather: WeatherData | null;
}

const SOIL_COLOR = 0x3b3320;
const STEM_COLOR = 0x6b7a42;
const LEAF_COLOR = 0x4d7c5e;
const LEAF_DARK_COLOR = 0x3d6a4e;
const FLOWER_COLOR = 0xe8d96e;
const FRUIT_RED = 0xc45a4a;
const FRUIT_CHILI = 0xd4463a;
const GRAIN_COLOR = 0xd4c87e;
const COTTON_BOLL = 0xf0ece4;

type CropArchetype =
  | 'fruiting_branching'
  | 'pepper_branching'
  | 'grass_grain'
  | 'tall_stalk'
  | 'bushy'
  | 'low_growing'
  | 'generic';

const ARCHETYPE_CAMERA_HEIGHT: Record<CropArchetype, number> = {
  fruiting_branching: 6,
  pepper_branching: 5.5,
  grass_grain: 5,
  tall_stalk: 8,
  bushy: 6,
  low_growing: 4.5,
  generic: 6,
};

function resolveArchetype(cropType: string | null): CropArchetype {
  if (!cropType) return 'generic';
  const c = cropType.toLowerCase().trim();

  if (c.includes('tomato') || c.includes('brinjal') || c.includes('eggplant') || c.includes('okra') || c.includes('bhendi') || c.includes('bendi')) return 'fruiting_branching';
  if (c.includes('chili') || c.includes('chilli') || c.includes('pepper') || c.includes('mirchi')) return 'pepper_branching';
  if (c.includes('rice') || c.includes('paddy') || c.includes('wheat') || c.includes('jowar') || c.includes('sorghum') || c.includes('bajra') || c.includes('barley')) return 'grass_grain';
  if (c.includes('maize') || c.includes('corn') || c.includes('sugarcane') || c.includes('banana')) return 'tall_stalk';
  if (c.includes('cotton') || c.includes('soybean') || c.includes('soya')) return 'bushy';
  if (c.includes('potato') || c.includes('groundnut') || c.includes('peanut') || c.includes('onion') || c.includes('garlic') || c.includes('ginger') || c.includes('turmeric')) return 'low_growing';

  return 'generic';
}

function stageScale(stage: string | null): number {
  switch (stage) {
    case 'Seedling': return 0.3;
    case 'Vegetative': return 0.55;
    case 'Flowering': return 0.85;
    case 'Fruiting': return 0.95;
    case 'Maturity': return 1.0;
    case 'Harvest': return 0.95;
    default: return 0.8;
  }
}

function showFlowersForStage(stage: string | null): boolean {
  return stage === 'Flowering' || stage === 'Fruiting' || stage === 'Maturity' || stage === 'Harvest';
}

function showFruitForStage(stage: string | null): boolean {
  return stage === 'Fruiting' || stage === 'Maturity' || stage === 'Harvest';
}

function computeHealthScore(assessments: CropAssessment[]): number {
  if (!assessments || assessments.length === 0) return 75;
  const latest = assessments[0];
  switch (latest.severity) {
    case 'High': return 25;
    case 'Moderate': return 50;
    case 'Low': return 70;
    default: return 75;
  }
}

function healthTintColor(score: number, hasAssessment: boolean): number {
  if (!hasAssessment || score >= 65) return 0xffffff;
  if (score >= 40) return 0xf2e8d0;
  return 0xe0c8a8;
}

export function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

function setColorAttribute(geo: THREE.BufferGeometry, color: number): void {
  const count = geo.attributes.position.count;
  const colors = new Float32Array(count * 3);
  const r = ((color >> 16) & 0xff) / 255;
  const g = ((color >> 8) & 0xff) / 255;
  const b = (color & 0xff) / 255;
  for (let i = 0; i < count; i++) {
    colors[i * 3] = r;
    colors[i * 3 + 1] = g;
    colors[i * 3 + 2] = b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
}

function makeBroadLeaf(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0.055, 0,
    0.028, 0.02, 0,
    0.022, -0.03, 0,
    0, -0.05, 0,
    -0.022, -0.03, 0,
    -0.028, 0.02, 0,
  ]);
  const indices = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5];
  const uvs = new Float32Array([0.5, 1, 0.8, 0.65, 0.7, 0.15, 0.5, 0, 0.3, 0.15, 0.2, 0.65]);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeNarrowLeaf(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0.06, 0,
    0.012, 0.02, 0,
    0.008, -0.04, 0,
    0, -0.06, 0,
    -0.008, -0.04, 0,
    -0.012, 0.02, 0,
  ]);
  const indices = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5];
  const uvs = new Float32Array([0.5, 1, 0.7, 0.65, 0.6, 0.15, 0.5, 0, 0.4, 0.15, 0.3, 0.65]);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function makeLongLeaf(): THREE.BufferGeometry {
  const geo = new THREE.BufferGeometry();
  const vertices = new Float32Array([
    0, 0.09, 0,
    0.014, 0.03, 0,
    0.01, -0.06, 0,
    0, -0.09, 0,
    -0.01, -0.06, 0,
    -0.014, 0.03, 0,
  ]);
  const indices = [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5];
  const uvs = new Float32Array([0.5, 1, 0.7, 0.6, 0.6, 0.1, 0.5, 0, 0.4, 0.1, 0.3, 0.6]);
  geo.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

function buildFruitingBranching(field: Field, archetype: CropArchetype): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const s = stageScale(field.growth_stage);
  const isPepper = archetype === 'pepper_branching';
  const stemHeight = (isPepper ? 0.34 : 0.42) * s;

  const stemGeo = new THREE.CylinderGeometry(0.016, 0.024, stemHeight, 5, 1);
  stemGeo.translate(0, stemHeight / 2, 0);
  setColorAttribute(stemGeo, STEM_COLOR);
  parts.push(stemGeo);

  if (s > 0.35) {
    const branchCount = isPepper ? 4 : 3;
    for (let b = 0; b < branchCount; b++) {
      const angle = (b / branchCount) * Math.PI * 2 + 0.4;
      const branchLen = (isPepper ? 0.07 : 0.09) * s;
      const branchGeo = new THREE.CylinderGeometry(0.007, 0.011, branchLen, 4, 1);
      branchGeo.translate(0, branchLen / 2, 0);
      branchGeo.rotateZ(Math.cos(angle) * 0.5);
      branchGeo.rotateX(Math.sin(angle) * 0.5);
      branchGeo.translate(Math.cos(angle) * 0.02, stemHeight * 0.6, Math.sin(angle) * 0.02);
      setColorAttribute(branchGeo, STEM_COLOR);
      parts.push(branchGeo);
    }

    const baseLeaf = isPepper ? makeNarrowLeaf() : makeBroadLeaf();
    const leafCount = isPepper ? 10 : 8;
    for (let l = 0; l < leafCount; l++) {
      const leafGeo = baseLeaf.clone();
      const angle = (l / leafCount) * Math.PI * 2 + 0.7;
      const heightFactor = 0.3 + (l % 4) * 0.16;
      const height = stemHeight * heightFactor;
      const radius = (isPepper ? 0.04 : 0.055) + (l % 3) * 0.018;
      leafGeo.translate(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      leafGeo.rotateY(angle + Math.PI / 2);
      leafGeo.rotateX(-0.35 - (l % 2) * 0.2);
      leafGeo.rotateZ((l % 3) * 0.08);
      setColorAttribute(leafGeo, l % 2 === 0 ? LEAF_COLOR : LEAF_DARK_COLOR);
      parts.push(leafGeo);
    }

    if (showFlowersForStage(field.growth_stage) && !showFruitForStage(field.growth_stage)) {
      const flowerCount = isPepper ? 5 : 4;
      for (let f = 0; f < flowerCount; f++) {
        const angle = (f / flowerCount) * Math.PI * 2;
        const flowerGeo = new THREE.SphereGeometry(0.014, 5, 4);
        flowerGeo.translate(Math.cos(angle) * 0.045, stemHeight * 0.8, Math.sin(angle) * 0.045);
        setColorAttribute(flowerGeo, FLOWER_COLOR);
        parts.push(flowerGeo);
      }
    }

    if (showFruitForStage(field.growth_stage)) {
      const fruitCount = isPepper ? 5 : 3;
      const fruitSize = isPepper ? 0.014 : 0.026;
      const fruitColor = isPepper ? FRUIT_CHILI : FRUIT_RED;
      for (let f = 0; f < fruitCount; f++) {
        const angle = (f / fruitCount) * Math.PI * 2 + 0.5;
        const fruitGeo = new THREE.SphereGeometry(fruitSize, 6, 5);
        fruitGeo.translate(Math.cos(angle) * 0.05, stemHeight * 0.7, Math.sin(angle) * 0.05);
        setColorAttribute(fruitGeo, fruitColor);
        parts.push(fruitGeo);
      }
    }
  }

  return merged(parts);
}

function buildGrassGrain(field: Field): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const s = stageScale(field.growth_stage);
  const isWheat = (field.crop_type ?? '').toLowerCase().includes('wheat');
  const stemHeight = 0.36 * s;

  const stemCount = 4;
  for (let st = 0; st < stemCount; st++) {
    const tilt = (st - 1.5) * 0.04;
    const stemGeo = new THREE.CylinderGeometry(0.005, 0.008, stemHeight, 3, 1);
    stemGeo.translate(0, stemHeight / 2, 0);
    stemGeo.rotateZ(tilt);
    stemGeo.translate((st - 1.5) * 0.015, 0, 0);
    setColorAttribute(stemGeo, STEM_COLOR);
    parts.push(stemGeo);
  }

  if (s > 0.3) {
    const baseLeaf = makeNarrowLeaf();
    const leafCount = 7;
    for (let l = 0; l < leafCount; l++) {
      const leafGeo = baseLeaf.clone();
      const angle = (l / leafCount) * Math.PI * 2;
      const heightFactor = 0.2 + (l % 3) * 0.22;
      const height = stemHeight * heightFactor;
      const radius = 0.035 + (l % 2) * 0.015;
      leafGeo.translate(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      leafGeo.rotateY(angle + Math.PI / 2);
      leafGeo.rotateX(-0.5 - (l % 2) * 0.15);
      setColorAttribute(leafGeo, LEAF_COLOR);
      parts.push(leafGeo);
    }

    if (showFruitForStage(field.growth_stage) && isWheat) {
      for (let g = 0; g < 3; g++) {
        const grainGeo = new THREE.SphereGeometry(0.008, 4, 3);
        grainGeo.translate((g - 1) * 0.012, stemHeight * 0.95, 0);
        grainGeo.scale(1, 1.8, 1);
        setColorAttribute(grainGeo, GRAIN_COLOR);
        parts.push(grainGeo);
      }
    }
  }

  return merged(parts);
}

function buildTallStalk(field: Field): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const s = stageScale(field.growth_stage);
  const stemHeight = 0.62 * s;

  const stemGeo = new THREE.CylinderGeometry(0.014, 0.022, stemHeight, 5, 1);
  stemGeo.translate(0, stemHeight / 2, 0);
  setColorAttribute(stemGeo, STEM_COLOR);
  parts.push(stemGeo);

  if (s > 0.3) {
    const baseLeaf = makeLongLeaf();
    const leafCount = 6;
    for (let l = 0; l < leafCount; l++) {
      const leafGeo = baseLeaf.clone();
      const angle = (l / leafCount) * Math.PI * 2 + 0.3;
      const heightFactor = 0.25 + (l % 3) * 0.22;
      const height = stemHeight * heightFactor;
      const radius = 0.04 + (l % 2) * 0.012;
      leafGeo.translate(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      leafGeo.rotateY(angle + Math.PI / 2);
      leafGeo.rotateX(-0.6 - (l % 2) * 0.1);
      setColorAttribute(leafGeo, l % 2 === 0 ? LEAF_COLOR : LEAF_DARK_COLOR);
      parts.push(leafGeo);
    }

    if (showFruitForStage(field.growth_stage)) {
      const cobGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.06, 6, 1);
      cobGeo.translate(0.03, stemHeight * 0.7, 0);
      cobGeo.rotateZ(-0.3);
      setColorAttribute(cobGeo, GRAIN_COLOR);
      parts.push(cobGeo);
    }
  }

  return merged(parts);
}

function buildBushy(field: Field): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const s = stageScale(field.growth_stage);
  const stemHeight = 0.38 * s;
  const isCotton = (field.crop_type ?? '').toLowerCase().includes('cotton');

  const stemGeo = new THREE.CylinderGeometry(0.014, 0.02, stemHeight, 5, 1);
  stemGeo.translate(0, stemHeight / 2, 0);
  setColorAttribute(stemGeo, STEM_COLOR);
  parts.push(stemGeo);

  if (s > 0.3) {
    const branchCount = 4;
    for (let b = 0; b < branchCount; b++) {
      const angle = (b / branchCount) * Math.PI * 2;
      const branchLen = 0.08 * s;
      const branchGeo = new THREE.CylinderGeometry(0.006, 0.01, branchLen, 4, 1);
      branchGeo.translate(0, branchLen / 2, 0);
      branchGeo.rotateZ(Math.cos(angle) * 0.6);
      branchGeo.rotateX(Math.sin(angle) * 0.6);
      branchGeo.translate(Math.cos(angle) * 0.015, stemHeight * 0.5, Math.sin(angle) * 0.015);
      setColorAttribute(branchGeo, STEM_COLOR);
      parts.push(branchGeo);
    }

    const baseLeaf = makeBroadLeaf();
    const leafCount = 10;
    for (let l = 0; l < leafCount; l++) {
      const leafGeo = baseLeaf.clone();
      const angle = (l / leafCount) * Math.PI * 2 + 0.5;
      const heightFactor = 0.25 + (l % 4) * 0.18;
      const height = stemHeight * heightFactor;
      const radius = 0.05 + (l % 3) * 0.016;
      leafGeo.translate(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      leafGeo.rotateY(angle + Math.PI / 2);
      leafGeo.rotateX(-0.3 - (l % 2) * 0.15);
      leafGeo.rotateZ((l % 3) * 0.06);
      setColorAttribute(leafGeo, l % 2 === 0 ? LEAF_COLOR : LEAF_DARK_COLOR);
      parts.push(leafGeo);
    }

    if (showFruitForStage(field.growth_stage) && isCotton) {
      const bollCount = 3;
      for (let b = 0; b < bollCount; b++) {
        const angle = (b / bollCount) * Math.PI * 2 + 0.5;
        const bollGeo = new THREE.SphereGeometry(0.018, 6, 5);
        bollGeo.translate(Math.cos(angle) * 0.05, stemHeight * 0.65, Math.sin(angle) * 0.05);
        setColorAttribute(bollGeo, COTTON_BOLL);
        parts.push(bollGeo);
      }
    }
  }

  return merged(parts);
}

function buildLowGrowing(field: Field): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const s = stageScale(field.growth_stage);
  const stemHeight = 0.18 * s;

  const stemGeo = new THREE.CylinderGeometry(0.01, 0.014, stemHeight, 4, 1);
  stemGeo.translate(0, stemHeight / 2, 0);
  setColorAttribute(stemGeo, STEM_COLOR);
  parts.push(stemGeo);

  if (s > 0.3) {
    const baseLeaf = makeBroadLeaf();
    const leafCount = 7;
    for (let l = 0; l < leafCount; l++) {
      const leafGeo = baseLeaf.clone();
      const angle = (l / leafCount) * Math.PI * 2 + 0.4;
      const heightFactor = 0.1 + (l % 3) * 0.15;
      const height = stemHeight * heightFactor + 0.01;
      const radius = 0.04 + (l % 3) * 0.014;
      leafGeo.translate(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      leafGeo.rotateY(angle + Math.PI / 2);
      leafGeo.rotateX(-0.2 - (l % 2) * 0.1);
      leafGeo.scale(1, 0.7, 1);
      setColorAttribute(leafGeo, l % 2 === 0 ? LEAF_COLOR : LEAF_DARK_COLOR);
      parts.push(leafGeo);
    }
  }

  return merged(parts);
}

function buildGeneric(field: Field): THREE.BufferGeometry {
  const parts: THREE.BufferGeometry[] = [];
  const s = stageScale(field.growth_stage);
  const stemHeight = 0.32 * s;

  const stemGeo = new THREE.CylinderGeometry(0.012, 0.018, stemHeight, 5, 1);
  stemGeo.translate(0, stemHeight / 2, 0);
  setColorAttribute(stemGeo, STEM_COLOR);
  parts.push(stemGeo);

  if (s > 0.3) {
    const baseLeaf = makeBroadLeaf();
    const leafCount = 6;
    for (let l = 0; l < leafCount; l++) {
      const leafGeo = baseLeaf.clone();
      const angle = (l / leafCount) * Math.PI * 2 + 0.5;
      const heightFactor = 0.3 + (l % 3) * 0.2;
      const height = stemHeight * heightFactor;
      const radius = 0.04 + (l % 2) * 0.014;
      leafGeo.translate(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
      leafGeo.rotateY(angle + Math.PI / 2);
      leafGeo.rotateX(-0.35 - (l % 2) * 0.15);
      setColorAttribute(leafGeo, l % 2 === 0 ? LEAF_COLOR : LEAF_DARK_COLOR);
      parts.push(leafGeo);
    }
  }

  return merged(parts);
}

function merged(parts: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const result = mergeGeometries(parts, false);
  if (!result) {
    console.error('FieldPulse3D: mergeGeometries returned null — attribute mismatch between parts');
    return new THREE.BufferGeometry();
  }
  result.computeBoundingSphere();
  return result;
}

function createCropGeometry(field: Field, archetype: CropArchetype): THREE.BufferGeometry {
  switch (archetype) {
    case 'fruiting_branching':
    case 'pepper_branching':
      return buildFruitingBranching(field, archetype);
    case 'grass_grain':
      return buildGrassGrain(field);
    case 'tall_stalk':
      return buildTallStalk(field);
    case 'bushy':
      return buildBushy(field);
    case 'low_growing':
      return buildLowGrowing(field);
    default:
      return buildGeneric(field);
  }
}

interface SceneHandles {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  crops: THREE.InstancedMesh;
  rain: THREE.Points | null;
  animationId: number;
  dispose: () => void;
}

function buildScene(
  container: HTMLElement,
  field: Field,
  assessments: CropAssessment[],
  weather: WeatherData | null,
  reducedMotion: boolean
): SceneHandles | null {
  const width = container.clientWidth || 600;
  const height = container.clientHeight || 400;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(width, height);
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xeaf2ea, 20, 45);

  const archetype = resolveArchetype(field.crop_type);
  const camHeight = ARCHETYPE_CAMERA_HEIGHT[archetype];

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(7.5, camHeight, 10.5);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 6;
  controls.maxDistance = 20;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.minPolarAngle = Math.PI * 0.12;
  controls.autoRotate = !reducedMotion;
  controls.autoRotateSpeed = 0.4;
  controls.target.set(0, 0.25, 0);

  const isNight = weather ? !weather.is_day : false;
  const ambientIntensity = isNight ? 0.28 : 0.62;
  const sunIntensity = isNight ? 0.4 : 1.05;
  const sunColor = isNight ? 0x9fb4d4 : 0xfff4e0;
  const ambientColor = isNight ? 0x2a3550 : 0xcfd8d0;

  scene.add(new THREE.AmbientLight(ambientColor, ambientIntensity));

  const sun = new THREE.DirectionalLight(sunColor, sunIntensity);
  sun.position.set(8, 14, 6);
  scene.add(sun);

  const groundGeo = new THREE.PlaneGeometry(14, 10, 1, 1);
  const groundMat = new THREE.MeshStandardMaterial({
    color: SOIL_COLOR,
    roughness: 0.96,
    metalness: 0.0,
    flatShading: true,
    fog: true,
    emissive: 0x0a0a08,
    emissiveIntensity: 0.04,
    side: THREE.DoubleSide,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  });
  const ground = new THREE.Mesh(groundGeo, groundMat);
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);

  const rows = 9;
  const cols = 16;
  const spacingX = 0.62;
  const spacingZ = 0.58;

  const cropGeo = createCropGeometry(field, archetype);

  const score = computeHealthScore(assessments);
  const hasAssessment = assessments && assessments.length > 0;
  const tintColor = healthTintColor(score, hasAssessment);

  const cropMat = new THREE.MeshStandardMaterial({
    color: tintColor,
    vertexColors: true,
    roughness: 0.78,
    metalness: 0.0,
    flatShading: true,
    fog: true,
    side: THREE.DoubleSide,
  });

  const total = rows * cols;
  const crops = new THREE.InstancedMesh(cropGeo, cropMat, total);
  crops.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const dummy = new THREE.Object3D();
  const phaseOffsets = new Float32Array(total);
  const offsetX = -((cols - 1) * spacingX) / 2;
  const offsetZ = -((rows - 1) * spacingZ) / 2;

  let i = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = offsetX + c * spacingX;
      const z = offsetZ + r * spacingZ;
      const jitterX = (Math.sin(r * 12.9 + c * 78.2) * 0.5) * 0.04;
      const jitterZ = (Math.cos(r * 4.1 + c * 33.7) * 0.5) * 0.04;
      const yScale = 0.82 + ((Math.sin(r * 3.3 + c * 7.1) * 0.5 + 0.5) * 0.36);
      dummy.position.set(x + jitterX, 0, z + jitterZ);
      dummy.rotation.set(0, 0, 0);
      dummy.scale.set(1, yScale, 1);
      dummy.updateMatrix();
      crops.setMatrixAt(i, dummy.matrix);
      phaseOffsets[i] = (r * 1.7 + c * 0.9) % (Math.PI * 2);
      i++;
    }
  }
  crops.instanceMatrix.needsUpdate = true;
  scene.add(crops);

  let rain: THREE.Points | null = null;
  const highHumidity = weather ? weather.humidity > 70 : false;
  if (highHumidity) {
    const rainCount = 700;
    const positions = new Float32Array(rainCount * 3);
    const velocities = new Float32Array(rainCount);
    for (let k = 0; k < rainCount; k++) {
      positions[k * 3] = (Math.random() - 0.5) * 16;
      positions[k * 3 + 1] = Math.random() * 12 + 2;
      positions[k * 3 + 2] = (Math.random() - 0.5) * 12;
      velocities[k] = 0.08 + Math.random() * 0.06;
    }
    const rainGeo = new THREE.BufferGeometry();
    rainGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x9bb4c9,
      size: 0.05,
      transparent: true,
      opacity: 0.5,
      depthWrite: false,
      fog: true,
      sizeAttenuation: true,
    });
    rain = new THREE.Points(rainGeo, rainMat);
    rain.userData.velocities = velocities;
    scene.add(rain);
  }

  let animationId = 0;
  const clock = new THREE.Clock();

  const animate = () => {
    animationId = requestAnimationFrame(animate);
    const elapsed = clock.getElapsedTime();

    if (!reducedMotion) {
      for (let k = 0; k < total; k++) {
        const phase = phaseOffsets[k];
        const sway = Math.sin(elapsed * 1.1 + phase) * 0.05;
        const swayY = Math.sin(elapsed * 0.7 + phase) * 0.03;
        crops.getMatrixAt(k, dummy.matrix);
        dummy.matrix.decompose(dummy.position, dummy.quaternion, dummy.scale);
        dummy.rotation.set(0, swayY, sway);
        dummy.updateMatrix();
        crops.setMatrixAt(k, dummy.matrix);
      }
      crops.instanceMatrix.needsUpdate = true;
    }

    if (rain) {
      const positions = rain.geometry.getAttribute('position') as THREE.BufferAttribute;
      const velocities = rain.userData.velocities as Float32Array;
      const arr = positions.array as Float32Array;
      for (let k = 0; k < arr.length / 3; k++) {
        arr[k * 3 + 1] -= velocities[k];
        if (arr[k * 3 + 1] < 0) {
          arr[k * 3 + 1] = 12 + Math.random() * 2;
          arr[k * 3] = (Math.random() - 0.5) * 16;
          arr[k * 3 + 2] = (Math.random() - 0.5) * 12;
        }
      }
      positions.needsUpdate = true;
    }

    controls.update();
    renderer.render(scene, camera);
  };
  animate();

  const onResize = () => {
    const w = container.clientWidth;
    const h = container.clientHeight;
    if (w === 0 || h === 0) return;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  };
  const resizeObserver = new ResizeObserver(onResize);
  resizeObserver.observe(container);

  const dispose = () => {
    cancelAnimationFrame(animationId);
    resizeObserver.disconnect();
    controls.dispose();

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) mesh.geometry.dispose();
      const mat = (mesh as THREE.Mesh).material;
      if (Array.isArray(mat)) {
        mat.forEach((m) => m.dispose());
      } else if (mat && 'dispose' in mat) {
        (mat as THREE.Material).dispose();
      }
    });

    renderer.dispose();
    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return { renderer, scene, camera, controls, crops, rain, animationId, dispose };
}

export default function FieldPulse3D({ field, assessments, weather }: FieldPulse3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const handlesRef = useRef<SceneHandles | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let handles: SceneHandles | null = null;
    try {
      handles = buildScene(container, field, assessments, weather, reducedMotion);
    } catch (err) {
      console.error('FieldPulse3D initialization failed:', err);
      handles = null;
    }

    if (!handles) return;
    handlesRef.current = handles;

    return () => {
      if (handlesRef.current) {
        handlesRef.current.dispose();
        handlesRef.current = null;
      }
    };
  }, [field, assessments, weather]);

  return <div ref={containerRef} style={{ width: '100%', height: '100%' }} />;
}
