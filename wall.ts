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
            let y1 = parseInt($(this.image).data("x2"));
            let x2 = parseInt($(this.image).data("x2"));
            let y2 = parseInt($(this.image).data("y2"));
            this.joints = [new Point(x1,y1),new Point(x2,y2)]
        }
    }
}