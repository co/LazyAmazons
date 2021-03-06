import { Point } from './Point'
import { Color } from './Color'
import { SquareState } from './SquareState'
import { ActionTypes, MutationTypes, Store } from '@/store'
import { Move } from './Move'

const UP = { x: 0, y: -1 }
const DOWN = { x: 0, y: 1 }
const LEFT = { x: -1, y: 0 }
const RIGHT = { x: 1, y: 0 }


const UP_LEFT = { x: -1, y: -1 }
const DOWN_LEFT = { x: -1, y: 1 }
const UP_RIGHT = { x: 1, y: -1 }
const DOWN_RIGHT = { x: 1, y: 1 }
const DIRECTIONS = [UP, DOWN, LEFT, RIGHT, UP_LEFT, DOWN_LEFT, UP_RIGHT, DOWN_RIGHT]

export function isAmazon(s: SquareState) {
    return s != SquareState.Empty && s != SquareState.Arrow
}

export function isWhiteAmazon(s: SquareState) {
    return [SquareState.White1, SquareState.White2, SquareState.White3, SquareState.White4].some(p => p == s)
}

export function isBlackAmazon(s: SquareState) {
    return [SquareState.Black1, SquareState.Black2, SquareState.Black3, SquareState.Black4].some(p => p == s)
}

export function cloneBoard(b: SquareState[][]) {
    return b.map(row => row.map(square => square))
}

export class Territories {
    _white = new Map<string, Point>()
    _black = new Map<string, Point>()
    _contested = new Map<string, Point>()
    _dead = new Map<string, Point>()

    get white(): Point[] { return Array.from(this._white.values()) }
    get black(): Point[] { return Array.from(this._black.values()) }
    get contested(): Point[] { return Array.from(this._contested.values()) }
    get dead(): Point[] { return Array.from(this._dead.values()) }

    static calculateFromBoard(board: SquareState[][]): Territories {
        const result = new Territories()
        const sideSize = board.length
        const unknown = new Map<string, Point>()
        for (let y = 0; y < sideSize; y++) {
            for (let x = 0; x < sideSize; x++) {
                unknown.set(new Point(x, y).toString(), new Point(x, y))
            }
        }
        let iterator = unknown.keys();
        while (unknown.size > 8) { //Only amazons will be in unknown by the end.
            let next = Point.fromString(iterator.next().value);
            while (isAmazon(board[next.y][next.x])) {
                const nextValue = iterator.next().value
                if (nextValue) {
                    next = Point.fromString(nextValue);
                }
                else {
                    console.log("How did we get here?")
                    return result
                }
            }

            const territoryWithAmazons = new Map<string, Point>(); // Will be populated by find Territory
            this.findTerritory(next, board, territoryWithAmazons, unknown, result._dead)
            const territoryWithAmazonsArray = Array.from(territoryWithAmazons.values());
            const hasWhiteAmazon = territoryWithAmazonsArray.some(p => isWhiteAmazon(board[p.y][p.x]));
            const hasBlackAmazon = territoryWithAmazonsArray.some(p => isBlackAmazon(board[p.y][p.x]));
            const territory = new Map([...territoryWithAmazons].filter(([s, p]) => !isAmazon(board[p.y][p.x])));
            if (hasBlackAmazon && hasWhiteAmazon) {
                for (const [str, point] of territory.entries()) { result._contested.set(str, point); unknown.delete(str) }
            } else if (hasWhiteAmazon) {
                for (const [str, point] of territory.entries()) { result._white.set(str, point); unknown.delete(str) }
            } else if (hasBlackAmazon) {
                for (const [str, point] of territory.entries()) { result._black.set(str, point); unknown.delete(str) }
            } else {
                for (const [str, point] of territory.entries()) { result._dead.set(str, point); unknown.delete(str) }
            }
            iterator = unknown.keys();
        }

        return result
    }

