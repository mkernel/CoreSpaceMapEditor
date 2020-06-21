/// <reference path="primitives.ts" />
/// <reference path="protocols.ts" />
/// <reference path="mapobject.ts" />
/// <reference path="wall.ts" />
/// <reference path="enginehelpers.ts" />

namespace MapObjects {
    export class Structure extends MapObject implements IPlaceable,IJoinable {
        elements:MapObject[] = [];
        position:Point;
        joints:Point[];

        getFeatures():Feature[] {
            return [Feature.Placeable,Feature.Joinable];
        }

        draw(context:CanvasRenderingContext2D) {
            this.elements.forEach(object => {
                MapEngine.renderObject(object,context);
            });
        }

        hitTest(pt:Point):boolean {
            //the point is already cleaned for the structures position itself.
            //HOWEVER, we have to delegate hit testing to every object. Fun!
            for(let idx in this.elements) {
                let object = this.elements[idx];
                let repositioned = MapEngine.transformPointForHitTesting(pt,object);
                if(object.hitTest(repositioned)) {
                    return true;
                }
            }
            return false;
        }

        addElement(object:MapObject) {
            if(object instanceof Structure) {
                let diff = object.position.subtractPoint(this.position);
                object.elements.forEach(object => {
                    if(object.hasFeature(Feature.Placeable)) {
                        let casted = <IPlaceable><any>object;
                        casted.position = casted.position.addPoint(diff);
                    }
                    this.elements.push(object);
                });
            } else {
                if(object.hasFeature(Feature.Placeable)) {
                    let cast = <IPlaceable><any>object;
                    cast.position = cast.position.subtractPoint(this.position);
                }
                this.elements.push(object);
            }
            this.rebuildJoints();
        }

        rebuildJoints() {
            //we have to calculate all joints, as walls are placed within our own coordinate system.
            //and rotated within it.
            let joints:Point[] = [];
            this.elements.forEach(object => {
                if(object.hasFeature(Feature.Joinable)) {
                    let casted = <IJoinable><any>object;
                    let pt = new Point(0,0);
                    if(object.hasFeature(Feature.Placeable)) {
                        pt = (<IPlaceable><any>object).position;
                    }
                    let objjoints = MapEngine.transformedJoints(casted,pt);
                    objjoints = objjoints.filter((value:Point):boolean => {
                        for(let idx in joints) {
                            let point = joints[idx];
                            let diff=point.subtractPoint(value);
                            if(diff.length() < 2*Number.EPSILON) {
                                return false;
                            }
                        }
                        return true;
                    })
                    joints = joints.concat(objjoints);
                }
            });
            this.joints = joints;
        }
    }
}