/// <reference path="primitives.ts" />
/// <reference path="mapobject.ts" />

namespace MapObjects {

    export interface IPlaceable {
        position:Point;
        area:Placement;
    }

    export interface IRotateable {
        /*
        The rotation angle, clockwise in radians. 
        You can use degree * Math.PI / 180 to 
        calculate a radian from a degree.
        */
       rotation:number;

        /*
        the center around which this object rotates.
        it's only purpose is to recalculate joint points if 
        nessecary.
        */
       rotationCenter:Point;
    }

    export interface IJoinable {
        joints:Point[];
    }

    export interface IEngine {
        objects:MapObject[];
        scaling:number
        render();
    }
}