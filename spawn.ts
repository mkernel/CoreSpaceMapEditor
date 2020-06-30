/// <reference path="primitives.ts" />
/// <reference path="protocols.ts" />
/// <reference path="object.ts" />

namespace MapObjects {

    export class Spawnpoint extends Object {

        constructor(image:HTMLImageElement) {
            super(image);
            this.area = Placement.AroundMap;
        }

        draw(context:CanvasRenderingContext2D) {
            context.drawImage(this.image,0,-this.image.naturalHeight);
        }

        hitTest(pt:Point) {
            let region = new Rect(new Point(0,-this.image.naturalHeight),new Size(this.image.naturalWidth,this.image.naturalHeight));
            return region.containsPoint(pt);
        }
    }
}