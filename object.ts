/// <reference path="primitives.ts" />
/// <reference path="protocols.ts" />
/// <reference path="mapobject.ts" />

namespace MapObjects {
    export class Object extends MapObject implements IPlaceable,IRotateable {
        position:Point;
        rotation:number;
        rotationCenter:Point;
        image: HTMLImageElement;

        getFeatures() {
            return [Feature.Placeable,Feature.Rotateable];
        }

        constructor(image:HTMLImageElement) {
            super()
            this.image = image;
            this.rotationCenter = new Point(image.naturalWidth/2,image.naturalHeight/2);
        }

        draw(context:CanvasRenderingContext2D) {
            context.drawImage(this.image,-this.image.naturalWidth/2,-this.image.naturalHeight/2);
        }

        hitTest(pt:Point) {
            let region = new Rect(new Point(-this.image.naturalWidth/2,-this.image.naturalHeight/2),new Size(this.image.naturalWidth,this.image.naturalHeight));
            return region.containsPoint(pt);
        }
    }
}