namespace MapObjects {
    export class Point {
        x:number;
        y:number;
        constructor(x:number,y:number){
            this.x=x;
            this.y=y;
        }
    }

    export enum Feature {
        Placeable = 1,
        Rotateable,
        Joinable
    }
}