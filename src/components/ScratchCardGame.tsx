import { useRef, useState, useEffect, useCallback } from 'react';
import { Sparkles, Gift } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (reward: any) => void;
}

const REWARDS = [
  { type: 'promo', value: 'SCRATCH-FRIES-001', label: 'FREE SOLO FRIES', emoji: '🍟', color: '#F4A261' },
  { type: 'promo', value: 'SCRATCH-DRINK-001', label: 'FREE DRINK UPGRADE', emoji: '🥤', color: '#2A9D8F' },
  { type: 'promo', value: 'SCRATCH-10OFF-001', label: '10% OFF', emoji: '🎉', color: '#E76F51' },
  { type: 'points', value: 50, label: '50 BONUS POINTS', emoji: '⭐', color: '#E9C46A' }
];

export default function ScratchCardGame({ isOpen, onClose, onComplete }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [reward, setReward] = useState<typeof REWARDS[0] | null>(null);
  const [isScratching, setIsScratching] = useState(false);
  const [scratchPercent, setScratchPercent] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  const CANVAS_WIDTH = 320;
  const CANVAS_HEIGHT = 180;
  const REVEAL_THRESHOLD = 40; // Percentage to auto-reveal

  // Initialize scratch card
  useEffect(() => {
    if (!isOpen) return;

    // Randomly select reward
    const selectedReward = REWARDS[Math.floor(Math.random() * REWARDS.length)];
    setReward(selectedReward);
    setIsRevealed(false);
    setScratchPercent(0);
    setShowCelebration(false);

    // Initialize canvas
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw scratch layer
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1B4332');
    gradient.addColorStop(0.5, '#2D6A4F');
    gradient.addColorStop(1, '#1B4332');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Add pattern
    ctx.fillStyle = 'rgba(244, 162, 97, 0.1)';
    for (let i = 0; i < 50; i++) {
      ctx.beginPath();
      ctx.arc(
        Math.random() * CANVAS_WIDTH,
        Math.random() * CANVAS_HEIGHT,
        Math.random() * 20 + 5,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Add text
    ctx.fillStyle = '#F4A261';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('SCRATCH TO WIN!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 20);

    ctx.font = '16px Arial';
    ctx.fillText('🎁 Reveal Your Prize 🎁', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);

    // Add sparkles
    ctx.font = '20px Arial';
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const x = CANVAS_WIDTH / 2 + Math.cos(angle) * 120;
      const y = CANVAS_HEIGHT / 2 + Math.sin(angle) * 70;
      ctx.fillText('✨', x, y);
    }
  }, [isOpen]);

  const getMousePos = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    return {
      x: (clientX - rect.left) * (CANVAS_WIDTH / rect.width),
      y: (clientY - rect.top) * (CANVAS_HEIGHT / rect.height)
    };
  }, []);

  const scratch = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isScratching || isRevealed) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getMousePos(e);

    // Scratch effect (erase)
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x, y, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';

    // Calculate scratch percentage
    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const pixels = imageData.data;
    let transparentPixels = 0;

    for (let i = 3; i < pixels.length; i += 4) {
      if (pixels[i] < 128) {
        transparentPixels++;
      }
    }

    const percent = (transparentPixels / (CANVAS_WIDTH * CANVAS_HEIGHT)) * 100;
    setScratchPercent(percent);

    if (percent > REVEAL_THRESHOLD && !isRevealed) {
      setIsRevealed(true);
      setShowCelebration(true);
      revealAll();
    }
  }, [isScratching, isRevealed, getMousePos]);

  const revealAll = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }, []);

  const handleClaim = () => {
    if (reward) {
      onComplete(reward);
    }
    onClose();
  };

  if (!isOpen || !reward) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#F4A261] rounded-full mb-3">
            <Sparkles className="text-[#1B4332]" size={32} />
          </div>
          <h2 className="text-2xl font-bold text-[#1B4332]">Congratulations!</h2>
          <p className="text-gray-600">Thanks for your review! Scratch to reveal your prize!</p>
        </div>

        {/* Scratch Card */}
        <div className="relative mx-auto mb-6" style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}>
          {/* Prize Layer (underneath) */}
          <div
            className="absolute inset-0 rounded-xl flex flex-col items-center justify-center text-white"
            style={{ backgroundColor: reward.color }}
          >
            <span className="text-6xl mb-2">{reward.emoji}</span>
            <span className="text-xl font-bold text-center px-4">{reward.label}</span>
            <span className="text-sm mt-2 opacity-80">Tap to claim!</span>
          </div>

          {/* Scratch Layer (canvas) */}
          <canvas
            ref={canvasRef}
            width={CANVAS_WIDTH}
            height={CANVAS_HEIGHT}
            className={`absolute inset-0 rounded-xl cursor-pointer ${isRevealed ? 'pointer-events-none' : ''}`}
            onMouseDown={() => setIsScratching(true)}
            onMouseUp={() => setIsScratching(false)}
            onMouseLeave={() => setIsScratching(false)}
            onMouseMove={scratch}
            onTouchStart={() => setIsScratching(true)}
            onTouchEnd={() => setIsScratching(false)}
            onTouchMove={scratch}
          />

          {/* Celebration Effect */}
          {showCelebration && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-xl">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-ping"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 0.5}s`,
                    animationDuration: `${1 + Math.random()}s`
                  }}
                >
                  {['⭐', '🎉', '✨', '🎊'][Math.floor(Math.random() * 4)]}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {!isRevealed && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Scratch to reveal!</span>
              <span>{Math.round(scratchPercent)}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#F4A261] transition-all duration-300"
                style={{ width: `${(scratchPercent / REVEAL_THRESHOLD) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Action Button */}
        {isRevealed && (
          <div className="text-center animate-bounce">
            <button
              onClick={handleClaim}
              className="px-8 py-3 bg-[#F4A261] text-[#1B4332] rounded-xl font-bold text-lg hover:bg-[#E76F51] hover:text-white transition-colors flex items-center gap-2 mx-auto"
            >
              <Gift size={20} />
              Claim Your Prize!
            </button>
          </div>
        )}

        {/* Instructions */}
        {!isRevealed && (
          <p className="text-center text-gray-500 text-sm">
            Scratch the card above to reveal your surprise reward!
          </p>
        )}
      </div>
    </div>
  );
}