    private static findTerritory(point: Point, board: SquareState[][], territory: Map<string, Point>, unknown: Map<string, Point>, dead: Map<string, Point>): void {
        const pointStr = point.toString()
        if (!unknown.has(pointStr)) {
            return;
        }
        if (board[point.y][point.x] == SquareState.Arrow) {
            dead.set(pointStr, point)
            unknown.delete(pointStr)
            return;
        } else if (board[point.y][point.x] != SquareState.Empty) {
            return;
        }
        unknown.delete(pointStr)
        territory.set(pointStr, point)
        const visitQueue: Point[] = [];
        DIRECTIONS.forEach(d => {
            const neighbor = new Point(point.x + d.x, point.y + d.y);
            const neighborStr = neighbor.toString();
            if (unknown.has(neighborStr)) {
                switch (board[neighbor.y][neighbor.x]) {
                    case SquareState.Arrow:
                        unknown.delete(neighborStr)
                        dead.set(neighborStr, neighbor)
                        break;
                    case SquareState.Empty:
                        visitQueue.push(neighbor)
                        break;
                    default:// Add amazon to territory.
                        territory.set(neighborStr, neighbor)
                        break;
                }
            }
        });
        visitQueue.forEach(p => { this.findTerritory(p, board, territory, unknown, dead) });
        return;
    }
}

export class AmazonsEngine {
    store: Store
    crossStartPosition = [
        { state: SquareState.White1, point: "d1" },
        { state: SquareState.White2, point: "d10" },
        { state: SquareState.White3, point: "g1" },
        { state: SquareState.White4, point: "g10" },

        { state: SquareState.Black1, point: "a4" },
        { state: SquareState.Black2, point: "a7" },
        { state: SquareState.Black3, point: "j4" },
        { state: SquareState.Black4, point: "j7" }] as { state: SquareState; point: string }[]

    amazonsStartPosition = [
        { state: SquareState.Black1, point: "a7" },
        { state: SquareState.Black2, point: "d10" },
        { state: SquareState.Black3, point: "g10" },
        { state: SquareState.Black4, point: "j7" },

        { state: SquareState.White1, point: "a4" },
        { state: SquareState.White2, point: "d1" },
        { state: SquareState.White3, point: "g1" },
        { state: SquareState.White4, point: "j4" }] as { state: SquareState; point: string }[]

    startPosition = this.amazonsStartPosition

    get turn(): Color {
        // +2 to handle -1 case.
        return (this.store.getters.currentMoveNumber + 2) % 2 == 1 ? Color.White : Color.Black
    }

    constructor(store: Store) {
        this.store = store;
        this.resetBoard()
        this.store.dispatch(ActionTypes.RESET_MOVE_HISTORY);
    }

    private setEmptyBoard() {
        this.store.commit(MutationTypes.SET_EMPTY_BOARD)

    }


    resetBoard() {
        this.setEmptyBoard();
        this.startPosition.forEach(pl => {
            this.setSquareAn(pl.point, pl.state);
        });
    }

    playGameFromString(gameLog: string) {
        const squaresInAN = gameLog.match(/[abcdefghij](10|\d)/gm)!;
        const moves = [];
        while (squaresInAN.length >= 3) {
            moves.push({ from: squaresInAN.shift()!, to: squaresInAN.shift()!, arrow: squaresInAN.shift()! })
        }

        let i = 0;
        let isCrossSetup = false;
        while (i < moves.length) {
            if (moves[i].from == "a4" || moves[i].from == "j4") {
                isCrossSetup = i % 2 == 1; //will be black on cross setup
                break;
            } else if (moves[i].from == "d10" || moves[i].from == "g10") {
                isCrossSetup = i % 2 == 0; //will be white on cross setup

                break;
            }
            i++
        }
        this.startPosition = isCrossSetup ? this.crossStartPosition : this.amazonsStartPosition
        this.resetBoard();
        this.store.dispatch(ActionTypes.RESET_MOVE_HISTORY);
        moves.forEach((m) => this.makeMove(Point.fromAN(m.from), Point.fromAN(m.to), Point.fromAN(m.arrow)));
    }

    makeMove(start: Point, end: Point, arrow: Point) {
        if (!(this.isPointQueenMoveAway(start, end) && this.canShootAtPoint(end, arrow, start) ||
            start.x == arrow.x && start!.y == arrow.y)) {
            throw `Tried to make invalid move: start:${start} end:${end} arrow:${arrow}`
        }
        const amazon = this.store.getters.squareStateByPoint(start)
        if (amazon in [SquareState.Empty, SquareState.Arrow]) {
            throw "Tried to move amazon, but tile had no amazon. At tile: " + start
        }

        const newMove = new Move(start, end, arrow);
        this.store.dispatch(ActionTypes.MAKE_MOVE_ON_HISTORY, newMove)
    }

