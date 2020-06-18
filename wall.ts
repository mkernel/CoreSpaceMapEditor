/// <reference path="mapobject.ts" />
/// <reference types="jquery" />

namespace MapObjects {
    const $:JQueryStatic = (window as any)["jQuery"];

    export class Wall extends MapObject implements IPlaceable, IRotateable, IJoinable {
        position: Point;
        rotation: number;
        joints: Point[];
        image: HTMLImageElement;

        getFeatures():Feature[] {
            return [Feature.Placeable, Feature.Rotateable, Feature.Joinable];
        }

        constructor(image:HTMLImageElement) {
            super();
            this.image = image;
            //for now, walls will only have two joints.
            let x1 = parseInt($(this.image).data("x1"));
            let y1 = parseInt($(this.image).data("y1"));
            let x2 = parseInt($(this.image).data("x2"));
            let y2 = parseInt($(this.image).data("y2"));
            this.joints = [new Point(x1,y1),new Point(x2,y2)]
        }

        draw(context:CanvasRenderingContext2D) {
            //we're rendeing around the first joint
            //that gives a more natural rotation.
            context.drawImage(this.image,-this.joints[0].x,-this.joints[0].y);
        }
    }
}