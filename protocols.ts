/// <reference path="primitives.ts" />
namespace MapObjects {

    export interface IPlaceable {
        position:Point;
    }

    export interface IRotateable {
        rotation:number;
        /*
        The rotation angle, clockwise in radians. 
        You can use degree * Math.PI / 180 to 
        calculate a radian from a degree.
        */
    }

    export interface IJoinable {
        joints:Point[];
    }
}