/// <reference path="primitives.ts" />
/// <reference path="protocols.ts" />
/// <reference path="mapobject.ts" />
/// <reference path="enginehelpers.ts" />
/// <reference path="structure.ts" />

namespace MapEngine {

    export enum MouseState {
        idle = 0,
        primaryDown,
        primaryDownMoved,
    }

    export class Engine {
        canvas: HTMLCanvasElement;
        deleteButton:HTMLButtonElement;
        rotateButton:HTMLButtonElement;
        context: CanvasRenderingContext2D;
        renderingSize: MapObjects.Size;
        background: HTMLImageElement;
        mapSize: MapObjects.Size;
        scaling: number;
        offset: MapObjects.Point;
        interactionmatrix: DOMMatrix;

        offscreen: HTMLCanvasElement;
        offscreenContext: CanvasRenderingContext2D;

        objects:MapObjects.MapObject[] = [];
        hovering:MapObjects.MapObject;
        //if the current object snapped, this contains the "original" position for further calculation.
        shadowedPosition:MapObjects.Point;
        snappingTarget:MapObjects.MapObject;
        focused:MapObjects.MapObject;
        mousePosition:MapObjects.Point;
        mouseState:MouseState = MouseState.idle;
        

        constructor(canvas:HTMLCanvasElement,background:HTMLImageElement,deleteButton:HTMLButtonElement,rotateButton:HTMLButtonElement) {
            this.canvas = canvas;
            this.deleteButton=deleteButton;
            this.rotateButton=rotateButton;
            this.context = this.canvas.getContext("2d");
            this.renderingSize = new MapObjects.Size(this.canvas.width,this.canvas.height);
            this.background = background;
            this.mapSize = new MapObjects.Size(background.naturalWidth,background.naturalHeight);
            if(this.mapSize.width <= this.renderingSize.width && this.mapSize.height < this.renderingSize.height) {
                this.scaling = 1.0;
            } else {
                let scalingWidth = this.renderingSize.width / this.mapSize.width;
                let scalingHeight = this.renderingSize.height/ this.mapSize.height;
                this.scaling = Math.min(scalingWidth,scalingHeight);
            }
            let scaledSize = this.mapSize.scale(this.scaling);
            let diff = this.renderingSize.subtract(scaledSize);
            diff = diff.scale(0.5);
            this.offset = new MapObjects.Point(diff.width,diff.height);
            this.interactionmatrix = new DOMMatrix();
            this.interactionmatrix.translateSelf(this.offset.x,this.offset.y);
            this.interactionmatrix.scaleSelf(this.scaling,this.scaling);
            this.interactionmatrix.invertSelf();

            this.canvas.addEventListener('mousemove',this.onMouseMove);
            this.canvas.addEventListener('mousedown',this.onMouseDown);
            this.canvas.addEventListener('mouseup',this.onMouseUp);
            this.deleteButton.addEventListener('click',this.deleteClick);
            this.rotateButton.addEventListener('click',this.rotateClick);

            this.offscreen = document.createElement('canvas');
            document.body.appendChild(this.offscreen);
            this.offscreen.width=this.mapSize.width;
            this.offscreen.height=this.mapSize.height;
            this.offscreen.style.display="none";
            this.offscreenContext = this.offscreen.getContext('2d');

        }

        render() {
            this.context.save();
            this.context.fillStyle="white";
            this.context.fillRect(0,0,this.renderingSize.width,this.renderingSize.height);
            this.context.translate(this.offset.x,this.offset.y);
            this.context.scale(this.scaling,this.scaling);
            this.context.drawImage(this.background,0,0);
            this.objects.forEach(object => {
                this.context.save();
                let highlighted:HTMLCanvasElement;
                if(this.focused === object) {
                    this.offscreenContext.save();
                    this.offscreenContext.clearRect(0,0,this.mapSize.width,this.mapSize.height);
                    this.offscreenContext.fillStyle="#00F";
                    this.offscreenContext.fillRect(0,0,this.mapSize.width,this.mapSize.height);
                    this.offscreenContext.globalCompositeOperation = "destination-in";
                    renderObject(object,this.offscreenContext);
                    this.offscreenContext.restore();
                }
                else if(this.hovering === object) {
                    this.offscreenContext.save();
                    this.offscreenContext.clearRect(0,0,this.mapSize.width,this.mapSize.height);
                    //we need the rendered object in a new canvas
                    renderObject(object,this.offscreenContext);
                    //render the object
                    this.offscreenContext.globalCompositeOperation = "source-in";
                    this.offscreenContext.fillStyle="#888";
                    this.offscreenContext.fillRect(0,0,this.mapSize.width,this.mapSize.height);
                    this.offscreenContext.restore();
                }


                if(this.focused === object) {
                    this.context.drawImage(this.offscreen,0,0);
                } else {
                    renderObject(object,this.context);
                    if(this.hovering === object) {
                        this.context.globalCompositeOperation="lighter";
                        this.context.drawImage(this.offscreen,0,0);
                    }
                }
                this.context.restore();
            });
            this.context.restore();
        }

