/// <reference path="protocols.ts" />
/// <reference path="primitives.ts" />

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
        draw(context:CanvasRenderingContext2D) {
            //the default implementation does nothing.
            //this needs to be overriden by everyone else.
            //important: the renderer already translates and
            //rotates for you. as long as those flags are set.
        }

        hitTest(pt:Point): boolean {
            return false;
        }
    }
}