


export class Move {
    start: string;
    end: string;
    arrow: string;

    previous: Move | undefined;
    next: Move | undefined;

    constructor(start: string, end: string, arrow: string) {

        this.start = start;
        this.end = end;
        this.arrow = arrow;
    }

    get id(): string {
        let id = ""
        if(this.previous)
            id = this.previous.id
        return id += "." + this.toString();
    }

    toString(): string{
        return `${this.start}-${this.end}-${this.arrow}`
    }
}
