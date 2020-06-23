/// <reference path="setdb.ts" />
/// <reference path="mapobject.ts" />
/// <reference path="wall.ts" />
/// <reference path="structure.ts" />
/// <reference path="object.ts" />

namespace MapEngine.Sets {

    export class SetCalculator {

        availableParts:{};
        placedParts:{};
        constructor() {
            let db = new SetDB();
            this.availableParts = db.coreSet;
        }

        updateList(objects:MapObjects.MapObject[]) {
            this.placedParts={};
            objects.forEach(object => {
                if(object instanceof MapObjects.Wall) {
                    this.addWall(object);
                } else if(object instanceof MapObjects.Structure) {
                    this.addStructure(object);
                } else if(object instanceof MapObjects.Object) {
                    this.addObject(object);
                }
            });
        }

        addWall(object:MapObjects.Wall) {
            let id = object.image.id;
            if(typeof(this.placedParts[id]) == 'undefined') {
                this.placedParts[id]={
                    'available': 0,
                    'placed': 1
                };
                if(typeof(this.availableParts[id]) != 'undefined') {
                    this.placedParts[id]['available'] = this.availableParts[id];
                }
            } else {
                this.placedParts[id]['placed']++;
            }
        }

        addStructure(object:MapObjects.Structure) {
            object.elements.forEach(object => {
                if(object instanceof MapObjects.Wall) {
                    this.addWall(object);
                }
            });
        }

        addObject(object:MapObjects.Object) {
            let id = object.image.id;
            if(typeof(this.placedParts[id]) == 'undefined') {
                this.placedParts[id]={
                    'available': 0,
                    'placed': 1
                };
                if(typeof(this.availableParts[id]) != 'undefined') {
                    this.placedParts[id]['available'] = this.availableParts[id];
                }
            } else {
                this.placedParts[id]['placed']++;
            }
        }
    }
}