import { Point } from './Point';
import { SquareState } from './SquareState';


export class MoveState {
    move: Move;
    boardState: SquareState[][]
    constructor(move: Move, boardState: SquareState[][]) {
        this.move = move;
        this.boardState = boardState
    }
}

export class Move {
    start: Point;
    end: Point;
    arrow: Point;
    previous: Move | undefined;

    constructor(start: Point, end: Point, arrow: Point) {

        this.start = start;
        this.end = end;
        this.arrow = arrow;
    }

    toString(): string{
        return `${this.start.toAN()}-${this.end.toAN()}-${this.arrow.toAN()}`
    }
}
