import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Shape {
  x: number;
  y: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  velocityX: number;
  velocityY: number;
  type: number; // 0 = triangle, 1 = square, 2 = hexagon, 3 = circle
  opacity: number;
}

export function WebGPUBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isDark } = useTheme();
  const [supported, setSupported] = useState(true);
  const animationRef = useRef<number | undefined>(undefined);
  const shapesRef = useRef<Shape[]>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let device: GPUDevice | null = null;
    let context: GPUCanvasContext | null = null;
    let pipeline: GPURenderPipeline | null = null;
    let uniformBuffer: GPUBuffer | null = null;
    let bindGroup: GPUBindGroup | null = null;

    const initWebGPU = async () => {
      // Check WebGPU support
      if (!navigator.gpu) {
        console.log('WebGPU not supported, falling back to CSS');
        setSupported(false);
        return;
      }

      try {
        const adapter = await navigator.gpu.requestAdapter();
        if (!adapter) {
          setSupported(false);
          return;
        }

        device = await adapter.requestDevice();
        context = canvas.getContext('webgpu');
        if (!context) {
          setSupported(false);
          return;
        }

        const format = navigator.gpu.getPreferredCanvasFormat();
        context.configure({
          device,
          format,
          alphaMode: 'premultiplied',
        });

        // Initialize shapes
        const numShapes = 15;
        shapesRef.current = Array.from({ length: numShapes }, () => ({
          x: Math.random() * 2 - 1,
          y: Math.random() * 2 - 1,
          size: 0.03 + Math.random() * 0.06,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.02,
          velocityX: (Math.random() - 0.5) * 0.002,
          velocityY: (Math.random() - 0.5) * 0.002,
          type: Math.floor(Math.random() * 4),
          opacity: 0.1 + Math.random() * 0.15,
        }));

        // Shader code
        const shaderCode = `
          struct Uniforms {
            color: vec4f,
            shape: vec4f, // x, y, size, rotation
            shapeType: f32,
            aspectRatio: f32,
          }

          @group(0) @binding(0) var<uniform> uniforms: Uniforms;

          struct VertexOutput {
            @builtin(position) position: vec4f,
            @location(0) uv: vec2f,
          }

          @vertex
          fn vertexMain(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
            var positions = array<vec2f, 6>(
              vec2f(-1.0, -1.0),
              vec2f(1.0, -1.0),
              vec2f(-1.0, 1.0),
              vec2f(-1.0, 1.0),
              vec2f(1.0, -1.0),
              vec2f(1.0, 1.0)
            );

            let pos = positions[vertexIndex];
            let size = uniforms.shape.z;
            let rotation = uniforms.shape.w;

            let cosR = cos(rotation);
            let sinR = sin(rotation);
            var rotated = vec2f(
              pos.x * cosR - pos.y * sinR,
              pos.x * sinR + pos.y * cosR
            );

            rotated.x *= size;
            rotated.y *= size * uniforms.aspectRatio;

            var output: VertexOutput;
            output.position = vec4f(
              rotated.x + uniforms.shape.x,
              rotated.y + uniforms.shape.y,
              0.0, 1.0
            );
            output.uv = pos * 0.5 + 0.5;
            return output;
          }

          fn sdTriangle(p: vec2f) -> f32 {
            let k = 1.732050808; // sqrt(3)
            var q = vec2f(abs(p.x) - 0.5, p.y + 0.5 / k);
            if (q.x + k * q.y > 0.0) {
              q = vec2f(q.x - k * q.y, -k * q.x - q.y) / 2.0;
            }
            q.x -= clamp(q.x, -1.0, 0.0);
            return -length(q) * sign(q.y);
          }

          fn sdHexagon(p: vec2f) -> f32 {
            let k = vec3f(-0.866025404, 0.5, 0.577350269);
            var q = abs(p);
            q = q - 2.0 * min(dot(k.xy, q), 0.0) * k.xy;
            q = q - vec2f(clamp(q.x, -k.z, k.z), 0.6);
            return length(q) * sign(q.y);
          }

          @fragment
          fn fragmentMain(input: VertexOutput) -> @location(0) vec4f {
            let uv = input.uv * 2.0 - 1.0;
            var d: f32;

            let shapeType = i32(uniforms.shapeType);

            if (shapeType == 0) {
              // Triangle
              d = sdTriangle(uv * 1.2);
            } else if (shapeType == 1) {
              // Square
              let q = abs(uv) - vec2f(0.5);
              d = length(max(q, vec2f(0.0))) + min(max(q.x, q.y), 0.0);
            } else if (shapeType == 2) {
              // Hexagon
              d = sdHexagon(uv * 0.8);
            } else {
              // Circle
              d = length(uv) - 0.5;
            }

            let edge = smoothstep(0.02, -0.02, d);
            let fill = smoothstep(0.0, -0.1, d) * 0.3;
            let alpha = (edge * 0.8 + fill) * uniforms.color.a;

            return vec4f(uniforms.color.rgb, alpha);
          }
        `;

        const shaderModule = device.createShaderModule({ code: shaderCode });

        pipeline = device.createRenderPipeline({
          layout: 'auto',
          vertex: {
            module: shaderModule,
            entryPoint: 'vertexMain',
          },
          fragment: {
            module: shaderModule,
            entryPoint: 'fragmentMain',
            targets: [{
              format,
              blend: {
                color: {
                  srcFactor: 'src-alpha',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
                alpha: {
                  srcFactor: 'one',
                  dstFactor: 'one-minus-src-alpha',
                  operation: 'add',
                },
              },
            }],
          },
          primitive: {
            topology: 'triangle-list',
          },
        });

        uniformBuffer = device.createBuffer({
          size: 48, // 6 * 4 bytes for uniforms (padded)
          usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        bindGroup = device.createBindGroup({
          layout: pipeline.getBindGroupLayout(0),
          entries: [{
            binding: 0,
            resource: { buffer: uniformBuffer },
          }],
        });

        // Animation loop
        const render = () => {
          if (!device || !context || !pipeline || !uniformBuffer || !bindGroup) return;

          const width = canvas.width;
          const height = canvas.height;
          const aspectRatio = width / height;

          // Update shapes
          shapesRef.current.forEach(shape => {
            shape.x += shape.velocityX;
            shape.y += shape.velocityY;
            shape.rotation += shape.rotationSpeed;

            // Wrap around edges
            if (shape.x < -1.2) shape.x = 1.2;
            if (shape.x > 1.2) shape.x = -1.2;
            if (shape.y < -1.2) shape.y = 1.2;
            if (shape.y > 1.2) shape.y = -1.2;
          });

          const commandEncoder = device.createCommandEncoder();
          const textureView = context.getCurrentTexture().createView();

          const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [{
              view: textureView,
              clearValue: { r: 0, g: 0, b: 0, a: 0 },
              loadOp: 'clear',
              storeOp: 'store',
            }],
          });

          renderPass.setPipeline(pipeline);

          // Draw each shape
          shapesRef.current.forEach(shape => {
            const uniformData = new Float32Array([
              // color (rgba) - green tint for fasting app
              0.34, 0.77, 0.37, shape.opacity,
              // shape (x, y, size, rotation)
              shape.x, shape.y, shape.size, shape.rotation,
              // shapeType, aspectRatio
              shape.type, aspectRatio,
              0, 0, // padding
            ]);

            device!.queue.writeBuffer(uniformBuffer!, 0, uniformData);
            renderPass.setBindGroup(0, bindGroup!);
            renderPass.draw(6);
          });

          renderPass.end();
          device.queue.submit([commandEncoder.finish()]);

          animationRef.current = requestAnimationFrame(render);
        };

        // Handle resize
        const handleResize = () => {
          canvas.width = window.innerWidth * window.devicePixelRatio;
          canvas.height = window.innerHeight * window.devicePixelRatio;
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        render();

        return () => {
          window.removeEventListener('resize', handleResize);
          if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
          }
        };
      } catch (e) {
        console.error('WebGPU init error:', e);
        setSupported(false);
      }
    };

    initWebGPU();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Fallback CSS animation for non-WebGPU browsers
  if (!supported) {
    return (
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              width: 40 + Math.random() * 60,
              height: 40 + Math.random() * 60,
              border: `2px solid ${isDark ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.1)'}`,
              borderRadius: i % 3 === 0 ? '50%' : i % 3 === 1 ? '0%' : '30%',
              animation: `float-shape ${15 + Math.random() * 10}s ease-in-out infinite`,
              animationDelay: `${-Math.random() * 10}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
        <style>{`
          @keyframes float-shape {
            0%, 100% { transform: translate(0, 0) rotate(0deg); opacity: 0.1; }
            25% { transform: translate(30px, -30px) rotate(90deg); opacity: 0.2; }
            50% { transform: translate(-20px, 20px) rotate(180deg); opacity: 0.15; }
            75% { transform: translate(40px, 10px) rotate(270deg); opacity: 0.2; }
          }
        `}</style>
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
