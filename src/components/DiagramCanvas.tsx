import React, { useRef, useState, useEffect, useCallback } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Point, Property } from '../types';
import { getCartDiagramUrl } from '../lib/supabase';

interface DiagramCanvasProps {
  isGuestView: boolean;
  selectedProperty: Property | null;
  history: Point[][];
  currentStep: number;
  onUndo: () => void;
  onClear: () => void;
  onPointsChange: (points: Point[]) => void;
}

type DiagramColor = 'red' | '#00FF7F' | '#BF40BF';

const COLOR_OPTIONS: Array<{ color: DiagramColor; label: string }> = [
  { color: 'red', label: 'Scratches' },
  { color: '#00FF7F', label: 'Missing Parts' },
  { color: '#BF40BF', label: 'Damages/Impacts' }
] as const;

const CANVAS_WIDTH = 1200;
const CANVAS_HEIGHT = 700;
const POINT_SIZE = 6;


export function DiagramCanvas({
  isGuestView,
  selectedProperty,
  history,
  currentStep,
  onUndo,
  onClear,
  onPointsChange,
}: DiagramCanvasProps) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState<DiagramColor>(COLOR_OPTIONS[0].color);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);
  const currentPointsRef = useRef<Point[]>([]);

  // Redraw the entire canvas
  const redrawCanvas = useCallback(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw history points
    const points = currentPointsRef.current;
    console.log('Redrawing canvas with points:', points);
    points.forEach(point => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
      ctx.fillStyle = point.color;
      ctx.fill();
      ctx.closePath();
      console.log('Drawing point:', { ...point, color: ctx.fillStyle });
    });
    
    // Draw current path only if no es guest view
    if (!isGuestView) {
      currentPath.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, point.size / 2, 0, Math.PI * 2);
        ctx.fillStyle = point.color;
        ctx.fill();
        ctx.closePath();
      });
    }
  }, [currentPath, isGuestView]);

  // Update current points reference when history changes
  useEffect(() => {
    if (history[currentStep]) {
      currentPointsRef.current = history[currentStep];
      console.log('Updated points:', history[currentStep]);
    } else {
      currentPointsRef.current = [];
    }
    redrawCanvas();
  }, [history, currentStep, redrawCanvas]);

  // Initialize background canvas with image
  const initBackgroundCanvas = useCallback((img: HTMLImageElement) => {
    if (!backgroundCanvasRef.current || !canvasRef.current) return;
    
    const bgCanvas = backgroundCanvasRef.current;
    const drawCanvas = canvasRef.current;
    const bgCtx = bgCanvas.getContext('2d');
    if (!bgCtx) return;

    // Calculate dimensions maintaining aspect ratio
    let canvasWidth = img.width;
    let canvasHeight = img.height;
    
    // Scale down if image is too large
    if (canvasWidth > CANVAS_WIDTH || canvasHeight > CANVAS_HEIGHT) {
      const scaleWidth = CANVAS_WIDTH / canvasWidth;
      const scaleHeight = CANVAS_HEIGHT / canvasHeight;
      const scale = Math.min(scaleWidth, scaleHeight);
      
      canvasWidth = Math.floor(canvasWidth * scale);
      canvasHeight = Math.floor(canvasHeight * scale);
    }
    
    // Set canvas dimensions to match scaled image
    bgCanvas.width = canvasWidth;
    bgCanvas.height = canvasHeight;
    drawCanvas.width = canvasWidth;
    drawCanvas.height = canvasHeight;
    
    // Clear and draw image
    bgCtx.clearRect(0, 0, canvasWidth, canvasHeight);
    bgCtx.drawImage(img, 0, 0, canvasWidth, canvasHeight);
    
    // Redibujar los puntos después de cargar la imagen
    requestAnimationFrame(redrawCanvas); // Usar requestAnimationFrame para mejor sincronización
  }, [redrawCanvas]);

  // Load and setup background image
  useEffect(() => {
    let isCurrentLoad = true; // Para evitar cargas múltiples

    const loadImage = async () => {
      try {
        console.log('loadImage called, selectedProperty:', selectedProperty);
        if (!selectedProperty) {
          console.log('No property selected');
          return;
        }

        // Si hay propiedad seleccionada, cargar su diagrama
        const url = await getCartDiagramUrl(selectedProperty.diagramType);
        console.log('Loading diagram from URL:', url);
        if (!url || !isCurrentLoad) return;

        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          if (!isCurrentLoad) return;
          console.log('Image loaded successfully');
          initBackgroundCanvas(img);
        };
        img.onerror = (error) => {
          if (!isCurrentLoad) return;
          console.error('Error loading image:', error);
        };
        img.src = url;
      } catch (error) {
        console.error('Error in loadImage:', error);
      }
    };

    loadImage();

    return () => {
      isCurrentLoad = false; // Limpiar cuando cambie la propiedad
    };
  }, [selectedProperty, initBackgroundCanvas, redrawCanvas]);

  // Update canvas when points change
  useEffect(() => {
    redrawCanvas();
  }, [redrawCanvas, history, currentStep]);

  // Get canvas coordinates from mouse event
  const getCanvasPoint = useCallback((e: React.MouseEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      color: currentColor,
      size: POINT_SIZE
    };
  }, [currentColor]);

  // Handle mouse down event
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isGuestView) return;
    
    setIsDrawing(true);
    const point = getCanvasPoint(e);
    setCurrentPath([point]);
  }, [isGuestView, getCanvasPoint]);

  // Handle mouse move event
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || isGuestView) return;
    
    const point = getCanvasPoint(e);
    setCurrentPath(prev => [...prev, point]);
  }, [isDrawing, isGuestView, getCanvasPoint]);

  // Handle mouse up/leave events
  const handleDrawingEnd = useCallback(() => {
    if (!isDrawing) return;
    
    setIsDrawing(false);
    if (currentPath.length > 0) {
      const newPoints = [...currentPointsRef.current, ...currentPath];
      onPointsChange(newPoints);
      setCurrentPath([]);
    }
  }, [isDrawing, currentPath, onPointsChange]);

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Diagrama</h2>
      
      <div className="flex items-center gap-6 mb-4">
        <span className="text-sm font-medium text-gray-700">Color reference:</span>
        {COLOR_OPTIONS.map(({ color, label }) => (
          <div key={color} className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full"
              style={{ backgroundColor: color }}
            />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>

      <div className="flex gap-4 justify-center">
        {!isGuestView && (
          <div className="flex flex-col justify-start bg-white p-3 rounded-lg shadow-sm border border-gray-200 w-20">
            <div className="flex flex-col gap-2 mb-4">
              {COLOR_OPTIONS.map(({ color, label }) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full mx-auto transition-all ${
                    currentColor === color ? 'ring-2 ring-offset-2 ring-gray-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                  title={label}
                />
              ))}
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onUndo}
                disabled={history[currentStep]?.length === 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Deshacer"
              >
                <RotateCcw className="w-5 h-5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={onClear}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Limpiar"
              >
                <Trash2 className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>
        )}

        <div className="relative max-w-[1200px] max-h-[700px] border border-gray-300 rounded-lg bg-white overflow-hidden mx-auto">
          {!selectedProperty ? (
            <div className="w-full h-[700px] flex flex-col items-center justify-center bg-gray-50">
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">No diagram is currently loaded</h2>
              <p className="text-lg text-gray-500">Please select a property</p>
            </div>
          ) : (
            <div className="relative w-fit mx-auto">
            <canvas
              ref={backgroundCanvasRef}
              className="block"
            />
            
            <canvas
              ref={canvasRef}
              className={`absolute inset-0 ${
                isGuestView ? 'cursor-not-allowed' : 'cursor-crosshair'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleDrawingEnd}
              onMouseLeave={handleDrawingEnd}
              style={{ 
                pointerEvents: isGuestView ? 'none' : 'auto',
                touchAction: 'none'
              }}
            />
          </div>
          )}
        </div>
      </div>
    </section>
  );
}