import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, RotateCcw } from 'lucide-react';

interface ThreeDPreviewProps {
  mapData?: {
    shape: 'rectangle' | 'circle' | 'stick' | 'twig';
    width: number;
    height: number;
    imageUrl?: string;
  };
  visible?: boolean;
  onToggle?: () => void;
}

export function ThreeDPreview({ mapData, visible = true, onToggle }: ThreeDPreviewProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mouse interaction state
  const mouseRef = useRef({ x: 0, y: 0, isDown: false });
  const rotationRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!visible || !mountRef.current || !mapData) return;

    setIsLoading(true);
    setError(null);

    try {
      // Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xf0f0f0);
      sceneRef.current = scene;

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        mountRef.current.clientWidth / mountRef.current.clientHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 5);
      cameraRef.current = camera;

      // Renderer setup
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      rendererRef.current = renderer;

      // Lighting
      const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
      directionalLight.position.set(10, 10, 5);
      directionalLight.castShadow = true;
      directionalLight.shadow.mapSize.width = 2048;
      directionalLight.shadow.mapSize.height = 2048;
      scene.add(directionalLight);

      // Create geometry based on shape
      let geometry: THREE.BufferGeometry;
      const depth = 0.2; // Thickness of the map

      switch (mapData.shape) {
        case 'rectangle':
          geometry = new THREE.BoxGeometry(mapData.width / 100, mapData.height / 100, depth);
          break;
        case 'circle':
          geometry = new THREE.CylinderGeometry(
            Math.min(mapData.width, mapData.height) / 200,
            Math.min(mapData.width, mapData.height) / 200,
            depth,
            32
          );
          break;
        case 'stick':
          geometry = new THREE.BoxGeometry(mapData.width / 100, mapData.height / 400, depth);
          break;
        case 'twig':
          // Create a more complex twig-like shape
          geometry = new THREE.BoxGeometry(mapData.width / 150, mapData.height / 100, depth);
          break;
        default:
          geometry = new THREE.BoxGeometry(mapData.width / 100, mapData.height / 100, depth);
      }

      // Material setup
      const material = new THREE.MeshLambertMaterial({ color: 0x8B4513 }); // Brown color for wood

      // If there's an image, load it as texture
      if (mapData.imageUrl) {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
          mapData.imageUrl,
          (texture) => {
            material.map = texture;
            material.needsUpdate = true;
          },
          undefined,
          (error) => {
            console.warn('Failed to load texture:', error);
          }
        );
      }

      // Create mesh
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);
      meshRef.current = mesh;

      // Add to DOM
      mountRef.current.appendChild(renderer.domElement);

      // Mouse event handlers
      const handleMouseDown = (event: MouseEvent) => {
        mouseRef.current.isDown = true;
        mouseRef.current.x = event.clientX;
        mouseRef.current.y = event.clientY;
      };

      const handleMouseMove = (event: MouseEvent) => {
        if (!mouseRef.current.isDown || !meshRef.current) return;

        const deltaX = event.clientX - mouseRef.current.x;
        const deltaY = event.clientY - mouseRef.current.y;

        rotationRef.current.y += deltaX * 0.01;
        rotationRef.current.x += deltaY * 0.01;

        // Limit vertical rotation
        rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));

        meshRef.current.rotation.x = rotationRef.current.x;
        meshRef.current.rotation.y = rotationRef.current.y;

        mouseRef.current.x = event.clientX;
        mouseRef.current.y = event.clientY;
      };

      const handleMouseUp = () => {
        mouseRef.current.isDown = false;
      };

      const handleWheel = (event: WheelEvent) => {
        event.preventDefault();
        if (!cameraRef.current) return;

        const zoomSpeed = 0.1;
        const newZ = cameraRef.current.position.z + event.deltaY * zoomSpeed * 0.01;
        cameraRef.current.position.z = Math.max(2, Math.min(10, newZ));
      };

      // Add event listeners
      renderer.domElement.addEventListener('mousedown', handleMouseDown);
      renderer.domElement.addEventListener('mousemove', handleMouseMove);
      renderer.domElement.addEventListener('mouseup', handleMouseUp);
      renderer.domElement.addEventListener('wheel', handleWheel);
      renderer.domElement.style.cursor = 'grab';

      // Animation loop
      const animate = () => {
        animationIdRef.current = requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();

      setIsLoading(false);

      // Cleanup function
      return () => {
        if (animationIdRef.current) {
          cancelAnimationFrame(animationIdRef.current);
        }
        renderer.domElement.removeEventListener('mousedown', handleMouseDown);
        renderer.domElement.removeEventListener('mousemove', handleMouseMove);
        renderer.domElement.removeEventListener('mouseup', handleMouseUp);
        renderer.domElement.removeEventListener('wheel', handleWheel);
        
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
        geometry.dispose();
        material.dispose();
      };
    } catch (err) {
      setError('Failed to initialize 3D preview');
      setIsLoading(false);
      console.error('3D Preview Error:', err);
    }
  }, [visible, mapData]);

  const resetView = () => {
    if (meshRef.current && cameraRef.current) {
      rotationRef.current = { x: 0, y: 0 };
      meshRef.current.rotation.set(0, 0, 0);
      cameraRef.current.position.set(0, 0, 5);
    }
  };

  if (!mapData) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            3D Preview
            <Button variant="outline" size="sm" onClick={onToggle}>
              <EyeOff className="h-4 w-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No map data available for 3D preview
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          3D Preview
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={resetView}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={onToggle}>
              {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visible && (
          <div className="relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-sm text-muted-foreground">Loading 3D preview...</div>
              </div>
            )}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                <div className="text-sm text-destructive">{error}</div>
              </div>
            )}
            <div 
              ref={mountRef} 
              className="w-full h-96 border rounded-lg overflow-hidden"
              style={{ minHeight: '384px' }}
            />
            <div className="mt-2 text-xs text-muted-foreground text-center">
              Drag to rotate • Scroll to zoom • Click reset to center
            </div>
          </div>
        )}
        {!visible && (
          <div className="text-center text-muted-foreground py-8">
            3D preview is hidden
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ThreeDPreview;