<template>
  <canvas
    id="bard"
    style="border:1px solid black; image-erendering: crisp-edges"
    width="400"
    height="400"
  ></canvas>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import {
  AmazonsEngine,
  Point,
  Color,
  isWhiteAmazon,
  isBlackAmazon,
  SquareState,
} from "./AmazonsEngine";

enum TurnPhase {
  Start,
  AmazonMoving,
  WaitingToShoot,
}

class TurnState {
  private _phase = TurnPhase.Start;
  private _previousPosition: Point | null = null;
  private _positionToShootFrom: Point | null = null;

  get phase(): TurnPhase {
    return this._phase;
  }
  get previousPosition(): Point | null {
    return this._previousPosition;
  }
  get positionToShootFrom(): Point | null {
    return this._positionToShootFrom;
  }

  reset() {
    this._phase = TurnPhase.Start;
    this._previousPosition = null;
    this._positionToShootFrom = null;
  }

  startMovingAmazon(previousPostion: Point) {
    if (this._phase == TurnPhase.Start) {
      this._phase = TurnPhase.AmazonMoving;
      this._previousPosition = previousPostion;
    }
  }

  prepareToShoot(positionToShootFrom: Point) {
    if (this._phase == TurnPhase.AmazonMoving) {
      this._phase = TurnPhase.WaitingToShoot;
      this._positionToShootFrom = positionToShootFrom;
    }
  }
}

