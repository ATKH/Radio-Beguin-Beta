"use client";

import React, { useEffect, useRef, useState } from "react";

type MonkeyGameTickerProps = {
  onExit: () => void;
};

type Heart = {
  x: number;
  y: number;
  size: number;
};

type Obstacle = {
  x: number;
  y: number;
  width: number;
  height: number;
  variant: "ground" | "overhead";
};

type MonkeyState = {
  x: number;
  y: number;
  width: number;
  height: number;
  vy: number;
  canJump: boolean;
  isDucking: boolean;
};

type Inputs = {
  left: boolean;
  right: boolean;
};

const MONKEY_WIDTH = 30;
const MONKEY_HEIGHT = 30;
const HEART_SIZE = 18;
const HORIZONTAL_SPEED = 150; // px per second
const HEART_SPEED = 150; // px per second
const GRAVITY = 900; // px per second^2
const JUMP_VELOCITY = 360; // px per second
const HEART_SPAWN_INTERVAL = 1400; // ms
const OBSTACLE_SPAWN_INTERVAL = 2000; // ms
const OBSTACLE_WIDTH = 20;
const OBSTACLE_HEIGHT = 18;
const OBSTACLE_SPEED = HEART_SPEED;
const GROUND_OFFSET = 6;
const LEFT_MARGIN = 16;
const RIGHT_MARGIN = 24;
const AUTO_SCROLL_SPEED = -55;
const GAME_OVER_FREEZE_DURATION = 1400;
const MONKEY_CLEAN_THRESHOLD = 230;
const KEY_CAPTURE_KEYS = new Set(["ArrowDown", "ArrowUp", "ArrowLeft", "ArrowRight", " ", "Escape"]);
const DUCK_HEIGHT = Math.round(MONKEY_HEIGHT * 0.55);
const OVERHEAD_HEIGHT = 14;
const OVERHEAD_CLEARANCE = 6;
const DIFFICULTY_MAX = 1.75;
const OBSTACLE_INTERVAL_JITTER_MIN = 0.65;
const OBSTACLE_INTERVAL_JITTER_MAX = 1.45;
const MOBILE_WIDTH_THRESHOLD = 768;

function heartPath(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.moveTo(x + size / 2, y + size);
  ctx.bezierCurveTo(x, y + size * 0.75, x, y + size * 0.38, x + size / 2, y + size * 0.3);
  ctx.bezierCurveTo(x + size, y + size * 0.38, x + size, y + size * 0.75, x + size / 2, y + size);
}

function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const baseGradient = ctx.createLinearGradient(x, y, x, y + size);
  baseGradient.addColorStop(0, "#d81e5b");
  baseGradient.addColorStop(0.35, "#ff4673");
  baseGradient.addColorStop(0.72, "#ff85a7");
  baseGradient.addColorStop(1, "#ffd8e3");

  ctx.save();
  ctx.beginPath();
  heartPath(ctx, x, y, size);
  ctx.closePath();
  ctx.fillStyle = baseGradient;
  ctx.shadowColor = "rgba(215, 35, 85, 0.45)";
  ctx.shadowBlur = size * 0.55;
  ctx.shadowOffsetY = size * 0.2;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  heartPath(ctx, x, y, size);
  ctx.closePath();
  const rimGradient = ctx.createLinearGradient(x + size * 0.1, y + size * 0.1, x + size, y + size);
  rimGradient.addColorStop(0, "rgba(255, 255, 255, 0.75)");
  rimGradient.addColorStop(1, "rgba(211, 47, 102, 0.65)");
  ctx.lineWidth = Math.max(1, size * 0.12);
  ctx.strokeStyle = rimGradient;
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  heartPath(ctx, x, y, size);
  ctx.closePath();
  ctx.clip();
  const depthGradient = ctx.createRadialGradient(
    x + size * 0.55,
    y + size * 0.7,
    size * 0.1,
    x + size * 0.55,
    y + size * 0.7,
    size * 0.85
  );
  depthGradient.addColorStop(0, "rgba(255, 108, 150, 0.35)");
  depthGradient.addColorStop(0.5, "rgba(211, 30, 96, 0.2)");
  depthGradient.addColorStop(1, "rgba(120, 10, 50, 0.4)");
  ctx.globalCompositeOperation = "multiply";
  ctx.fillStyle = depthGradient;
  ctx.fillRect(x, y, size, size);
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  heartPath(ctx, x, y, size);
  ctx.closePath();
  ctx.clip();
  ctx.globalCompositeOperation = "lighter";
  const highlightGradient = ctx.createRadialGradient(
    x + size * 0.28,
    y + size * 0.24,
    size * 0.05,
    x + size * 0.28,
    y + size * 0.24,
    size * 0.32
  );
  highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.9)");
  highlightGradient.addColorStop(0.6, "rgba(255, 255, 255, 0.18)");
  highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  ctx.fillStyle = highlightGradient;
  ctx.fillRect(x, y, size, size);

  ctx.beginPath();
  ctx.ellipse(x + size * 0.65, y + size * 0.42, size * 0.18, size * 0.12, Math.PI / 6, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(255, 255, 255, 0.22)";
  ctx.fill();
  ctx.restore();
}

