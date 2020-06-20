namespace MapObjects {
    export class Point {
        x:number;
        y:number;
        constructor(x:number,y:number){
            this.x=x;
            this.y=y;
        }

        toDOMPoint() :DOMPoint {
            return new DOMPoint(this.x,this.y);
        }

        static fromDOMPoint(pt:DOMPoint):Point {
            return new Point(pt.x,pt.y);
        }

        addSize(size:Size):Point {
            return new Point(this.x+size.width,this.y+size.height);
        }

        subtractPoint(pt:Point): Point {
            return new Point(this.x-pt.x,this.y-pt.y);
        }

        addPoint(pt:Point): Point {
            return new Point(this.x+pt.x,this.y+pt.y);
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

    export class Rect {
        origin:Point;
        size:Size;

        constructor(origin:Point,size:Size) {
            this.origin=origin;
            this.size=size;
        }

        containsPoint(pt:Point): boolean {
            let upper = this.origin.addSize(this.size)
            if(pt.x >= this.origin.x 
                && pt.y >= this.origin.y
                && pt.x < upper.x
                && pt.y < upper.y) {
                return true;
            }
            return false;
        }
    }

    export enum Feature {
        Placeable = 1,
        Rotateable,
        Joinable
    }

    export enum Angles {
        Zero = 0,
        Fourtyfive = 45.0 * Math.PI / 180,
        Ninety = 90.0 * Math.PI / 180,
        HundredThirtyFive = 135.0 * Math.PI / 180,
    }
}