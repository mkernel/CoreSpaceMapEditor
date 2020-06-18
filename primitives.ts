namespace MapObjects {
    export class Point {
        x:number;
        y:number;
        constructor(x:number,y:number){
            this.x=x;
            this.y=y;
        }
    }

    export class Size {
        width:number;
        height:number;
        constructor(width:number, height: number) {
            this.width=width;
            this.height=height;
        }

        scale(factor:number):Size {
            return new Size(this.width*factor,this.height*factor);
        }

        subtract(other:Size):Size {
            return new Size(this.width-other.width,this.height-other.height);
        }
    }

    export enum Feature {
        Placeable = 1,
        Rotateable,
        Joinable
    }
}