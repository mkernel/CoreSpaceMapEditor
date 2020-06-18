/// <reference path="primitives.ts" />
namespace MapObjects {

    export interface IPlaceable {
        position:Point;
    }

    export interface IRotateable {
        rotation:number;
    }

    export interface IJoinable {
        joints:Point[];
    }
}