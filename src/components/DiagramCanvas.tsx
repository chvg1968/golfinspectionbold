import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { Point, Property } from '../types';

interface DiagramCanvasProps {
  isGuestView: boolean;
  selectedProperty: Property | null;
  history: Point[][];
  currentStep: number;
  onUndo: () => void;
  onClear: () => void;
  onPointsChange: (points: Point[]) => void;
}

const COLOR_OPTIONS = [
  { color: 'red', label: 'Scratches' },
  { color: '#00FF7F', label: 'Missing parts' },
  { color: '#BF40BF', label: 'Damage/Bumps' }
];

const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 400;
const POINT_SIZE = 12;

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
  const [currentColor, setCurrentColor] = useState(COLOR_OPTIONS[0].color);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const backgroundCanvasRef = useRef<HTMLCanvasElement>(null);

  // Initialize background canvas
  useEffect(() => {
    if (!backgroundCanvasRef.current || !selectedProperty) return;
    
    const canvas = backgroundCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = CANVAS_WIDTH;
      canvas.height = CANVAS_HEIGHT;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    };
    img.src = `/diagrams/${selectedProperty.diagramType}`;
  }, [selectedProperty]);

  const drawPoint = (ctx: CanvasRenderingContext2D, x: number, y: number, color: string, size: number) => {
    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.closePath();
  };

  // Redraw all points
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_WIDTH;
    canvas.height = CANVAS_HEIGHT;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const currentPoints = history[currentStep] || [];
    
    currentPoints.forEach(point => {
      drawPoint(ctx, point.x, point.y, point.color, point.size);
    });
  }, [history, currentStep]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!canvasRef.current || isGuestView) return;
    setIsDrawing(true);
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPoint = { x, y, color: currentColor, size: POINT_SIZE };
    const currentPoints = history[currentStep] || [];
    onPointsChange([...currentPoints, newPoint]);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current || isGuestView) return;
    
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPoint = { x, y, color: currentColor, size: POINT_SIZE };
    const currentPoints = history[currentStep] || [];
    onPointsChange([...currentPoints, newPoint]);
  };

  const handleMouseUp = () => {
    setIsDrawing(false);
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-gray-700">Diagram</h2>
      
      {/* Color convention */}
      <div className="flex items-center gap-6 mb-4">
        <span className="text-sm font-medium text-gray-700">Color Reference:</span>
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

      {/* Main container with drawing tools and canvas side by side */}
      <div className="flex gap-4 justify-center">
        {/* Drawing tools */}
        {!isGuestView && (
          <div className="flex flex-col justify-start bg-white p-3 rounded-lg shadow-sm border border-gray-200 w-20">
            {/* Color picker */}
            <div className="flex flex-col gap-2 mb-4">
              {COLOR_OPTIONS.map(({ color }) => (
                <button
                  key={color}
                  type="button"
                  className={`w-6 h-6 rounded-full mx-auto transition-all ${
                    currentColor === color ? 'ring-2 ring-offset-2 ring-gray-500' : ''
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCurrentColor(color)}
                />
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={onUndo}
                disabled={currentStep === 0}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Undo"
              >
                <RotateCcw className="w-5 h-5 mx-auto" />
              </button>
              <button
                type="button"
                onClick={onClear}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Clear"
              >
                <Trash2 className="w-5 h-5 mx-auto" />
              </button>
            </div>
          </div>
        )}

        {/* Canvas container */}
        <div className="relative w-[600px] h-[400px] border border-gray-300 rounded-lg bg-white">
          <div className="absolute inset-0">
            {/* Background canvas */}
            <canvas
              ref={backgroundCanvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="absolute inset-0 w-full h-full"
            />
            
            {/* Drawing canvas */}
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className={`absolute inset-0 w-full h-full ${
                isGuestView ? 'cursor-not-allowed' : 'cursor-crosshair'
              }`}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseOut={handleMouseUp}
              style={{ 
                pointerEvents: isGuestView ? 'none' : 'auto',
                touchAction: 'none'
              }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}