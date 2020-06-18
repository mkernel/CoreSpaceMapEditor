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
    }
}