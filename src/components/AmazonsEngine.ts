import { Point } from './Point'
import { Color } from './Color'
import { SquareState } from './SquareState'
import { MoveHistory } from './MoveHistory'

const UP = { x: 0, y: -1 }
const DOWN = { x: 0, y: 1 }
const LEFT = { x: -1, y: 0 }
const RIGHT = { x: 1, y: 0 }


const UP_LEFT = { x: -1, y: -1 }
const DOWN_LEFT = { x: -1, y: 1 }
const UP_RIGHT = { x: 1, y: -1 }
const DOWN_RIGHT = { x: 1, y: 1 }
const DIRECTIONS = [UP, DOWN, LEFT, RIGHT, UP_LEFT, DOWN_LEFT, UP_RIGHT, DOWN_RIGHT]

export function isWhiteAmazon(s: SquareState) {
    return [SquareState.White1, SquareState.White2, SquareState.White3, SquareState.White4].some(p => p == s)
}

export function isBlackAmazon(s: SquareState) {
    return [SquareState.Black1, SquareState.Black2, SquareState.Black3, SquareState.Black4].some(p => p == s)
}

export class AmazonsEngine {
    board: SquareState[][]
    history: MoveHistory
    crossStartPosition = [
        [SquareState.White1, "d1"],
        [SquareState.White2, "d10"],
        [SquareState.White3, "g1"],
        [SquareState.White4, "g10"],

        [SquareState.Black1, "a4"],
        [SquareState.Black2, "a7"],
        [SquareState.Black3, "j4"],
        [SquareState.Black4, "j7"]]

    amazonsStartPosition = [
        [SquareState.Black1, "a7"],
        [SquareState.Black2, "d10"],
        [SquareState.Black3, "g10"],
        [SquareState.Black4, "j7"],

        [SquareState.White1, "a4"],
        [SquareState.White2, "d1"],
        [SquareState.White3, "g1"],
        [SquareState.White4, "j4"]]

    get turn(): Color {
        return this.history.turnNumber % 2 == 1 ? Color.White : Color.Black
    }

    constructor() {
        this.board = []
        this.history = new MoveHistory()
        this.resetBoard(this.amazonsStartPosition)
    }

    private setEmptyBoard() {
        this.board = []
        for (let i = 0; i < 10; i++) {
            this.board[i] = [];
            for (let j = 0; j < 10; j++) {
                this.board[i][j] = SquareState.Empty
            }
        }
    }


    resetBoard(piecesStartLocations: any[]) {
        this.setEmptyBoard();
        piecesStartLocations.forEach(pl => {
            this.setSquareAn(pl[1], pl[0]);
        });
        this.history.reset();
    }

    playGameFromString(gameLog: string) {
        const squaresInAN = gameLog.match(/[abcdefghij](10|\d)/gm)!;
        const moves = [];
        while (squaresInAN.length >= 3) {
            moves.push({from: squaresInAN.shift()!, to: squaresInAN.shift()!, arrow: squaresInAN.shift()!})
        }

        let i = 0;
        let isCrossSetup = false;
        while(i < moves.length)
        {
            if(moves[i].from == "a4" || moves[i].from == "j4") {
                isCrossSetup = i % 2 == 1; //will be black on cross setup
                break;
            } else if(moves[i].from == "d10" || moves[i].from == "g10") {
                isCrossSetup = i % 2 == 0; //will be white on cross setup

                break;
            }
            i++
        }

        this.resetBoard(isCrossSetup ? this.crossStartPosition : this.amazonsStartPosition);
        moves.forEach((m) => this.makeMove(Point.fromAN(m.from), Point.fromAN(m.to), Point.fromAN(m.arrow)));
    }

    makeMove(start: Point, end: Point, arrow: Point) {
        if (!(this.isPointQueenMoveAway(start, end) && this.canShootAtPoint(end, arrow, start) ||
            start.x == arrow.x && start!.y == arrow.y)) {
            throw `Tried to make invalid move: start:${start} end:${end} arrow:${arrow}`
        }
        const amazon = this.board[start.y][start.x]
        if (amazon in [SquareState.Empty, SquareState.Arrow]) {
            throw "Tried to move amazon, but tile had no amazon. At tile: " + start
        }

        this.board[start.y][start.x] = SquareState.Empty;
        this.board[end.y][end.x] = amazon;
        this.board[arrow.y][arrow.x] = SquareState.Arrow;
        this.history.makeMove(start, end, arrow)
    }

    backMove() {
        const bm = this.history.goBack()
        console.log(bm)
        if (bm) {
            this.setSquareAn(bm.arrow, SquareState.Empty)
            this.setSquareAn(bm.start, this.getSquareState(Point.fromAN(bm.end)))
            this.setSquareAn(bm.end, SquareState.Empty)
        }
    }



    nextMove() {
        const nm = this.history.goNext()
        console.log(nm)
        if (nm) {
            this.setSquareAn(nm.end, this.getSquareState(Point.fromAN(nm.start)))
            this.setSquareAn(nm.start, SquareState.Empty)
            this.setSquareAn(nm.arrow, SquareState.Arrow)
        }
    }

    getSquareState(p: Point) {
        return this.board[p.y][p.x]
    }

    moveAmazon(start: Point, end: Point) {
        const startPiece = this.board[start.y][start.x]
        if (startPiece in [SquareState.Empty, SquareState.Arrow]) {
            throw "Tried to move amazon, but tile had no amazon. At tile: " + start
        }

        if (this.isPointQueenMoveAway(start, end)) {
            this.board[start.y][start.x] = SquareState.Empty
            this.board[end.y][end.x] = startPiece
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
        this.board[point.y][point.x] = state
    }

    IsSquareOnBoardAndEmpty(x: number, y: number) {
        if (x < 0 || x > 9 || y < 0 || y > 9) {
            return false
        }

        return this.board[y][x] == SquareState.Empty
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
                switch (this.board[i][j]) {
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