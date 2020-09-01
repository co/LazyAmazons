const UP = { x: 0, y: -1 }
const DOWN = { x: 0, y: 1 }
const LEFT = { x: -1, y: 0 }
const RIGHT = { x: 1, y: 0 }


const UP_LEFT = { x: -1, y: -1 }
const DOWN_LEFT = { x: -1, y: 1 }
const UP_RIGHT = { x: 1, y: -1 }
const DOWN_RIGHT = { x: 1, y: 1 }
const DIRECTIONS = [UP, DOWN, LEFT, RIGHT, UP_LEFT, DOWN_LEFT, UP_RIGHT, DOWN_RIGHT]

export enum Color {
    White,
    Black
}
export enum SquareState {
    Empty,
    Arrow,

    White1,
    White2,
    White3,
    White4,

    Black1,
    Black2,
    Black3,
    Black4,
}

export function isWhiteAmazon(s: SquareState)
{
    return [SquareState.White1, SquareState.White2, SquareState.White3, SquareState.White4].some(p => p == s)
}

export function isBlackAmazon(s: SquareState)
{
    return [SquareState.Black1, SquareState.Black2, SquareState.Black3, SquareState.Black4].some(p => p == s)
}


export class Point {
    x = 0
    y = 0

    constructor(x: number, y: number) {
        this.x = x
        this.y = y
    }
}

export class AmazonsEngine {
    board: SquareState[][]
    turnNumber: number

    get turn(): Color{
        return this.turnNumber % 2 == 0 ? Color.White : Color.Black
    }

    constructor() {
        this.board = []
        for (let i = 0; i < 10; i++) {
            this.board[i] = [];
            for (let j = 0; j < 10; j++) {
                this.board[i][j] = SquareState.Empty
            }
        }

        this.turnNumber = 0

        this.setSquareAn("a7", SquareState.Black1)
        this.setSquareAn("d10", SquareState.Black2)
        this.setSquareAn("g10", SquareState.Black3)
        this.setSquareAn("j7", SquareState.Black4)

        this.setSquareAn("a4", SquareState.White1)
        this.setSquareAn("d1", SquareState.White2)
        this.setSquareAn("g1", SquareState.White3)
        this.setSquareAn("j4", SquareState.White4)
    }

    makeMove(start: Point, end: Point, arrow: Point) {
        if(!(this.isPointQueenMoveAway(start, end) && this.canShootAtPoint(end, arrow, start) ||
        start.x == arrow.x && start!.y == arrow.y)){
            throw `Tried to make invalid move: start:${start} end:${end} arrow:${arrow}`
        }
        const amazon = this.board[start.y][start.x]
        if (amazon in [SquareState.Empty, SquareState.Arrow]) {
            throw "Tried to move amazon, but tile had no amazon. At tile: " + start
        }

        this.board[start.y][start.x] = SquareState.Empty;
        this.board[end.y][end.x] = amazon;
        this.board[arrow.y][arrow.x] = SquareState.Arrow;
        this.turnNumber++
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
        else{
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
        const point = this.squarePositonFromAN(positionAN)
        this.board[point.y][point.x] = state
    }

    squarePositonFromAN(n: string) {
        const possibleFiles = "abcdefghij"
        const file = n[0]
        file.toLowerCase()
        const rank = parseInt(n.slice(1))
        if (!possibleFiles.includes(file) || rank < 1 || rank > 10) {
            throw "Can't parse Algebraic Notation of: " + n
        }
        const x = possibleFiles.indexOf(file)
        const y = 10 - rank
        return new Point(x, y)
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