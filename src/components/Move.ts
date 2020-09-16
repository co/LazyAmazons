


export class Move {
    start: string;
    end: string;
    arrow: string;
    previous: Move | undefined;

    constructor(start: string, end: string, arrow: string) {

        this.start = start;
        this.end = end;
        this.arrow = arrow;
    }

    toString(): string{
        return `${this.start}-${this.end}-${this.arrow}`
    }
}