function drawObstacle(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  ctx.beginPath();
  ctx.moveTo(x, y + height);
  ctx.lineTo(x + width / 2, y);
  ctx.lineTo(x + width, y + height);
  ctx.closePath();
  ctx.fill();
}

export default function MonkeyGameTicker({ onExit }: MonkeyGameTickerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const inputsRef = useRef<Inputs>({ left: false, right: false });
  const heartsRef = useRef<Heart[]>([]);
  const obstaclesRef = useRef<Obstacle[]>([]);
  const lastSpawnRef = useRef<number>(0);
  const lastObstacleSpawnRef = useRef<number>(0);
  const lastFrameRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const nextObstacleIntervalRef = useRef<number | null>(null);
  const dprRef = useRef<number>(1);
  const scoreRef = useRef<number>(0);
  const exitGameRef = useRef<() => void>(() => {});
  const isMobileRef = useRef<boolean>(false);
  const gameOverTimeoutRef = useRef<number | null>(null);
  const isGameOverRef = useRef<boolean>(false);
  const monkeyRef = useRef<MonkeyState>({
    x: 0,
    y: 0,
    width: MONKEY_WIDTH,
    height: MONKEY_HEIGHT,
    vy: 0,
    canJump: true,
    isDucking: false,
  });
  const groundRef = useRef<{ ground: number; width: number; height: number }>({
    ground: 0,
    width: 0,
    height: 0,
  });
  const startedAtRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    if (typeof window === "undefined") {
      return;
    }

    const monkeyImage = new window.Image();
    monkeyImage.crossOrigin = "anonymous";
    const spriteRef = { current: monkeyImage } as { current: HTMLImageElement };

    const pointerQuery = window.matchMedia("(pointer: coarse)");
    const updateIsMobile = () => {
      isMobileRef.current = pointerQuery.matches || window.innerWidth <= MOBILE_WIDTH_THRESHOLD;
    };
    const handlePointerChange = () => updateIsMobile();

    const clearScheduledExit = () => {
      if (gameOverTimeoutRef.current !== null) {
        window.clearTimeout(gameOverTimeoutRef.current);
        gameOverTimeoutRef.current = null;
      }
    };

    isGameOverRef.current = false;
    nextObstacleIntervalRef.current = OBSTACLE_SPAWN_INTERVAL;

    const cleanSprite = (source: HTMLImageElement) => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = source.width;
        canvas.height = source.height;
        const ctxOff = canvas.getContext("2d");
        if (!ctxOff) return;
        ctxOff.drawImage(source, 0, 0);
        const imageData = ctxOff.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        let updated = false;

        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > MONKEY_CLEAN_THRESHOLD && g > MONKEY_CLEAN_THRESHOLD && b > MONKEY_CLEAN_THRESHOLD) {
            data[i + 3] = 0;
            updated = true;
          } else {
            data[i] = 0;
            data[i + 1] = 0;
            data[i + 2] = 0;
          }
        }

        if (updated) {
          ctxOff.putImageData(imageData, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          const cleanedImage = new window.Image();
          cleanedImage.src = dataUrl;
          spriteRef.current = cleanedImage;
          cleanedImage.onload = () => {
            spriteRef.current = cleanedImage;
          };
        } else {
          spriteRef.current = source;
        }
      } catch (error) {
        console.error("Impossible de nettoyer la sprite du singe", error);
        spriteRef.current = source;
      }
    };

    monkeyImage.onload = () => {
      cleanSprite(monkeyImage);
    };

    monkeyImage.src = "/Singe4.png";

    const heartTint = "rgba(255, 255, 255, 0.95)";

    dprRef.current = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

    updateIsMobile();
    pointerQuery.addEventListener?.("change", handlePointerChange);
    pointerQuery.addListener?.(handlePointerChange);
    window.addEventListener("resize", handlePointerChange);

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = dprRef.current;
      const width = Math.max(320, Math.floor(rect.width));
      const height = Math.max(52, Math.floor(rect.height));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      const ground = height - GROUND_OFFSET;
      groundRef.current = { ground, width, height };

      const monkey = monkeyRef.current;
      monkey.y = Math.min(monkey.y || ground, ground);
      const initialX = width - MONKEY_WIDTH - RIGHT_MARGIN;
      monkey.x = Math.min(Math.max(monkey.x || initialX, LEFT_MARGIN), width - MONKEY_WIDTH - RIGHT_MARGIN);
    };

    resizeCanvas();
    const resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (KEY_CAPTURE_KEYS.has(event.key)) {
        event.preventDefault();
      }
      switch (event.code) {
        case "Escape":
          exitGameRef.current();
          return;
        case "ArrowLeft":
          inputsRef.current.left = true;
          break;
        case "ArrowRight":
          inputsRef.current.right = true;
          break;
        case "ArrowUp":
        case "Space": {
          const monkey = monkeyRef.current;
          if (monkey.canJump) {
            monkey.vy = -JUMP_VELOCITY;
            monkey.canJump = false;
            monkey.isDucking = false;
          }
          break;
        }
        case "ArrowDown":
          if (monkeyRef.current.y >= groundRef.current.ground - 0.5) {
            monkeyRef.current.isDucking = true;
          }
          break;
        default:
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (KEY_CAPTURE_KEYS.has(event.key)) {
        event.preventDefault();
      }
      switch (event.code) {
        case "ArrowLeft":
          inputsRef.current.left = false;
          break;
        case "ArrowRight":
          inputsRef.current.right = false;
          break;
        case "ArrowDown":
          monkeyRef.current.isDucking = false;
          break;
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    startedAtRef.current = performance.now();
    lastSpawnRef.current = startedAtRef.current;
    lastFrameRef.current = startedAtRef.current;
    heartsRef.current = [];
    obstaclesRef.current = [];
    lastObstacleSpawnRef.current = performance.now();
    nextObstacleIntervalRef.current = OBSTACLE_SPAWN_INTERVAL;
    scoreRef.current = 0;
    setScore(0);

    let running = true;

    const renderFrame = (monkey: MonkeyState, width: number, height: number, ground: number) => {
      ctx.clearRect(0, 0, width, height);

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
      ctx.fillRect(0, ground + 1, width, 1.5);
      ctx.restore();

      ctx.save();
      ctx.fillStyle = heartTint;
      for (const heart of heartsRef.current) {
        drawHeart(ctx, heart.x, heart.y, heart.size);
      }
      ctx.restore();

      ctx.save();
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      for (const obstacle of obstaclesRef.current) {
        drawObstacle(ctx, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
      }
      ctx.restore();

      const sprite = spriteRef.current;

      if (sprite?.complete) {
        ctx.drawImage(sprite, monkey.x, monkey.y - MONKEY_HEIGHT, MONKEY_WIDTH, MONKEY_HEIGHT);
      } else {
        ctx.fillStyle = "#111";
        ctx.fillRect(monkey.x, monkey.y - MONKEY_HEIGHT, MONKEY_WIDTH, MONKEY_HEIGHT);
      }
    };

    const exitGame = () => {
      clearScheduledExit();
      if (!running) return;
      running = false;
      onExit();
    };
    exitGameRef.current = exitGame;

    const loop = (time: number) => {
      if (!running) {
        return;
      }

      const deltaMs = time - lastFrameRef.current;
      lastFrameRef.current = time;
      const delta = Math.min(Math.max(deltaMs / 1000, 0), 0.12);

      const elapsedSeconds = (time - startedAtRef.current) / 1000;
      const difficulty = Math.min(1 + elapsedSeconds * 0.045 + scoreRef.current * 0.012, DIFFICULTY_MAX);
      const heartSpeed = HEART_SPEED * difficulty;
      const obstacleSpeed = OBSTACLE_SPEED * difficulty;
      const heartSpawnInterval = HEART_SPAWN_INTERVAL / difficulty;
      const baseObstacleInterval = OBSTACLE_SPAWN_INTERVAL / (1 + (difficulty - 1) * 0.9);
      const obstacleSpawnInterval = nextObstacleIntervalRef.current ?? baseObstacleInterval;
      const spawnOverheadChance = Math.min(0.1 + elapsedSeconds * 0.01 + scoreRef.current * 0.006, 0.55);

      const { width, height, ground } = groundRef.current;
      const monkey = monkeyRef.current;
      const inputs = inputsRef.current;
      const currentMonkeyHeight = monkey.isDucking ? DUCK_HEIGHT : MONKEY_HEIGHT;
      monkey.height = currentMonkeyHeight;

      // update monkey horizontal movement
      const horizontalDirection = (inputs.right ? 1 : 0) - (inputs.left ? 1 : 0);
      const autoScroll = AUTO_SCROLL_SPEED * difficulty * delta;
      monkey.x += autoScroll + horizontalDirection * HORIZONTAL_SPEED * delta;
      monkey.x = Math.max(LEFT_MARGIN, Math.min(width - MONKEY_WIDTH - RIGHT_MARGIN, monkey.x));

      // apply gravity
      monkey.vy += GRAVITY * delta;
      monkey.y += monkey.vy * delta;

      if (monkey.y >= ground) {
        monkey.y = ground;
        monkey.vy = 0;
        monkey.canJump = true;
      } else {
        monkey.isDucking = false;
      }

      if (monkey.isDucking && monkey.y < ground) {
        monkey.isDucking = false;
      }

      // spawn hearts
      if (time - lastSpawnRef.current > heartSpawnInterval) {
        lastSpawnRef.current = time;
        const airborneRange = Math.max(18, Math.min(ground - HEART_SIZE - 10, 64));
        const heartHeight = Math.random() * airborneRange;
        heartsRef.current.push({
          x: -HEART_SIZE,
          y: Math.max(6, ground - HEART_SIZE - heartHeight),
          size: HEART_SIZE * (0.8 + Math.random() * 0.4),
        });
      }

      // update hearts and detect collisions
      const nextHearts: Heart[] = [];
      for (const heart of heartsRef.current) {
        heart.x += heartSpeed * delta;
        if (heart.x - heart.size > width + 24) {
          continue;
        }

        const heartLeft = heart.x;
        const heartRight = heart.x + heart.size;
        const heartTop = heart.y;
        const heartBottom = heart.y + heart.size * 0.9;

        const monkeyLeft = monkey.x + 6;
        const monkeyRight = monkey.x + MONKEY_WIDTH - 6;
        const monkeyBottom = monkey.y;
        const monkeyTopPadding = monkey.isDucking ? 2 : 8;
        const monkeyTop = monkeyBottom - currentMonkeyHeight + monkeyTopPadding;

        const collides =
          heartLeft < monkeyRight &&
          heartRight > monkeyLeft &&
          heartTop < monkeyBottom &&
          heartBottom > monkeyTop;

        if (collides) {
          scoreRef.current += 1;
          setScore(scoreRef.current);
          continue;
        }

        nextHearts.push(heart);
      }
      heartsRef.current = nextHearts;

      // spawn obstacles
      if (time - lastObstacleSpawnRef.current > obstacleSpawnInterval) {
        nextObstacleIntervalRef.current =
          baseObstacleInterval *
          (OBSTACLE_INTERVAL_JITTER_MIN +
            Math.random() * (OBSTACLE_INTERVAL_JITTER_MAX - OBSTACLE_INTERVAL_JITTER_MIN));
        lastObstacleSpawnRef.current = time;
        const allowOverhead = !isMobileRef.current;
        const spawnOverhead = allowOverhead && Math.random() < spawnOverheadChance;
        if (spawnOverhead) {
          const overheadY = Math.max(ground - MONKEY_HEIGHT - OVERHEAD_CLEARANCE - 2, 10);
          obstaclesRef.current.push({
            x: -OBSTACLE_WIDTH,
            y: overheadY,
            width: OBSTACLE_WIDTH + 12,
            height: OVERHEAD_HEIGHT,
            variant: "overhead",
          });
        } else {
          obstaclesRef.current.push({
            x: -OBSTACLE_WIDTH,
            y: ground - OBSTACLE_HEIGHT + 3,
            width: OBSTACLE_WIDTH,
            height: OBSTACLE_HEIGHT,
            variant: "ground",
          });
        }
      }

      // update obstacles
      const nextObstacles: Obstacle[] = [];
      let collidedWithObstacle = false;
      for (const obstacle of obstaclesRef.current) {
        obstacle.x += obstacleSpeed * delta;
        if (obstacle.x > width + 32) {
          continue;
        }

        const obsLeft = obstacle.x;
        const obsRight = obstacle.x + obstacle.width;
        const obsTop = obstacle.y;
        const obsBottom = obstacle.y + obstacle.height;

        const monkeyLeft = monkey.x + 4;
        const monkeyRight = monkey.x + MONKEY_WIDTH - 4;
        const monkeyBottom = monkey.y;
        const monkeyTop = monkeyBottom - currentMonkeyHeight + (monkey.isDucking ? 2 : 6);

        const collides =
          obsLeft < monkeyRight &&
          obsRight > monkeyLeft &&
          obsTop < monkeyBottom &&
          obsBottom > monkeyTop;

        if (collides) {
          collidedWithObstacle = true;
          continue;
        }

        nextObstacles.push(obstacle);
      }

      if (collidedWithObstacle) {
        obstaclesRef.current = nextObstacles;
        renderFrame(monkey, width, height, ground);
        if (!isGameOverRef.current) {
          isGameOverRef.current = true;
          gameOverTimeoutRef.current = window.setTimeout(() => {
            exitGame();
          }, GAME_OVER_FREEZE_DURATION);
        }
        return;
      }

      obstaclesRef.current = nextObstacles;

      renderFrame(monkey, width, height, ground);

      animationFrameRef.current = requestAnimationFrame(loop);
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      clearScheduledExit();
      isGameOverRef.current = false;
      pointerQuery.removeEventListener?.("change", handlePointerChange);
      pointerQuery.removeListener?.(handlePointerChange);
      window.removeEventListener("resize", handlePointerChange);
      resizeObserver.disconnect();
      exitGameRef.current = () => {};
    };
  }, [onExit]);

  return (
    <div className="relative flex h-10 w-full items-center justify-center px-2">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{ display: "block" }}
      />
      <div className="pointer-events-none absolute left-2.5 top-0.5 text-[9px] font-semibold uppercase tracking-[0.2em]">
        Score&nbsp;: {score}
      </div>
      <div className="pointer-events-none absolute bottom-0.5 left-2.5 right-2.5 text-[8px] uppercase tracking-[0.2em] opacity-80">
        ↑ pour sauter • ↓ pour se baisser • ← → pour ajuster • Évite les obstacles • Échap pour quitter
      </div>
      <button
        type="button"
        onClick={() => exitGameRef.current()}
        className="absolute right-2 top-0.5 rounded-full bg-black/15 px-2 py-0.5 text-[8px] font-semibold uppercase tracking-[0.2em] text-black/80 backdrop-blur transition hover:bg-black/25"
      >
        Quitter
      </button>
    </div>
  );
}
