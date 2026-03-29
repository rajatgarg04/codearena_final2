import { useRef, useState, useEffect } from 'react';

export default function ArenaWhiteboard({ broadcastWhiteboard, incomingDrawData }) {
    const canvasRef = useRef(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#a855f7'); // Default Purple
    const [isEraser, setIsEraser] = useState(false);
    const [thickness, setThickness] = useState(4);
    const [points, setPoints] = useState([]);

    const BACKGROUND_COLOR = '#181825';

    // Initialize Canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        const parent = canvas.parentElement;
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    // Listen for incoming websocket strokes
    useEffect(() => {
        if (!incomingDrawData) return;
        
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (incomingDrawData.action === 'clear') {
            ctx.fillStyle = BACKGROUND_COLOR;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else if (incomingDrawData.action === 'draw' && incomingDrawData.points.length > 0) {
            const pts = incomingDrawData.points;
            ctx.beginPath();
            ctx.moveTo(pts[0].x, pts[0].y);
            for (let i = 1; i < pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y);
            }
            ctx.strokeStyle = incomingDrawData.color;
            ctx.lineWidth = incomingDrawData.thickness || 4; // Fallback to 4 if missing
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.stroke();
        }
    }, [incomingDrawData]);

    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };

    const startDrawing = (e) => {
        const { x, y } = getCoordinates(e);
        setIsDrawing(true);
        setPoints([{ x, y }]);
        
        const ctx = canvasRef.current.getContext('2d');
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const { x, y } = getCoordinates(e);
        setPoints((prev) => [...prev, { x, y }]);

        const ctx = canvasRef.current.getContext('2d');
        ctx.lineTo(x, y);
        ctx.strokeStyle = isEraser ? BACKGROUND_COLOR : color;
        ctx.lineWidth = thickness;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();
    };

    const stopDrawing = () => {
        if (!isDrawing) return;
        setIsDrawing(false);
        
        if (points.length > 0) {
            broadcastWhiteboard({ 
                action: 'draw', 
                points, 
                color: isEraser ? BACKGROUND_COLOR : color, 
                thickness 
            });
        }
        setPoints([]);
    };

    const clearCanvas = (broadcast = true) => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = BACKGROUND_COLOR;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (broadcast) {
            broadcastWhiteboard({ action: 'clear' });
        }
    };

    const handleColorSelect = (c) => {
        setColor(c);
        setIsEraser(false); // Automatically turn off eraser when selecting a color
    };

    return (
        <div className="flex flex-col h-full bg-[#181825] z-20 absolute inset-0 rounded-xl overflow-hidden">
            {/* Toolbar */}
            <div className="flex justify-between items-center p-3 border-b border-gray-800 bg-[#1e1e2e]">
                <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-gray-400 font-semibold text-sm hidden sm:inline-block">🎨 Logic Board</span>
                    <div className="hidden sm:block h-4 w-px bg-gray-700"></div>
                    
                    {/* Color Palette */}
                    <div className="flex gap-2">
                        {['#a855f7', '#ec4899', '#3b82f6', '#22c55e', '#eab308', '#ffffff'].map(c => (
                            <button
                                key={c}
                                onClick={() => handleColorSelect(c)}
                                className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${!isEraser && color === c ? 'border-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'border-transparent'}`}
                                style={{ backgroundColor: c }}
                                title="Select Color"
                            />
                        ))}
                    </div>

                    <div className="h-4 w-px bg-gray-700"></div>

                    {/* Eraser Tool */}
                    <button 
                        onClick={() => setIsEraser(!isEraser)}
                        className={`px-3 py-1 text-sm rounded-md font-semibold transition ${isEraser ? 'bg-white text-black shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'}`}
                        title="Eraser"
                    >
                        🧽 Eraser
                    </button>

                    <div className="h-4 w-px bg-gray-700"></div>

                    {/* Thickness Slider */}
                    <div className="flex items-center gap-2 group">
                        <span className="text-xs text-gray-400 group-hover:text-gray-200 transition">Size:</span>
                        <input 
                            type="range" 
                            min="1" 
                            max="24" 
                            value={thickness}
                            onChange={(e) => setThickness(parseInt(e.target.value))}
                            className="w-20 lg:w-32 accent-purple-500 cursor-pointer"
                            title="Adjust Thickness"
                        />
                        <span className="text-xs text-gray-400 font-mono w-4">{thickness}</span>
                    </div>
                </div>

                {/* Clear Board Button */}
                <button onClick={() => clearCanvas(true)} className="text-xs bg-red-900/30 text-red-400 border border-red-900/50 px-3 py-1.5 rounded-md hover:bg-red-900 hover:text-white transition flex items-center gap-2 shrink-0">
                    🗑 Clear
                </button>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 overflow-hidden relative w-full h-full">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    // Change cursor to crosshair for drawing, cell for erasing
                    className={`${isEraser ? 'cursor-cell' : 'cursor-crosshair'} touch-none w-full h-full block`}
                />
            </div>
        </div>
    );
}