


export class Move {
    start: string;
    end: string;
    arrow: string;

    constructor(start: string, end: string, arrow: string) {

        this.start = start;
        this.end = end;
        this.arrow = arrow;
    }

    get id(): string {
        let id = ""
        return id += "." + this.toString();
    }

    toString(): string{
        return `${this.start}-${this.end}-${this.arrow}`
    }
}
