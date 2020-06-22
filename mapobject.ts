/// <reference path="primitives.ts" />
/// <reference path="protocols.ts" />

namespace MapObjects {
    export class MapObject {
        getFeatures(): Feature[] {
            return [];
        }
        hasFeature(ask:Feature): boolean {
            let features = this.getFeatures();
            let found=false;
            features.forEach(feature => {
                if(feature == ask) {
                    found = true;
                }
            });
            return found;
        }

        /*
         * the offscreen canvas is only available to objects
         * which render themselves in a custom focused state.
         */
        draw(context:CanvasRenderingContext2D, focused:boolean=false,offscreencanvas:CanvasRenderingContext2D=null) {
            //the default implementation does nothing.
            //this needs to be overriden by everyone else.
            //important: the renderer already translates and
            //rotates for you. as long as those flags are set.
        }

        hitTest(pt:Point): boolean {
            return false;
        }

        /*
         * Once an object is "focused", all mouse events will be delegated to it,
         * if this function returns true.
         */
        handlesMouseEvents(): boolean {
            return false;
        }

        /*
         * If this function returns true, the engine will not provide a custom
         * focused style. Instead, it will call draw() with focused set to true.
         */
        customFocusRenderer(): boolean {
            return false;
        }

        mouseMove(position:Point,engine:IEngine) {

        }

        mouseDown(position:Point,button:number,engine:IEngine) {

        }

        mouseUp(position:Point,button:number,engine:IEngine) {

        }

    }
}