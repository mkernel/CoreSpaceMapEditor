/// <reference path="primitives.ts" />
/// <reference path="protocols.ts" />
/// <reference path="mapobject.ts" />

namespace MapEngine {
    export class Engine {
        canvas: HTMLCanvasElement;
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

        constructor(canvas:HTMLCanvasElement,background:HTMLImageElement) {
            this.canvas = canvas;
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
                if(this.hovering === object) {
                    this.offscreenContext.save();
                    this.offscreenContext.clearRect(0,0,this.mapSize.width,this.mapSize.height);
                    //we need the rendered object in a new canvas
                    this.renderObject(object,this.offscreenContext);
                    //render the object
                    this.offscreenContext.globalCompositeOperation = "source-in";
                    this.offscreenContext.fillStyle="#888";
                    this.offscreenContext.fillRect(0,0,this.mapSize.width,this.mapSize.height);
                    this.offscreenContext.restore();
                }

                this.renderObject(object,this.context);

                if(this.hovering === object) {
                    this.context.globalCompositeOperation="lighter";
                    this.context.drawImage(this.offscreen,0,0);
                }
                this.context.restore();
            });
            this.context.restore();
        }

        renderObject(object:MapObjects.MapObject,context:CanvasRenderingContext2D) {
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

        onMouseMove: { (event:MouseEvent) : void } = (event:MouseEvent) => {
            //first off, we need the current position:
            let pt = new MapObjects.Point(event.offsetX,event.offsetY);
            let converted = MapObjects.Point.fromDOMPoint(this.interactionmatrix.transformPoint(pt.toDOMPoint()));
            let rect=new MapObjects.Rect(new MapObjects.Point(0,0),this.mapSize);
            if(rect.containsPoint(converted)) {
                /*
                this is a "legitimate" point. So we should continue to work with it.
                first things first: hit testing. 
                we have to examine every object we know. However: objects may be rotated.
                that makes hit testing a little more complex.
                */
               let hit: MapObjects.MapObject;
               this.objects.forEach(object => {
                   let calculatedPoint = converted;
                   if(object.hasFeature(MapObjects.Feature.Placeable)) {
                       /*
                       this is a placed object. we have to normalize to its location
                       */
                      let casted = <MapObjects.IPlaceable><any>(object);
                      let matrix = new DOMMatrix();
                      matrix.translateSelf(casted.position.x,casted.position.y);
                      matrix.invertSelf();
                      calculatedPoint = MapObjects.Point.fromDOMPoint(matrix.transformPoint(converted.toDOMPoint()));
                   }
                   if(object.hasFeature(MapObjects.Feature.Rotateable)) {
                       /*
                       this is a rotateable object. for easier hit testing we
                       build a rotation matrix and invert it.
                       that way we can bring the cursor back into a normalized hitbox.
                       */
                      let casted = <MapObjects.IRotateable><any>(object);
                      let matrix = new DOMMatrix();
                      //we need to respect the rotation center.
                      matrix.translateSelf(casted.rotationCenter.x,casted.rotationCenter.y);
                      //who could've thought that canvas and DOMMatrix use different angle scales
                      matrix.rotateSelf(casted.rotation * (180/Math.PI));
                      matrix.invertSelf();
                      calculatedPoint = MapObjects.Point.fromDOMPoint(matrix.transformPoint(calculatedPoint.toDOMPoint()));
                   }
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
        }
    }
}