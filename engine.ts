/// <reference path="primitives.ts" />
/// <reference path="protocols.ts" />
/// <reference path="mapobject.ts" />
/// <reference path="enginehelpers.ts" />
/// <reference path="structure.ts" />
/// <reference path="setcalculator.ts" />

namespace MapEngine {

    export enum MouseState {
        idle = 0,
        primaryDown,
        primaryDownMoved,
    }

    export class Engine implements MapObjects.IEngine {
        canvas: HTMLCanvasElement;
        deleteButton:HTMLButtonElement;
        rotateButton:HTMLButtonElement;
        context: CanvasRenderingContext2D;
        renderingSize: MapObjects.Size;
        background: HTMLImageElement;
        background1x: HTMLImageElement;
        background2x: HTMLImageElement;
        mapSize: MapObjects.Size;
        totalSize: MapObjects.Size;
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
        
        setCalculator = new Sets.SetCalculator();
        frameFinished: {():void};

        constructor(canvas:HTMLCanvasElement,background1x:HTMLImageElement,background2x:HTMLImageElement,deleteButton:HTMLButtonElement,rotateButton:HTMLButtonElement) {
            this.canvas = canvas;
            this.deleteButton=deleteButton;
            this.rotateButton=rotateButton;
            this.context = this.canvas.getContext("2d");
            this.background1x = background1x;
            this.background2x = background2x;
            this.background = this.background1x;
            if(this.deleteButton != null) {
                this.deleteButton.addEventListener('click',this.deleteClick);
            }
            if(this.rotateButton != null) {
                this.rotateButton.addEventListener('click',this.rotateClick);
            }
            this.offscreen = document.createElement('canvas');
            document.body.appendChild(this.offscreen);
            this.offscreen.style.display="none";

            this.configure();

        }

        is2x():boolean {
            return this.background === this.background2x;
        }

        setup1x() {
            if(this.background === this.background1x) {
                //we have nothing to do.
            } else {
                //we have to calculate the factor to switch from 2x to 1x.
                let size2x = new MapObjects.Size(this.background2x.naturalWidth+2*69,this.background2x.naturalHeight+2*69);
                let size1x = new MapObjects.Size(this.background1x.naturalWidth+2*69,this.background1x.naturalHeight+2*69);
                this.background = this.background1x;
                let scaling = size1x.divide(size2x);
                this.canvas.width *=scaling.width;
                this.canvas.height *=scaling.height;
                this.configure();
                this.render();
            }
        }

        setup2x() {
            if(this.background === this.background2x) {
                //we have nothing to do.
            } else {
                //we have to calculate the factor to switch from 2x to 1x.
                let size2x = new MapObjects.Size(this.background2x.naturalWidth+2*69,this.background2x.naturalHeight+2*69);
                let size1x = new MapObjects.Size(this.background1x.naturalWidth+2*69,this.background1x.naturalHeight+2*69);
                let scaling = size2x.divide(size1x);
                console.log(scaling.height);
                this.background = this.background2x;
                this.canvas.width *=scaling.width;
                this.canvas.height *=scaling.height;
                this.configure();
                this.render();
            }
        }

        configure() {
            this.renderingSize = new MapObjects.Size(this.canvas.width,this.canvas.height);
            this.mapSize = new MapObjects.Size(this.background.naturalWidth,this.background.naturalHeight);
            //we need to add an area outside of the map. 
            this.totalSize = new MapObjects.Size(this.background.naturalWidth+2*69,this.background.naturalHeight+2*69);
            if(this.totalSize.width <= this.renderingSize.width && this.totalSize.height < this.renderingSize.height) {
                this.scaling = 1.0;
            } else {
                let scalingWidth = this.renderingSize.width / this.totalSize.width;
                let scalingHeight = this.renderingSize.height/ this.totalSize.height;
                this.scaling = Math.min(scalingWidth,scalingHeight);
            }
            let scaledSize = this.totalSize.scale(this.scaling);
            let diff = this.renderingSize.subtract(scaledSize);
            diff = diff.scale(0.5);
            this.offset = new MapObjects.Point(diff.width,diff.height);
            this.interactionmatrix = new DOMMatrix();
            this.interactionmatrix.translateSelf(this.offset.x,this.offset.y);
            //we have to translate agein
            this.interactionmatrix.scaleSelf(this.scaling,this.scaling);
            this.interactionmatrix.translateSelf(69,69);
            this.interactionmatrix.invertSelf();

            this.canvas.addEventListener('mousemove',this.onMouseMove);
            this.canvas.addEventListener('mousedown',this.onMouseDown);
            this.canvas.addEventListener('mouseup',this.onMouseUp);
            this.canvas.ownerDocument.addEventListener('keydown',this.onKeyPress);


            this.offscreen.width=this.totalSize.width;
            this.offscreen.height=this.totalSize.height;
            this.offscreenContext = this.offscreen.getContext('2d');
        }