    backMove() {//move to action?
        const previousMoveNumber = this.store.getters.currentMoveNumber - 1
        if (previousMoveNumber == -1) {
            this.resetBoard();
            this.store.dispatch(ActionTypes.SET_CURRENT_MOVE_NUMBER, previousMoveNumber)
        }
        if (previousMoveNumber >= 0) {
            this.store.dispatch(ActionTypes.JUMP_TO_MOVE_NUMBER, previousMoveNumber);
        }
    }

    nextMove() {//move to action?

        if (this.store.getters.moves.length > this.store.getters.currentMoveNumber + 1) {
            this.store.dispatch(ActionTypes.JUMP_TO_MOVE_NUMBER, this.store.getters.currentMoveNumber + 1);
        }
    }


    moveAmazon(start: Point, end: Point) {
        const startPiece = this.store.getters.squareStateByPoint(start);
        if (startPiece in [SquareState.Empty, SquareState.Arrow]) {
            throw "Tried to move amazon, but tile had no amazon. At tile: " + start
        }

        if (this.isPointQueenMoveAway(start, end)) {
            this.store.commit(MutationTypes.SET_SQUARE_STATE, { point: start, squareState: SquareState.Empty })
            this.store.commit(MutationTypes.SET_SQUARE_STATE, { point: end, squareState: startPiece });
        }
        else {
            throw "Tried to move amazon, but the move was not legal. start: " + start
        }
    }

    isPointQueenMoveAway(start: Point, end: Point) {
        return this.getPossibleQueenMovesFromPoint(start).some((pm) => pm.x == end.x && pm.y == end.y)
    }

    canShootAtPoint(start: Point, end: Point, originalAmazonPosition: Point) {
        return this.getPossibleQueenMovesFromPointIgnoreObstacleAt(start, originalAmazonPosition).some((pm) => pm.x == end.x && pm.y == end.y)
    }

    setSquareAn(positionAN: string, state: SquareState) {
        const point = Point.fromAN(positionAN)
        this.store.commit(MutationTypes.SET_SQUARE_STATE, { point: point, squareState: state });
    }

    IsSquareOnBoardAndEmpty(x: number, y: number) {
        if (x < 0 || x > 9 || y < 0 || y > 9) {
            return false
        }

        return this.store.getters.squareStateByPoint(new Point(x, y)) == SquareState.Empty
    }

    getPossibleQueenMovesFromPoint(p: Point) {
        const possibleMoves: Point[] = []
        DIRECTIONS.forEach(d => {
            const position = new Point(p.x + d.x, p.y + d.y)
            while (this.IsSquareOnBoardAndEmpty(position.x, position.y)) {
                possibleMoves.push(new Point(position.x, position.y))
                position.x += d.x
                position.y += d.y
            }
        });
        return possibleMoves;
    }

    getPossibleQueenMovesFromPointIgnoreObstacleAt(p: Point, obstacleToIgnore: Point) {
        const possibleMoves: Point[] = []
        DIRECTIONS.forEach(d => {
            const position = new Point(p.x + d.x, p.y + d.y)
            while (this.IsSquareOnBoardAndEmpty(position.x, position.y) || (position.x == obstacleToIgnore.x && position.y == obstacleToIgnore.y)) {
                possibleMoves.push(new Point(position.x, position.y))
                position.x += d.x
                position.y += d.y
            }
        });
        return possibleMoves;
    }


    print() {
        let output = ""
        for (let i = 0; i < 10; i++) {
            for (let j = 0; j < 10; j++) {
                switch (this.store.getters.squareStateByPoint(new Point(j, i))) {
                    case SquareState.Empty:
                        output += ". "
                        break;
                    case SquareState.Arrow:
                        output += "X "
                        break;
                    case SquareState.Black1:
                    case SquareState.Black2:
                    case SquareState.Black3:
                    case SquareState.Black4:
                        output += "b "
                        break;
                    case SquareState.White1:
                    case SquareState.White2:
                    case SquareState.White3:
                    case SquareState.White4:
                        output += "b "
                        break;
                    default:
                        output += "? "
                        break;
                }
            }
            output += "\n"
        }
        console.log(output)
    }
}