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

        hovering:MapObject;
        pressed:boolean;
        shadowedPosition:Point;
        mousePosition:Point;

        getFeatures():Feature[] {
            return [Feature.Placeable,Feature.Joinable];
        }

        customFocusRenderer():boolean {
            return true;
        }

        handlesMouseEvents():boolean {
            return true;
        }

        draw(context:CanvasRenderingContext2D,focused:boolean,offscreencontext:CanvasRenderingContext2D) {
            if(focused) {
                offscreencontext.save();
                offscreencontext.clearRect(0,0,offscreencontext.canvas.width,offscreencontext.canvas.height);
                offscreencontext.translate(this.position.x,this.position.y);
                this.elements.forEach(object => {
                    if(object !== this.hovering) {
                        MapEngine.renderObject(object,offscreencontext);
                    }
                });
                    offscreencontext.globalCompositeOperation = "source-in";
                offscreencontext.fillStyle="#00A";
                offscreencontext.fillRect(-this.position.x,-this.position.y,offscreencontext.canvas.width,offscreencontext.canvas.height);
                offscreencontext.restore();

            }
            this.elements.forEach(object => {
                if(object !== this.hovering) {
                    MapEngine.renderObject(object,context);
                }
            });
            if(focused) {
                context.save();
                context.globalCompositeOperation="lighter";
                context.drawImage(offscreencontext.canvas,-this.position.x,-this.position.y);
                context.restore();
            }
            if(this.hovering != null) {
                MapEngine.renderObject(this.hovering,context);
            }
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

        mouseDown(pt:Point,button:number,engine:MapObjects.IEngine) {
            this.pressed = true;
        }

        mouseMove(pt:Point,engine:MapObjects.IEngine) {
            if(this.pressed && this.hovering.hasFeature(Feature.Placeable)) {
                let casted = <MapObjects.IPlaceable><any>(this.hovering);
                let pos = casted.position;
                if(this.shadowedPosition != null) {
                    pos = this.shadowedPosition;
                }
                let diff = pt.subtractPoint(this.mousePosition);
                pos = pos.addPoint(diff);
                /*
                as we now have the "new" position, we have to do a snap-test against "everything".
                */
                let snapPt = MapEngine.snapTest(this.hovering,pos,this.elements,engine.scaling);
                if(snapPt != null) {
                    casted.position=snapPt[0];
                    this.shadowedPosition = pos;
                } else {
                    this.shadowedPosition = null;
                    casted.position=pos;
                }
                engine.render();
            } else {
                this.hovering = null;
                this.elements.forEach(object => {
                    let converted = MapEngine.transformPointForHitTesting(pt,object);
                    if(object.hitTest(converted)) {
                        this.hovering = object;
                        engine.render()
                        //now i need to trigger a render run...
                    }
                });
            }
            this.mousePosition = pt;
        }

        mouseUp(pt:Point,button:number,engine:MapObjects.IEngine) {
            if(this.shadowedPosition == null && this.hovering != null) {
                //so... we have broken up the structure.
                //first things first: we have to get rid of the object.
                //therefore we have to translate the position of the object
                //back into the global space.
                if(this.hovering.hasFeature(Feature.Placeable)) {
                    let casted = <IPlaceable><any>this.hovering;
                    casted.position = casted.position.addPoint(this.position);                    
                }
                let idx = this.elements.indexOf(this.hovering);
                this.elements.splice(idx,1);
                engine.objects.push(this.hovering);
            }
            //as a result, we have to check for multiple things:
            /*
                * 1. is this structure down to one element? -> Remove the structure
                * 2. Did this break up the structure into two discrete structures? -> build a new structure
                * 3. Did the new structures each contain only one element? -> remove them.
                */
            //first: the complex part.
            let split = this.findDisconnectedElements();
            //first of all: let's remove all found elements from our own array.
            split.forEach(object => {
                let idx = this.elements.indexOf(object);
                this.elements.splice(idx,1);
            });
            if(split.length==1) {
                //this is a single object, so we have to "free it".
                let object = split[0];
                if(object.hasFeature(Feature.Placeable)) {
                    let cast = <IPlaceable><any>object;
                    cast.position = cast.position.addPoint(this.position);
                }
                engine.objects.push(object);
            } else if(split.length > 1) {
                //so now we have another set which we have to create a structure for.
                let structure = new Structure();
                structure.position=this.position;
                split.forEach(object => {
                    structure.addElement(object);
                });
                engine.objects.push(structure);
            }
            if(this.elements.length==1) {
                let object = this.elements[0];
                if(object.hasFeature(Feature.Placeable)) {
                    let casted = <IPlaceable><any>object;
                    casted.position = casted.position.addPoint(this.position);
                    engine.objects.push(object);
                    let idx = engine.objects.indexOf(this);
                    engine.objects.splice(idx,1);
                }
            }
            this.hovering=null;
            engine.render();
            this.pressed=false;
            this.shadowedPosition = null;
        }

        findDisconnectedElements():MapObject[] {
            let candidates = this.elements.slice();
            let found:MapObject[] = [this.elements[0]];
            candidates.splice(0,1);
            /*
             * here is the idea:
             * we pick a pivot element (first round: first wall.)
             * we compare every wall with the pivot element and check if they have a linked joint
             * if they are linked, remove the found wall from candidates and add it from found.
             * afterwards: pick a new pivot element from found and remove that wall from found again.
             * repeat until found is empty.
             */
            while(found.length>0) {
                let pivot = found[0];
                let pt = new Point(0,0);
                if(pivot.hasFeature(Feature.Placeable)) {
                    let cast = <IPlaceable><any>pivot;
                    pt = cast.position;
                }
                let joints = MapEngine.transformedJoints(<IJoinable><any>pivot,pt);
                found.splice(0,1);
                this.elements.forEach(object => {
                    if(object === pivot) {
                        return;
                    }
                    if(candidates.indexOf(object) == -1) {
                        //we already took care of this one.
                        return;
                    }
                    let pt = new Point(0,0);
                    if(object.hasFeature(Feature.Placeable)) {
                        let cast = <IPlaceable><any>object;
                        pt = cast.position;
                    }
                    let objjoints = MapEngine.transformedJoints(<IJoinable><any>object,pt);
                    for (let idx in joints) {
                        for(let objidx in objjoints) {
                            if((joints[idx].subtractPoint(objjoints[objidx]).length() < 2*Number.EPSILON)) {
                                //we found a joint.
                                let candidateidx = candidates.indexOf(object);
                                if(candidateidx != -1 ) {
                                    candidates.splice(candidateidx,1);
                                }
                                if(found.indexOf(object) == -1) {
                                    found.push(object);
                                }
                            }
                        }
                    }
                });
            }
            return candidates;
        }
    }
}