        render() {
            this.context.save();
            this.context.fillStyle="white";
            this.context.fillRect(0,0,this.renderingSize.width,this.renderingSize.height);
            this.context.translate(this.offset.x,this.offset.y);
            //and another translation for the area "around"
            this.context.scale(this.scaling,this.scaling);
            this.context.translate(69,69);
            this.context.drawImage(this.background,0,0);
            this.objects.forEach(object => {
                this.context.save();
                let highlighted:HTMLCanvasElement;
                if(this.focused === object) {
                    if(!object.customFocusRenderer()) {
                        this.offscreenContext.save();
                        this.offscreenContext.translate(69,69);
                        this.offscreenContext.clearRect(-69,-69,this.totalSize.width,this.totalSize.height);
                        renderObject(object,this.offscreenContext);
                        this.offscreenContext.globalCompositeOperation = "source-in";
                        this.offscreenContext.fillStyle="#00F";
                        this.offscreenContext.fillRect(-69,-69,this.totalSize.width,this.totalSize.height);
                        this.offscreenContext.restore();
                    }
                }
                else if(this.hovering === object) {
                    this.offscreenContext.save();
                    this.offscreenContext.translate(69,69);
                    this.offscreenContext.clearRect(-69,-69,this.totalSize.width,this.totalSize.height);
                    //we need the rendered object in a new canvas
                    renderObject(object,this.offscreenContext);
                    //render the object
                    this.offscreenContext.globalCompositeOperation = "source-in";
                    this.offscreenContext.fillStyle="#888";
                    this.offscreenContext.fillRect(-69,-69,this.totalSize.width,this.totalSize.height);
                    this.offscreenContext.restore();
                }


                if(this.focused === object) {
                    if(!object.customFocusRenderer()) {
                        this.context.drawImage(this.offscreen,-69,-69);
                    } else {
                        renderObject(object,this.context,true,this.offscreenContext);
                    }
                } else {
                    renderObject(object,this.context);
                    if(this.hovering === object) {
                        this.context.globalCompositeOperation="lighter";
                        this.context.drawImage(this.offscreen,-69,-69);
                    }
                }
                this.context.restore();
            });
            this.context.restore();
            this.setCalculator.updateList(this.objects);
            if(this.frameFinished != null) {
                this.frameFinished();
            }
        }

