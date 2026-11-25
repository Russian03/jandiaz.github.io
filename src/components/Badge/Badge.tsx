/**
 * Interactive 3D badge: a card hanging from a lanyard, built with React Three Fiber and
 * Rapier physics. Based on the technique described in
 * https://vercel.com/blog/building-an-interactive-3d-event-badge-with-react-three-fiber
 * Tap to flip, drag to fidget.
 */
import * as THREE from 'three';
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Canvas, extend, useFrame, useThree, type ThreeElement } from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import {
  BallCollider,
  CuboidCollider,
  Physics,
  RigidBody,
  useRopeJoint,
  useSphericalJoint,
  type RapierRigidBody,
} from '@react-three/rapier';
import { MeshLineGeometry, MeshLineMaterial } from 'meshline';

extend({ MeshLineGeometry, MeshLineMaterial });

declare module '@react-three/fiber' {
  interface ThreeElements {
    meshLineGeometry: ThreeElement<typeof MeshLineGeometry>;
    meshLineMaterial: ThreeElement<typeof MeshLineMaterial>;
  }
}

const CARD_W = 1.6;
const CARD_H = 2.25;
const CARD_DEPTH = 0.03;
const SEGMENT = 0.4; // rope segment length: shorter = shorter strap
const HANG_Y = 1.325; // where the strap attaches, relative to the card centre
const CARD_FRACTION = 0.46; // card height as a share of the viewport height
const MAX_WIDTH_FRACTION = 0.62; // card width cap on narrow windows
const TAP_MS = 300;
const TAP_PX = 8;

/** Visible world height so the card scales with the window (and fits narrow ones). */
function viewHeight(aspect: number): number {
  return Math.max(CARD_H / CARD_FRACTION, CARD_W / (MAX_WIDTH_FRACTION * aspect));
}

function roundedRect(w: number, h: number, r: number): THREE.Shape {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

function makeTexture(url: string): THREE.Texture {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  // ShapeGeometry UVs are shape coordinates: map [-w/2, w/2] x [-h/2, h/2] to [0, 1]
  t.repeat.set(1 / CARD_W, 1 / CARD_H);
  t.offset.set(0.5, 0.5);
  return t;
}

function Rig() {
  const { size, camera } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const h = viewHeight(size.width / size.height);
    cam.position.set(0, 0, h / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
    cam.updateProjectionMatrix();
  }, [size, camera]);
  return null;
}

