/// <reference path="mapobject.ts" />
/// <reference types="jquery" />

namespace MapObjects {
    const $:JQueryStatic = (window as any)["jQuery"];

    export class Wall extends MapObject implements IPlaceable, IRotateable, IJoinable {
        position: Point;
        area:Placement;
        rotation: number;
        rotationCenter: Point;
        joints: Point[];
        image: HTMLImageElement;

        getFeatures():Feature[] {
            return [Feature.Placeable, Feature.Rotateable, Feature.Joinable];
        }

        constructor(image:HTMLImageElement) {
            super();
            this.area = Placement.OnMap;
            this.image = image;
            //for now, walls will only have two joints.
            let x1 = parseInt($(this.image).data("x1"));
            let y1 = parseInt($(this.image).data("y1"));
            let x2 = parseInt($(this.image).data("x2"));
            let y2 = parseInt($(this.image).data("y2"));
            this.joints = [new Point(x1,y1),new Point(x2,y2)]
            this.rotationCenter = this.joints[0];
        }

        draw(context:CanvasRenderingContext2D) {
            //we're rendeing around the first joint
            //that gives a more natural rotation.
            context.drawImage(this.image,-this.joints[0].x,-this.joints[0].y);
        }

        hitTest(pt:Point):boolean {
            let rect = new Rect(new Point(-this.joints[0].x,-this.joints[0].y),new Size(this.image.naturalWidth,this.image.naturalHeight));
            return rect.containsPoint(pt);
        }
    }
}