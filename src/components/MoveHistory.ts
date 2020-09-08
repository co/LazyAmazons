import { Point } from './Point';
import { Move } from './Move';



export class MoveHistory {
    first: Move | undefined | null;
    current: Move | undefined | null;

    get list(): Move[] {
        const result=[]
        let current = this.first;
        while (current) {
            result.unshift(current)
            current = current?.next;
        }
        return result
    }

    get turnNumber(): number {
        if (!this.current) {
            return 1;
        }
        let current = this.first;
        let i = 2;
        while (current != this.current) {
            i++;
            current = current?.next;
        }
        return i;
    }

    constructor() {
        this.first = null;
        this.current = null;
    }

    reset() {
        this.first = null;
        this.current = null;
    }

    makeMove(start: Point, end: Point, arrow: Point) {
        const newMove = new Move(start.ToAN(), end.ToAN(), arrow.ToAN());
        if (!this.current) {
            this.first = newMove;
        }
        if (this.current) {
            this.current.next = newMove;
            newMove.previous = this.current;
        }
        this.current = newMove;
    }

    goBack() {
        const moveBacked = this.current;
        this.current = this.current?.previous;
        return moveBacked;
    }

    goNext() {
        if (!this.current) {
            this.current = this.first;
            return this.first;
        }
        if (this.current?.next) {
            this.current = this.current?.next;
            return this.current;
        }
        return null;
    }

}