        onMouseMove: { (event:MouseEvent) : void } = (event:MouseEvent) => {
            //first off, we need the current position:
            let pt = new MapObjects.Point(event.offsetX,event.offsetY);
            let converted = MapObjects.Point.fromDOMPoint(this.interactionmatrix.transformPoint(pt.toDOMPoint()));
            let rect=new MapObjects.Rect(new MapObjects.Point(0,0),this.mapSize);
            if(rect.containsPoint(converted)) {
                if((this.mouseState == MouseState.primaryDown || this.mouseState==MouseState.primaryDownMoved) && this.hovering.hasFeature(MapObjects.Feature.Placeable)) {
                    /*
                    a pressed primary button WHILE moving means: drag and drop.
                    */
                    this.mouseState = MouseState.primaryDownMoved;
                    let casted = <MapObjects.IPlaceable><any>(this.hovering);
                    let pt = casted.position;
                    if(this.shadowedPosition != null) {
                        pt = this.shadowedPosition;
                    }
                    let diff = converted.subtractPoint(this.mousePosition);
                    pt = pt.addPoint(diff);
                    /*
                    as we now have the "new" position, we have to do a snap-test against "everything".
                    */
                    let snapPt = this.snapTest(this.hovering,pt);
                    if(snapPt != null) {
                        casted.position=snapPt;
                        this.shadowedPosition = pt;
                    } else {
                        this.shadowedPosition = null;
                        casted.position=pt;
                    }
                    this.render();
                } else {
                    /*
                    this is a "legitimate" point. So we should continue to work with it.
                    first things first: hit testing. 
                    we have to examine every object we know. However: objects may be rotated.
                    that makes hit testing a little more complex.
                    */
                    let hit: MapObjects.MapObject;
                    this.objects.forEach(object => {
                        let calculatedPoint = transformPointForHitTesting(converted,object);
                        if(object.hitTest(calculatedPoint)) {
                            hit = object;
                        }
                    });
                    /* 
                    we now have a hit object. therefore it's time to highlight it. of course.
                    */
                    if(hit !== this.hovering) {
                        this.hovering = hit;
                        this.render();
                    }
                }
                this.mousePosition = converted;
            }
        }

        snapTest(object:MapObjects.MapObject,newPoint:MapObjects.Point):MapObjects.Point {
            /*
            first things first: we have to calculate the current's objects snap points.
            therefore we have to check wether it has snap points or not.
             */
            if(!object.hasFeature(MapObjects.Feature.Joinable)) {
                return null;
            }
            let joinable = <MapObjects.IJoinable><any>object;
            let joints = transformedJoints(joinable,newPoint);
            let snapped=false;
            this.objects.forEach(candidate => {
                if(candidate === object || snapped) {
                    return;
                }
                if(candidate.hasFeature(MapObjects.Feature.Joinable)) {
                    let castedcandidate = <MapObjects.IJoinable><any>candidate;
                    let pt = new MapObjects.Point(0,0);
                    if(candidate.hasFeature(MapObjects.Feature.Placeable)) {
                        let placeable = <MapObjects.IPlaceable><any>candidate;
                        pt = placeable.position;
                    }
                    let candidatejoints = transformedJoints(castedcandidate,pt);
                    //now we have to find candidates.
                    let candidates = snapCandidate(joints,candidatejoints,this.scaling,20);
                    if(candidates != null) {
                        let diff = candidates[1].subtractPoint(candidates[0]);
                        newPoint = newPoint.addPoint(diff);
                        snapped = true;
                        this.snappingTarget = candidate;
                    }
                }
            });
            if(!snapped) {
                return null;
            }
            return newPoint;
        }

        onMouseDown: {(event:MouseEvent):void} = (event:MouseEvent) => {
            if(event.button == 0 && this.focused != null && this.hovering !== this.focused) {
                this.focused = null;
                this.render();
                $(this.deleteButton).hide();
                $(this.rotateButton).hide();
            }
            if(event.button == 0 && this.hovering != null) {
                //somebody drag'n'drops or clicks. we will find out.
                this.mouseState = MouseState.primaryDown;
                this.shadowedPosition=null;
            }
        }

        onMouseUp: {(event:MouseEvent):void} = (event:MouseEvent) => {
            if(this.mouseState == MouseState.primaryDown) {
                //this means the user has clicked. Soo... we need to focus the object.
                this.focused = this.hovering;
                this.render();
                $(this.deleteButton).show();
                if(this.focused.hasFeature(MapObjects.Feature.Rotateable)) {
                    $(this.rotateButton).show();
                }
            } else if(this.mouseState == MouseState.primaryDownMoved && this.shadowedPosition != null) {
                //so this is "the moment" to create a structure out of the new snapped element.
                if(this.snappingTarget instanceof MapObjects.Structure) {
                    this.snappingTarget.addElement(this.hovering);
                } else {
                    let structure = new MapObjects.Structure();
                    structure.position = new MapObjects.Point(0,0);
                    structure.addElement(this.snappingTarget);
                    structure.addElement(this.hovering);
                    this.objects.push(structure);
                    let idx = this.objects.indexOf(this.snappingTarget);
                    this.objects.splice(idx,1);
                }
                let idx = this.objects.indexOf(this.hovering);
                this.objects.splice(idx,1);
                this.render();
            } 
            this.mouseState = MouseState.idle;
            this.shadowedPosition=null;
        }

        deleteClick: {(event:MouseEvent) : void} = (event:MouseEvent) => {
            let idx = this.objects.indexOf(this.focused);
            this.objects.splice(idx, 1);
            this.focused = null;
            this.render();
        }

        rotateClick: {(event:MouseEvent):void} = (event:MouseEvent) => {
            let casted = <MapObjects.IRotateable><any>this.focused;
            let angles = [MapObjects.Angles.Zero,MapObjects.Angles.Fourtyfive,MapObjects.Angles.Ninety,MapObjects.Angles.HundredThirtyFive];
            let found=false;
            for(let angle in angles) {
                if(angles[angle] > casted.rotation) {
                    found=true;
                    casted.rotation=angles[angle];
                    this.render();
                    break;
                }
            }
            if(!found) {
                casted.rotation = MapObjects.Angles.Zero;
                this.render();
            }
        }

    }
}