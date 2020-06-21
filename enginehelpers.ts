/// <reference path="protocols.ts" />
/// <reference path="primitives.ts" />
/// <reference path="mapobject.ts" />

namespace MapEngine {

    export function transformedJoints(object:MapObjects.IJoinable,position:MapObjects.Point):MapObjects.Point[] {
        let placeable = <MapObjects.IPlaceable><any>object;
        let joints = object.joints;
        //we have to rebuild these joints based on the position of the object.
        let matrix = new DOMMatrix();
        matrix.translateSelf(position.x,position.y);
        if((<MapObjects.MapObject><any>object).hasFeature(MapObjects.Feature.Rotateable)) {
            let rotateable = <MapObjects.IRotateable><any>object;
            matrix.translateSelf(rotateable.rotationCenter.x,rotateable.rotationCenter.y);
            matrix.rotateSelf(rotateable.rotation * (180/Math.PI));
            joints = joints.map((value:MapObjects.Point) => {
                let pt = value.subtractPoint(rotateable.rotationCenter);
                return pt;
            });
        }
        joints = joints.map((value:MapObjects.Point)=>{
            return MapObjects.Point.fromDOMPoint(matrix.transformPoint(value.toDOMPoint()));
        });
        return joints;
    }

    export function snapCandidate(a:MapObjects.Point[],b:MapObjects.Point[],scale:number,threshold:number):[MapObjects.Point,MapObjects.Point] {
        let result:[MapObjects.Point,MapObjects.Point] = null;
        a.forEach(pointA => {
            b.forEach(pointB => {
                let diff = pointB.subtractPoint(pointA);
                let scaledDiff = diff.scale(scale);
                if(scaledDiff.length() <= threshold) {
                    if (result != null) {
                        let compare = result[0].subtractPoint(result[1]);
                        if(compare.length() > diff.length()) {
                            result = [pointA,pointB];
                        }
                    } else {
                        result = [pointA,pointB];
                    }
                }
            });
        });
        return result;

    }

    export function renderObject(object:MapObjects.MapObject,context:CanvasRenderingContext2D) {
        context.save();
        if(object.hasFeature(MapObjects.Feature.Placeable)) {
            let casted = (object as any) as MapObjects.IPlaceable;
            context.translate(casted.position.x,casted.position.y);
        }
        if(object.hasFeature(MapObjects.Feature.Rotateable)) {
            let casted = (object as any) as MapObjects.IRotateable;
            context.rotate(casted.rotation);
        }
        object.draw(context);
        context.restore();
    }

    export function transformPointForHitTesting(pt:MapObjects.Point,object:MapObjects.MapObject) {
        let calculatedPoint = pt;
        if(object.hasFeature(MapObjects.Feature.Placeable)) {
            /*
            this is a placed object. we have to normalize to its location
            */
            let casted = <MapObjects.IPlaceable><any>(object);
            let matrix = new DOMMatrix();
            matrix.translateSelf(casted.position.x,casted.position.y);
            matrix.invertSelf();
            calculatedPoint = MapObjects.Point.fromDOMPoint(matrix.transformPoint(pt.toDOMPoint()));
        }
        if(object.hasFeature(MapObjects.Feature.Rotateable)) {
            /*
            this is a rotateable object. for easier hit testing we
            build a rotation matrix and invert it.
            that way we can bring the cursor back into a normalized hitbox.
            */
            let casted = <MapObjects.IRotateable><any>(object);
            let matrix = new DOMMatrix();
            //who could've thought that canvas and DOMMatrix use different angle scales
            matrix.rotateSelf(casted.rotation * (180/Math.PI));
            matrix.invertSelf();
            calculatedPoint = MapObjects.Point.fromDOMPoint(matrix.transformPoint(calculatedPoint.toDOMPoint()));
        }
        return calculatedPoint;
    }
}