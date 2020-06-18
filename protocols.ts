/// <reference path="primitives.ts" />
namespace MapObjects {

    export interface IPlaceable {
        position:Point;
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
}