function Band({ front, back }: { front: string; back: string }) {
  const band = useRef<THREE.Mesh<MeshLineGeometry>>(null);
  const fixed = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const j1 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const j2 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const j3 = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const card = useRef<RapierRigidBody>(null) as RefObject<RapierRigidBody>;
  const flipped = useRef(false);
  const press = useRef({ t: 0, x: 0, y: 0 });

  const { size } = useThree();
  const [curve] = useState(
    () => new THREE.CatmullRomCurve3([0, 1, 2, 3].map(() => new THREE.Vector3())),
  );
  const [dragged, drag] = useState<THREE.Vector3 | false>(false);
  const [hovered, hover] = useState(false);

  const scratch = useMemo(
    () => ({ vec: new THREE.Vector3(), dir: new THREE.Vector3(), ang: new THREE.Vector3() }),
    [],
  );
  const bodyGeometry = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(roundedRect(CARD_W, CARD_H, 0.12), {
      depth: CARD_DEPTH,
      bevelEnabled: false,
    });
    g.translate(0, 0, -CARD_DEPTH / 2);
    return g;
  }, []);
  const faceGeometry = useMemo(
    () => new THREE.ShapeGeometry(roundedRect(CARD_W, CARD_H, 0.12)),
    [],
  );
  const frontTexture = useMemo(() => makeTexture(front), [front]);
  const backTexture = useMemo(() => makeTexture(back), [back]);

  useEffect(
    () => () => {
      frontTexture.dispose();
      backTexture.dispose();
    },
    [frontTexture, backTexture],
  );
  useEffect(() => {
    document.body.style.cursor = dragged ? 'grabbing' : hovered ? 'grab' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered, dragged]);

  const joint = { angularDamping: 2, linearDamping: 2 };
  useRopeJoint(fixed, j1, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j1, j2, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useRopeJoint(j2, j3, [[0, 0, 0], [0, 0, 0], SEGMENT]);
  useSphericalJoint(j3, card, [
    [0, 0, 0],
    [0, HANG_Y, 0],
  ]);

  useFrame((state) => {
    const { vec, dir, ang } = scratch;
    const c = card.current;
    if (!c || !fixed.current || !j1.current || !j2.current || !j3.current || !band.current) return;

    if (dragged) {
      vec.set(state.pointer.x, state.pointer.y, 0.5).unproject(state.camera);
      dir.copy(vec).sub(state.camera.position).normalize();
      vec.add(dir.multiplyScalar(state.camera.position.length()));
      [c, j1.current, j2.current, j3.current, fixed.current].forEach((b) => b.wakeUp());
      c.setNextKinematicTranslation({
        x: vec.x - dragged.x,
        y: vec.y - dragged.y,
        z: vec.z - dragged.z,
      });
    }

    curve.points[0].copy(j3.current.translation());
    curve.points[1].copy(j2.current.translation());
    curve.points[2].copy(j1.current.translation());
    curve.points[3].copy(fixed.current.translation());
    band.current.geometry.setPoints(curve.getPoints(32));

    if (!dragged) {
      // spin towards the front (or back) face: a smooth, non-oscillating flip
      const q = c.rotation();
      const yaw = 2 * Math.atan2(q.y, q.w);
      const diff = (flipped.current ? Math.PI : 0) - yaw;
      const wrapped = Math.atan2(Math.sin(diff), Math.cos(diff));
      ang.copy(c.angvel());
      c.setAngvel({ x: ang.x, y: THREE.MathUtils.clamp(wrapped * 6, -9, 9), z: ang.z }, true);
    }
  });

  const lineArgs = useMemo(
    () => ({
      color: '#14161a',
      lineWidth: 0.4,
      resolution: new THREE.Vector2(size.width, size.height),
    }),
    [size.width, size.height],
  );
  const metal = { color: '#23262d', metalness: 0.85, roughness: 0.35 } as const;
  const aspect = size.width / size.height;

  return (
    <>
      <group position={[0, viewHeight(aspect) / 2 + 0.1, 0]}>
        <RigidBody ref={fixed} type="fixed" {...joint} />
        <RigidBody ref={j1} position={[0, -SEGMENT, 0]} {...joint}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody ref={j2} position={[0, -SEGMENT * 2, 0]} {...joint}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody ref={j3} position={[0, -SEGMENT * 3, 0]} {...joint}>
          <BallCollider args={[0.1]} />
        </RigidBody>
        <RigidBody
          ref={card}
          position={[0, -SEGMENT * 3 - HANG_Y, 0]}
          type={dragged ? 'kinematicPosition' : 'dynamic'}
          {...joint}
        >
          <CuboidCollider args={[CARD_W / 2, CARD_H / 2, 0.02]} />
          <group
            onPointerOver={() => hover(true)}
            onPointerOut={() => hover(false)}
            onPointerDown={(e) => {
              (e.target as Element).setPointerCapture(e.pointerId);
              press.current = {
                t: performance.now(),
                x: e.nativeEvent.clientX,
                y: e.nativeEvent.clientY,
              };
              drag(
                new THREE.Vector3()
                  .copy(e.point)
                  .sub(scratch.vec.copy(card.current!.translation())),
              );
            }}
            onPointerUp={(e) => {
              (e.target as Element).releasePointerCapture(e.pointerId);
              const p = press.current;
              const moved = Math.hypot(e.nativeEvent.clientX - p.x, e.nativeEvent.clientY - p.y);
              if (performance.now() - p.t < TAP_MS && moved < TAP_PX)
                flipped.current = !flipped.current;
              drag(false);
            }}
          >
            <mesh geometry={bodyGeometry}>
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh geometry={faceGeometry} position={[0, 0, CARD_DEPTH / 2 + 0.0005]}>
              <meshPhysicalMaterial
                map={frontTexture}
                clearcoat={0.6}
                clearcoatRoughness={0.25}
                roughness={0.6}
                metalness={0.1}
              />
            </mesh>
            <mesh
              geometry={faceGeometry}
              position={[0, 0, -CARD_DEPTH / 2 - 0.0005]}
              rotation={[0, Math.PI, 0]}
            >
              <meshPhysicalMaterial
                map={backTexture}
                clearcoat={0.6}
                clearcoatRoughness={0.25}
                roughness={0.6}
                metalness={0.1}
              />
            </mesh>
            <mesh position={[0, HANG_Y - 0.02, 0]}>
              <boxGeometry args={[0.34, 0.2, 0.07]} />
              <meshStandardMaterial {...metal} />
            </mesh>
            <mesh position={[0, HANG_Y - 0.22, 0]}>
              <torusGeometry args={[0.1, 0.022, 12, 32]} />
              <meshStandardMaterial {...metal} />
            </mesh>
          </group>
        </RigidBody>
      </group>
      <mesh ref={band}>
        <meshLineGeometry />
        <meshLineMaterial args={[lineArgs]} />
      </mesh>
    </>
  );
}

export default function Badge({ front, back }: { front: string; back: string }) {
  return (
    <Canvas
      camera={{ position: [0, 0, 13], fov: 25 }}
      dpr={[1, 2]}
      gl={{ alpha: true }}
      style={{ touchAction: 'none' }}
    >
      <ambientLight intensity={Math.PI * 0.25} />
      <Physics interpolate gravity={[0, -40, 0]} timeStep={1 / 60}>
        <Band front={front} back={back} />
      </Physics>
      <Rig />
      <Environment resolution={256} environmentIntensity={0.35}>
        <Lightformer
          intensity={2}
          color="white"
          position={[0, -1, 5]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={3}
          color="white"
          position={[-1, -1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={3}
          color="white"
          position={[1, 1, 1]}
          rotation={[0, 0, Math.PI / 3]}
          scale={[100, 0.1, 1]}
        />
        <Lightformer
          intensity={10}
          color="white"
          position={[-10, 0, 14]}
          rotation={[0, Math.PI / 2, Math.PI / 3]}
          scale={[100, 10, 1]}
        />
      </Environment>
    </Canvas>
  );
}