const Amazons = defineComponent({
  props: {
    size: Number,
  },
  data() {
    return {
      boardSize: 10,
      boardWidth: -1,
      squareSize: -1,
      boardOffset: new Point(0,0),
      canvas: (null as unknown) as HTMLCanvasElement,
      blackAmazons: [
        { x: 0, y: 3 },
        { x: 3, y: 0 },
        { x: 6, y: 0 },
        { x: 9, y: 3 },
      ],
      whiteAmazons: [
        { x: 0, y: 6 },
        { x: 3, y: 9 },
        { x: 6, y: 9 },
        { x: 9, y: 6 },
      ],
      blackAmazonImage: (null as unknown) as HTMLImageElement,
      whiteAmazonImage: (null as unknown) as HTMLImageElement,
      highlightedSquares: [] as Point[],
      turnState: new TurnState(),
      game: new AmazonsEngine(),
    };
  },

  mounted() {
    this.canvas = document.querySelector("canvas")!;
    this.updateBoardParameters();

    this.game.print();
    this.blackAmazonImage = new Image(700, 700);
    this.whiteAmazonImage = new Image(700, 700);
    this.blackAmazonImage.onload = () => {
      this.draw();
    }; //wasteful but eh.
    this.whiteAmazonImage.onload = () => {
      this.draw();
    };
    this.blackAmazonImage.src = require("../assets/queen_b.svg");
    this.whiteAmazonImage.src = require("../assets/queen_w.svg");

    window.onresize = () => {
      this.updateBoardParameters();
      this.draw();
    };
    this.canvas.onmousedown = this.onMouseDown;
    this.canvas.onmouseup = this.onMouseUp;
    this.canvas.onmousemove = this.onMouseMove;

    this.draw();
  },
  methods: {
    updateBoardParameters() {
      const shortestWindowSide = Math.min(
        window.innerWidth,
        window.innerHeight
      );
      this.squareSize = Math.max(Math.floor((shortestWindowSide -40) / this.boardSize), 4);
      this.boardWidth = this.squareSize * this.boardSize;
      this.canvas.width = this.boardWidth;
      this.canvas.height = this.boardWidth;
      this.squareSize = Math.floor(this.boardWidth / this.boardSize);
      const BB = this.canvas.getBoundingClientRect();
      this.boardOffset = new Point(BB.left, BB.top);
    },
    draw() {
      const ctx = this.canvas.getContext("2d")!;

      let x: number;
      let y: number;
      let isWhite = true;
      for (y = 0; y < this.boardSize; y++) {
        for (x = 0; x < this.boardSize; x++) {
          isWhite ? (ctx.fillStyle = "#EFEDD1") : (ctx.fillStyle = "#789656");
          ctx.fillRect(
            x * this.squareSize,
            y * this.squareSize,
            this.squareSize,
            this.squareSize
          );
          const squareState = this.game.getSquareState(new Point(x, y));
          this.drawSquareState(ctx, x, y, squareState);
          isWhite = !isWhite;
        }
        isWhite = !isWhite;
      }

      if (this.turnState.phase == TurnPhase.WaitingToShoot) {
        const movingAmazon = this.game.getSquareState(
          this.turnState.previousPosition!
        );
        const shootingPosition = this.turnState.positionToShootFrom!;
        this.drawSquareState(
          ctx,
          shootingPosition.x,
          shootingPosition.y,
          movingAmazon
        );
      }

      ctx.globalAlpha = 0.3;
      this.highlightedSquares.forEach((s) => {
        ctx.beginPath();
        ctx.arc(
          s.x * this.squareSize + this.squareSize / 2,
          s.y * this.squareSize + this.squareSize / 2,
          this.squareSize * 0.1,
          0,
          2 * Math.PI,
          false
        );
        ctx.fillStyle = "#ff6600";
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },

    drawSquareState(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      squareState: SquareState
    ) {
      if (isWhiteAmazon(squareState)) {
        this.drawAmazon(ctx, x, y, Color.White);
      } else if (isBlackAmazon(squareState)) {
        this.drawAmazon(ctx, x, y, Color.Black);
      } else if (squareState == SquareState.Arrow) {
        ctx.beginPath();
        ctx.arc(
          x * this.squareSize + this.squareSize / 2,
          y * this.squareSize + this.squareSize / 2,
          this.squareSize * 0.4,
          0,
          2 * Math.PI,
          false
        );
        ctx.fillStyle = "black";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(
          x * this.squareSize + this.squareSize / 2,
          y * this.squareSize + this.squareSize / 2,
          this.squareSize * 0.37,
          0,
          2 * Math.PI,
          false
        );
        ctx.fillStyle = "#aa1133";
        ctx.fill();
      }
    },

    drawAmazon(
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      color: Color
    ) {
      if (
        this.turnState.previousPosition?.x == x &&
        this.turnState.previousPosition?.y == y
      ) {
        ctx.globalAlpha = 0.3;
      }
      ctx.drawImage(
        color == Color.White ? this.whiteAmazonImage : this.blackAmazonImage,
        this.squareSize * x,
        this.squareSize * y,
        this.squareSize,
        this.squareSize
      );
      ctx.globalAlpha = 1;
    },

    coordinateToSquare(x: number, y: number) {
      return new Point(
        Math.floor(x / this.squareSize),
        Math.floor(y / this.squareSize)
      );
    },

    onMouseMove(e: MouseEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.AmazonMoving: {
          e.preventDefault();
          e.stopPropagation();
          this.draw();
          const ctx = this.canvas.getContext("2d")!;
          const mx = Math.round(e.clientX - this.boardOffset.x);
          const my = Math.round(e.clientY - this.boardOffset.y);
          const isMovingPieceWhite = isWhiteAmazon(
            this.game.getSquareState(this.turnState.previousPosition!)
          );

          ctx.drawImage(
            isMovingPieceWhite ? this.whiteAmazonImage : this.blackAmazonImage,
            mx - this.squareSize / 2,
            my - this.squareSize / 2,
            this.squareSize,
            this.squareSize
          );
          break;
        }
        default:
          break;
      }
    },

    onMouseDown(e: MouseEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.Start: {
          e.preventDefault();
          e.stopPropagation();


          const mx = Math.round(e.clientX - this.boardOffset.x);
          const my = Math.round(e.clientY - this.boardOffset.y);
          const boardPosition = this.coordinateToSquare(mx, my);

          if (this.game.turn == Color.White) {
            if (!isWhiteAmazon(this.game.getSquareState(boardPosition))) {
              return;
            }
          }

          if (this.game.turn == Color.Black) {
            if (!isBlackAmazon(this.game.getSquareState(boardPosition))) {
              return;
            }
          }

          this.turnState.startMovingAmazon(boardPosition);
          this.highlightedSquares = this.game.getPossibleQueenMovesFromPoint(
            boardPosition
          );
          this.draw();
          break;
        }

        default:
          break;
      }
    },
    onMouseUp(e: MouseEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.AmazonMoving: {
          e.preventDefault();
          e.stopPropagation();

          const mx = Math.round(e.clientX - this.boardOffset.x);
          const my = Math.round(e.clientY - this.boardOffset.y);
          const newPosition = this.coordinateToSquare(mx, my);

          const oldPosition = this.turnState.previousPosition!;
          if (this.game.isPointQueenMoveAway(oldPosition, newPosition)) {
            this.turnState.prepareToShoot(newPosition);
            this.highlightedSquares = this.game.getPossibleQueenMovesFromPointIgnoreObstacleAt(
              newPosition,
              oldPosition
            );
          } else {
            this.turnState.reset();
            this.highlightedSquares = [];
          }
          this.draw();
          break;
        }

        case TurnPhase.WaitingToShoot: {
          e.preventDefault();
          e.stopPropagation();

          const mx = Math.round(e.clientX - this.boardOffset.x);
          const my = Math.round(e.clientY - this.boardOffset.y);
          const arrowHitPosition = this.coordinateToSquare(mx, my);
          const previousPosition = this.turnState.previousPosition!;
          if (
            !(
              this.game.canShootAtPoint(
                this.turnState.positionToShootFrom!,
                arrowHitPosition,
                this.turnState.previousPosition!
              ) ||
              (previousPosition.x == arrowHitPosition.x &&
                previousPosition!.y == arrowHitPosition.y)
            )
          ) {
            this.turnState.reset();
            this.highlightedSquares = [];
            this.draw();
            return;
          }

          this.game.makeMove(
            this.turnState.previousPosition!,
            this.turnState.positionToShootFrom!,
            arrowHitPosition
          );
          this.turnState.reset();
          this.highlightedSquares = [];
          this.draw();
          break;
        }
        default:
          break;
      }
    },
  },
  computed: {
    viewBox(props: { size: number }): string {
      return `0 0 ${props.size * 20} ${props.size * 20} `;
    },
    squares() {
      const result = [];

      let x;
      let y;
      let isWhite = true;
      for (y = 0; y < this.boardSize; y++) {
        for (x = 0; x < this.boardSize; x++) {
          result.push({ x: x, y: y, isWhite: isWhite });
          isWhite = !isWhite;
        }
        isWhite = !isWhite;
      }
      return result;
    },
  },
});
export default Amazons;
</script>