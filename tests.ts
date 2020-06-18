/// <reference path="mapobject.ts" />
/// <reference path="wall.ts" />

class TestObject extends MapObjects.MapObject {
    getFeatures():MapObjects.Feature[] {
        return [MapObjects.Feature.Joinable];
    }
}

let test = new MapObjects.MapObject();
console.log(test.hasFeature(MapObjects.Feature.Joinable));
test = new TestObject();
console.log(test.hasFeature(MapObjects.Feature.Joinable));
