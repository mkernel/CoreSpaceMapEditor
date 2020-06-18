/// <reference path="primitives.ts" />

namespace MapEngine {
    export class Engine {
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
        renderingSize: MapObjects.Size;
        background: HTMLImageElement;
        mapSize: MapObjects.Size;
        scaling: number;
        offset: MapObjects.Point;

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
    }

        render() {
            this.context.save();
            this.context.fillStyle="white";
            this.context.fillRect(0,0,this.renderingSize.width,this.renderingSize.height);
            this.context.translate(this.offset.x,this.offset.y);
            this.context.scale(this.scaling,this.scaling);
            this.context.drawImage(this.background,0,0);
            this.context.restore();
        }
    }
}