<template>
  <canvas id="board" width="400" height="400"></canvas>
  <div id="controlsColumn" style="text-align: center; background:">
    <button class="ghost-button" @click="stepToPreviousMove">prev</button>
    <button class="ghost-button" @click="loadGameFromClipboard">load</button>
    <button class="ghost-button" @click="stepToNextMove">next</button>
    <p/>
    <div style="width=110px; display: inline-block;">
      <div style=" width=110px">
        <div class="territoryCounterLeft blackOnWhite">White</div>
        <div class="territoryCounterRight blackOnWhite">{{whiteTerritoryNumber}}</div>
      </div>
      <div style="width=110px; display: table;">
        <div class="territoryCounterLeft whiteOnGrey">Contested</div>
        <div class="territoryCounterRight whiteOnGrey">{{contestedTerritoryNumber}}</div>
      </div>
      <div style="width=110px; display: table;">
        <div class="territoryCounterLeft whiteOnBlack">Black</div>
        <div class="territoryCounterRight whiteOnBlack">{{blackTerritoryNumber}}</div>
      </div>
    </div>
    <p/>
    <div class="toggleWithDescription">
      <div class="toggleDescription">Territory visualization</div>
      <div class="onoffswitch">
        <input
          type="checkbox"
          name="onoffswitch"
          class="onoffswitch-checkbox"
          id="myonoffswitch"
          tabindex="0"
          v-model="isTerritoryVisualizationEnabled"
          @change="isTerritoryVisualizationEnabledChanged($event)"
        />
        <label class="onoffswitch-label" for="myonoffswitch"></label>
      </div>
    </div>
  </div>