        onMouseMove: { (event:MouseEvent) : void } = (event:MouseEvent) => {
            //first off, we need the current position:
            let pt = new MapObjects.Point(event.offsetX,event.offsetY);
            let converted = MapObjects.Point.fromDOMPoint(this.interactionmatrix.transformPoint(pt.toDOMPoint()));
            let rect=new MapObjects.Rect(new MapObjects.Point(-69,-69),this.totalSize);
            if(rect.containsPoint(converted)) {
                /*
                 * Mouse Event Handling rules:
                 * If the focused object handles mouse events: 
                 *   - delegate to the object
                 *   - handle hit testing for hovering.
                 * If the focused object does NOT handle mouse events:
                 *   - handle drag'n'drop
                 *   - handle hit testing for hovering.
                 */
                if(this.focused != null && this.focused.handlesMouseEvents()) {
                    //this object handles it's own mouse events. so we're telling it.
                    let pt = converted;
                    if(this.focused.hasFeature(MapObjects.Feature.Placeable)) {
                        let cast = <MapObjects.IPlaceable><any>this.focused;
                        pt = pt.subtractPoint(cast.position);
                    }
                    this.focused.mouseMove(pt,this);
                }
                else if((this.mouseState == MouseState.primaryDown || this.mouseState==MouseState.primaryDownMoved) && this.hovering.hasFeature(MapObjects.Feature.Placeable)) {
                    /*
                     * a pressed primary button WHILE moving means: drag and drop.
                     */
                    let casted = <MapObjects.IPlaceable><any>(this.hovering);
                    this.mouseState = MouseState.primaryDownMoved;
                    if(casted.area == MapObjects.Placement.OnMap) {
                        //we're only going to support drag and drop while on the map
                        let mapRect = new MapObjects.Rect(new MapObjects.Point(0,0),this.mapSize);
                        if(!mapRect.containsPoint(converted)) {
                            /* 
                             * we need to return early as we need to keep the stored mouse position 
                             * and the objects positions relativity constant
                             */
                            return;
                        }
                        let pt = casted.position;
                        this.mouseState = MouseState.primaryDownMoved;
                        if(this.shadowedPosition != null) {
                            pt = this.shadowedPosition;
                        }
                        let diff = converted.subtractPoint(this.mousePosition);
                        pt = pt.addPoint(diff);
                        /*
                        as we now have the "new" position, we have to do a snap-test against "everything".
                        */
                        let snapPt = snapTest(this.hovering,pt,this.objects,this.scaling);
                        if(snapPt != null) {
                            casted.position=snapPt[0];
                            this.snappingTarget=snapPt[1];
                            this.shadowedPosition = pt;
                        } else {
                            this.shadowedPosition = null;
                            this.snappingTarget = null;
                            casted.position=pt;
                        }
                    } else {
                        //this is the fun part! these objects will always be "around" the map
                        //so we have to recalculate position and rotation automatically.
                        //great fun!
                        //the easiest way ist: build 4 points to the 4 borders and select the shortest path.
                        let northPosition = new MapObjects.Point(converted.x,0);
                        let eastPosition = new MapObjects.Point(this.mapSize.width,converted.y);
                        let southPosition = new MapObjects.Point(converted.x,this.mapSize.height);
                        let westPosition = new MapObjects.Point(0,converted.y);
                        let vectors = [
                            northPosition.subtractPoint(converted),
                            eastPosition.subtractPoint(converted),
                            southPosition.subtractPoint(converted),
                            westPosition.subtractPoint(converted)
                        ];
                        vectors.sort((a,b)=>{return a.length() - b.length()});
                        let destination = converted.addPoint(vectors[0]);
                        if(destination.equals(northPosition)) {
                            casted.position = northPosition;
                            (<MapObjects.IRotateable><any>casted).rotation = MapObjects.Angles.Zero;
                        }
                        if(destination.equals(eastPosition)) {
                            casted.position = eastPosition;
                            (<MapObjects.IRotateable><any>casted).rotation = MapObjects.Angles.Ninety;
                        }
                        if(destination.equals(southPosition)) {
                            casted.position = southPosition;
                            (<MapObjects.IRotateable><any>casted).rotation = MapObjects.Angles.HundretEighty;
                        }
                        if(destination.equals(westPosition)) {
                            casted.position = westPosition;
                            (<MapObjects.IRotateable><any>casted).rotation = MapObjects.Angles.TwoHundredSeventy;
                        }
                    }
                    this.render();
                } 
                if(this.mouseState == MouseState.idle) {
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

        onMouseDown: {(event:MouseEvent):void} = (event:MouseEvent) => {
            if(this.mouseState != MouseState.idle) {
                return;
            }
            let pt = new MapObjects.Point(event.offsetX,event.offsetY);
            let converted = MapObjects.Point.fromDOMPoint(this.interactionmatrix.transformPoint(pt.toDOMPoint()));
            if(this.focused != null && this.focused.handlesMouseEvents() && this.focused === this.hovering) {
                let pt = converted;
                if(this.focused.hasFeature(MapObjects.Feature.Placeable)) {
                    let cast = <MapObjects.IPlaceable><any>this.focused;
                    pt = pt.subtractPoint(cast.position);
                }
                this.focused.mouseDown(pt,event.button,this);
            }
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
            let pt = new MapObjects.Point(event.offsetX,event.offsetY);
            let converted = MapObjects.Point.fromDOMPoint(this.interactionmatrix.transformPoint(pt.toDOMPoint()));
            if(this.focused != null && this.focused.handlesMouseEvents()) {
                let pt = converted;
                if(this.focused.hasFeature(MapObjects.Feature.Placeable)) {
                    let cast = <MapObjects.IPlaceable><any>this.focused;
                    pt = pt.subtractPoint(cast.position);
                }
                this.focused.mouseUp(pt,event.button,this);
            }
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

        onKeyPress: {(event:KeyboardEvent):void} = (event:KeyboardEvent) => {
            if(event.code=='Backspace') {
                this.delete(this.hovering);
            }
            if(event.code=='ArrowLeft') {
                this.rotate(this.hovering,true);
            }
            if(event.code=='ArrowRight') {
                this.rotate(this.hovering,false);
            }
        }

        delete(object:MapObjects.MapObject) {
            let idx = this.objects.indexOf(object);
            this.objects.splice(idx,1);
            this.hovering=null;
            this.render();
        }

        rotate(object:MapObjects.MapObject,clockwise:boolean) {
            let angles = [MapObjects.Angles.Zero,
                MapObjects.Angles.Fourtyfive,
                MapObjects.Angles.Ninety,
                MapObjects.Angles.HundredThirtyFive,
                MapObjects.Angles.HundretEighty,
                MapObjects.Angles.TwoHundredTwentyFive,
                MapObjects.Angles.TwoHundredSeventy,
                MapObjects.Angles.ThreeHundredFifteen
            ];
            if(!clockwise) {
                angles = angles.reverse();
            }
            if(object.hasFeature(MapObjects.Feature.Rotateable)) {
                let cast = <MapObjects.IRotateable><any>object;
                let found = false;
                for (let idx in angles) {
                    let angle=angles[idx];
                    if(clockwise) {
                        if(cast.rotation < angle) {
                            cast.rotation = angle;
                            found = true;
                            this.render();
                            break;
                        }
                    } else {
                        if(cast.rotation > angle) {
                            cast.rotation = angle;
                            found = true;
                            this.render();
                            break;
                        }
                    }
                }
                if(!found) {
                    cast.rotation = angles[0];
                    this.render();
                }
            }
        }

        deleteClick: {(event:MouseEvent) : void} = (event:MouseEvent) => {
            let idx = this.objects.indexOf(this.focused);
            this.objects.splice(idx, 1);
            this.focused = null;
            this.deleteButton.style.display="none";
            this.rotateButton.style.display="none";
            this.render();
        }

        rotateClick: {(event:MouseEvent):void} = (event:MouseEvent) => {
            let casted = <MapObjects.IRotateable><any>this.focused;
            let angles = [MapObjects.Angles.Zero,
                MapObjects.Angles.Fourtyfive,
                MapObjects.Angles.Ninety,
                MapObjects.Angles.HundredThirtyFive,
                MapObjects.Angles.HundretEighty,
                MapObjects.Angles.TwoHundredTwentyFive,
                MapObjects.Angles.TwoHundredSeventy,
                MapObjects.Angles.ThreeHundredFifteen
            ];
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

        /*
         * Places a new object and brings the engine into drag'n'drop mode.
         * that way, you simply click on a element in the sidebar and
         * start moving the mouse into the map.
         */
        placeNewObject(obj:MapObjects.MapObject) {
            this.objects.push(obj);
            this.hovering=obj;
            this.focused=null;
            this.mousePosition = (<MapObjects.IPlaceable><any>obj).position;
            this.mouseState=MouseState.primaryDownMoved;
        }

        buildHiResImage():string {
            let canvas = document.createElement("canvas") as HTMLCanvasElement;
            canvas.width=this.totalSize.width;
            canvas.height=this.totalSize.height;
            canvas.style.display="none";
            document.body.appendChild(canvas);
            let engine = new Engine(canvas,this.background,this.background2x,null,null);
            engine.objects=this.objects;
            engine.render();
            let url = canvas.toDataURL('image/png');
            document.body.removeChild(canvas);
            document.body.removeChild(engine.offscreen);
            return url;
        }
    }
}