
export class Point {
    x = 0;
    y = 0;

    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

    toAN(): string {
        const possibleFiles = "abcdefghij";
        return possibleFiles[this.x] + (10 - this.y);
    }

    toString(): string {
        return `${this.x},${this.y}`
    }

    static fromString(s: string): Point {
        const substrings = s.split(",")
        return new Point(parseInt(substrings[0]), parseInt(substrings[1]))
    }

    static fromAN(n: string) {
        const possibleFiles = "abcdefghij";
        const file = n[0];
        file.toLowerCase();
        const rank = parseInt(n.slice(1));
        if (!possibleFiles.includes(file) || rank < 1 || rank > 10) {
            throw "Can't parse Algebraic Notation of: " + n;
        }
        const x = possibleFiles.indexOf(file);
        const y = 10 - rank;
        return new Point(x, y);
    }
}