</template>
<script lang="ts">
import { defineComponent } from "vue";
import { Point } from "./Point";
import { Color } from "./Color";
import { SquareState } from "./SquareState";
import HistoryList from "./HistoryList.vue";
import {
  AmazonsEngine,
  isWhiteAmazon,
  isBlackAmazon,
  Territories,
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
      legalPositions: [] as Point[],
      turnState: new TurnState(),
      game: new AmazonsEngine(),
      currentTerritory: new Territories(),
      isTerritoryVisualizationEnabled: false,
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
    this.canvas.addEventListener("touchstart", this.onTouchStart);
    this.canvas.addEventListener("touchmove", this.onTouchMove);
    this.canvas.addEventListener("touchend", this.onTouchEnd);
    document.addEventListener("keydown", this.onKeyDown);
    this.calculateTerritory();
    this.draw();
  },
  methods: {
    calculateTerritory() {
      this.currentTerritory = Territories.calculateFromBoard(this.game.board);
    },
    updateBoardParameters() {
      const shortestWindowSide = Math.min(
        window.innerWidth,
        window.innerHeight
      );
      this.squareSize = Math.max(
        Math.floor((shortestWindowSide - 40) / this.boardSize),
        4
      );
      this.boardWidth = this.squareSize * this.boardSize;
      this.canvas.width = this.boardWidth;
      this.canvas.height = this.boardWidth;
      this.squareSize = Math.floor(this.boardWidth / this.boardSize);
    },
    resetTurnState() {
      this.legalPositions = [];
      this.turnState.reset();
    },
    stepToPreviousMove() {
      this.resetTurnState();
      this.game.backMove();
      this.calculateTerritory(); //todo: the move should trigger this!
      this.draw();
    },

    stepToNextMove() {
      this.resetTurnState();
      this.game.nextMove();
      this.calculateTerritory(); //todo: the move should trigger this!
      this.draw();
    },

    loadGameFromClipboard() {
      this.resetTurnState();
      navigator.clipboard.readText().then((text) => {
        this.game.playGameFromString(text);
        this.calculateTerritory(); //todo: the move should trigger this!
        this.draw();
      });
    },
    draw() {
      const ctx = this.canvas.getContext("2d")!;

      this.drawEmptyBoard(ctx);
      this.drawPreviousMoveHighlight(ctx);
      if (this.isTerritoryVisualizationEnabled) {
        this.drawTerritory(ctx);
      }
      this.drawAllSquareStates(ctx);

      this.drawShootingAmazon(ctx);
      this.drawLegalPositions(ctx);
    },

    drawTerritory(ctx: CanvasRenderingContext2D) {
      ctx.fillStyle = "#ccddff";
      ctx.globalAlpha = 0.65;
      this.currentTerritory.white.forEach((p) => {
        ctx.fillRect(
          p.x * this.squareSize,
          p.y * this.squareSize,
          this.squareSize,
          this.squareSize
        );
      });
      ctx.fillStyle = "#001122";
      this.currentTerritory.black.forEach((p) => {
        ctx.fillRect(
          p.x * this.squareSize,
          p.y * this.squareSize,
          this.squareSize,
          this.squareSize
        );
      });
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#2e2f35";
      this.currentTerritory.dead.forEach((p) => {
        ctx.fillRect(
          p.x * this.squareSize,
          p.y * this.squareSize,
          this.squareSize,
          this.squareSize
        );
      });
    },

    drawLegalPositions(ctx: CanvasRenderingContext2D) {
      ctx.globalAlpha = 0.2;
      this.legalPositions.forEach((s) => {
        ctx.beginPath();
        ctx.arc(
          s.x * this.squareSize + this.squareSize / 2,
          s.y * this.squareSize + this.squareSize / 2,
          this.squareSize * 0.1,
          0,
          2 * Math.PI,
          false
        );
        ctx.fillStyle = "#00bbff";
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    },
    drawShootingAmazon(ctx: CanvasRenderingContext2D) {
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
    },
    drawEmptyBoard(ctx: CanvasRenderingContext2D) {
      let x: number;
      let y: number;
      let isWhite = true;
      for (y = 0; y < this.boardSize; y++) {
        for (x = 0; x < this.boardSize; x++) {
          isWhite ? (ctx.fillStyle = "#F0D9B5") : (ctx.fillStyle = "#B58863");
          //isWhite ? (ctx.fillStyle = "#EFEDD1") : (ctx.fillStyle = "#789656");
          ctx.fillRect(
            x * this.squareSize,
            y * this.squareSize,
            this.squareSize,
            this.squareSize
          );
          const squareState = this.game.getSquareState(new Point(x, y));
          isWhite = !isWhite;
        }
        isWhite = !isWhite;
      }
    },

    drawPreviousMoveHighlight(ctx: CanvasRenderingContext2D) {
      const lastMove = this.game.history.current;
      if (!lastMove) {
        return;
      }

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "#77ee33";
      const highlights = [
        Point.fromAN(lastMove.start!),
        Point.fromAN(lastMove.end!),
        Point.fromAN(lastMove.arrow!),
      ];

      highlights.forEach((hl) => {
        ctx.fillRect(
          hl.x * this.squareSize,
          hl.y * this.squareSize,
          this.squareSize,
          this.squareSize
        );
      });
      ctx.globalAlpha = 1;
    },

    drawAllSquareStates(ctx: CanvasRenderingContext2D) {
      let x: number;
      let y: number;
      for (y = 0; y < this.boardSize; y++) {
        for (x = 0; x < this.boardSize; x++) {
          this.drawSquareState(
            ctx,
            x,
            y,
            this.game.getSquareState(new Point(x, y))
          );
        }
      }
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
      } else if (
        squareState == SquareState.Arrow &&
        !this.isTerritoryVisualizationEnabled
      ) {
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
        ctx.fillStyle = "#888888";
        ctx.fill();
        /*ctx.fillStyle = "#2e2f35";
        ctx.fillRect(
          x * this.squareSize,
          y * this.squareSize,
          this.squareSize,
          this.squareSize
        );
        */
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

    drawFloatingAmazon(
      x: number,
      y: number,
      pieceSize: number,
      isTouch: boolean
    ) {
      this.draw();
      const ctx = this.canvas.getContext("2d")!;
      const isMovingPieceWhite = isWhiteAmazon(
        this.game.getSquareState(this.turnState.previousPosition!)
      );
      if (isTouch) {
        const s = this.coordinateToSquare(x, y);
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(
          s.x * this.squareSize + this.squareSize / 2,
          s.y * this.squareSize + this.squareSize / 2,
          this.squareSize * 1.2,
          0,
          2 * Math.PI,
          false
        );
        ctx.fillStyle = "#000000";
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      ctx.drawImage(
        isMovingPieceWhite ? this.whiteAmazonImage : this.blackAmazonImage,
        x - pieceSize / 2,
        isTouch ? y - pieceSize * 1.2 : y - pieceSize / 2,
        pieceSize,
        pieceSize
      );
    },

    getMousePosition(e: MouseEvent) {
      const BB = this.canvas.getBoundingClientRect();
      const boardOffset = new Point(BB.left, BB.top);
      const mx = Math.round(e.clientX - boardOffset.x);
      const my = Math.round(e.clientY - boardOffset.y);
      return { x: mx, y: my };
    },

    getTouchPosition(tl: TouchList) {
      const BB = this.canvas.getBoundingClientRect();
      const boardOffset = new Point(BB.left, BB.top);
      const tx = Math.round(tl[0].clientX - boardOffset.x);
      const ty = Math.round(tl[0].clientY - boardOffset.y);
      return { x: tx, y: ty };
    },

    onMouseMove(e: MouseEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.AmazonMoving: {
          e.preventDefault();
          e.stopPropagation();
          const mp = this.getMousePosition(e);
          this.drawFloatingAmazon(mp.x, mp.y, this.squareSize, false);
          break;
        }
      }
    },

    onTouchMove(e: TouchEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.AmazonMoving: {
          e.preventDefault();
          e.stopPropagation();
          const tp = this.getTouchedPoint(e.touches);
          this.drawFloatingAmazon(tp.x, tp.y, this.squareSize * 1.7, true);
          break;
        }
      }
    },

    getTouchedPoint(tl: TouchList) {
      const tp = this.getTouchPosition(tl);
      return this.coordinateToSquare(tp.x, tp.y);
    },

    getPointAtMouse(e: MouseEvent) {
      const mp = this.getMousePosition(e);
      return this.coordinateToSquare(mp.x, mp.y);
    },

    onTouchStart(e: TouchEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.Start: {
          e.preventDefault();
          e.stopPropagation();

          this.tryStartMoveAmazon(this.getTouchedPoint(e.touches));

          this.draw();
        }
      }
    },

    tryStartMoveAmazon(boardPosition: Point) {
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
      this.legalPositions = this.game.getPossibleQueenMovesFromPoint(
        boardPosition
      );
    },
    onMouseDown(e: MouseEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.Start: {
          e.preventDefault();
          e.stopPropagation();

          const mp = this.getMousePosition(e);
          this.tryStartMoveAmazon(this.coordinateToSquare(mp.x, mp.y));
          this.draw();
          break;
        }
      }
    },
    onKeyDown(e: KeyboardEvent) {
      const key = e.which || e.keyCode; // keyCode detection
      const ctrl = e.ctrlKey ? e.ctrlKey : key === 17 ? true : false; // ctrl detection

      if (key == 86 && ctrl) {
        this.loadGameFromClipboard();
      } else if (e.code === "ArrowRight") this.stepToNextMove();
      else if (e.code === "ArrowLeft") this.stepToPreviousMove();
    },
    onTouchEnd(e: TouchEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.AmazonMoving: {
          e.preventDefault();
          e.stopPropagation();

          this.tryMakeFirstPartOfMoveByMovingAmazon(
            this.getTouchedPoint(e.changedTouches)
          );
          this.draw();
          break;
        }

        case TurnPhase.WaitingToShoot: {
          e.preventDefault();
          e.stopPropagation();

          this.tryFinishMoveShootingAtPosition(
            this.getTouchedPoint(e.changedTouches)
          );
          this.draw();
          break;
        }
      }
    },

    tryFinishMoveShootingAtPosition(arrowHitPosition: Point) {
      const previousPosition = this.turnState.previousPosition!;
      if (
        this.game.canShootAtPoint(
          this.turnState.positionToShootFrom!,
          arrowHitPosition,
          this.turnState.previousPosition!
        )
      ) {
        this.game.makeMove(
          this.turnState.previousPosition!,
          this.turnState.positionToShootFrom!,
          arrowHitPosition
        );
        this.calculateTerritory(); //todo: the move should trigger this!
      }
      this.resetTurnState();
    },

    tryMakeFirstPartOfMoveByMovingAmazon(newPosition: Point) {
      const oldPosition = this.turnState.previousPosition!;
      if (this.game.isPointQueenMoveAway(oldPosition, newPosition)) {
        this.turnState.prepareToShoot(newPosition);
        this.legalPositions = this.game.getPossibleQueenMovesFromPointIgnoreObstacleAt(
          newPosition,
          oldPosition
        );
      } else {
        this.resetTurnState();
      }
    },
    onMouseUp(e: MouseEvent) {
      switch (this.turnState.phase) {
        case TurnPhase.AmazonMoving: {
          e.preventDefault();
          e.stopPropagation();

          this.tryMakeFirstPartOfMoveByMovingAmazon(this.getPointAtMouse(e));
          this.draw();
          break;
        }

        case TurnPhase.WaitingToShoot: {
          e.preventDefault();
          e.stopPropagation();

          this.tryFinishMoveShootingAtPosition(this.getPointAtMouse(e));
          this.draw();
          break;
        }
      }
    },
    isTerritoryVisualizationEnabledChanged(e: ListeningStateChangedEvent) {
      this.draw();
    },
  },
  computed: {
    blackTerritoryNumber(): number {
      return this.currentTerritory.black.length;
    },
    whiteTerritoryNumber(): number {
      return this.currentTerritory.white.length;
    },
    contestedTerritoryNumber(): number {
      return this.currentTerritory.contested.length;
    },
  },
});

export default Amazons;
</script>