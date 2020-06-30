/// <reference path="primitives.ts" />
/// <reference path="mapobject.ts" />
/// <reference path="wall.ts" />
/// <reference path="structure.ts" />
/// <reference path="object.ts" />
/// <reference path="spawn.ts" />

namespace MapEngine {
    export class Serializer {

        serialize(objects:MapObjects.MapObject[]) {
            let result = {
                version:"1.0",
                objects:[]
            };
            objects.forEach(object => {
                if(object instanceof MapObjects.Wall) {
                    result.objects.push({
                        type:"wall",
                        id:object.image.id,
                        position:{
                            x:object.position.x,
                            y:object.position.y
                        },
                        rotation:object.rotation
                    });
                } else if(object instanceof MapObjects.Structure) {
                    let obj = {
                        type:"structure",
                        position: {
                            x:object.position.x,
                            y:object.position.y
                        },
                        elements:[]
                    };
                    object.elements.forEach(wall => {
                        if(wall instanceof MapObjects.Wall) {
                            obj.elements.push({
                                type:"wall",
                                id:wall.image.id,
                                position:{
                                    x:wall.position.x,
                                    y:wall.position.y
                                },
                                rotation:wall.rotation
                            });
                        }
                    });
                    result.objects.push(obj);
                } else if (object instanceof MapObjects.Spawnpoint) {
                    let obj = {
                        type: "spawn",
                        position: {
                            x: object.position.x,
                            y: object.position.y
                        },
                        rotation: object.rotation,
                        id: object.image.id
                    };
                    result.objects.push(obj);
                } else if(object instanceof MapObjects.Object) {
                    let obj = {
                        type: "object",
                        position: {
                            x: object.position.x,
                            y: object.position.y
                        },
                        rotation: object.rotation,
                        id: object.image.id
                    };
                    result.objects.push(obj);
                }
            });
            return JSON.stringify(result);
        }

        deserialize(json:string):MapObjects.MapObject[] {
            let result:MapObjects.MapObject[] = [];
            let decoded = JSON.parse(json);
            if(decoded.version=="1.0") {
                decoded.objects.forEach(object => {
                    if(object.type == "wall") {
                        let wall = new MapObjects.Wall($("#"+object.id)[0] as HTMLImageElement);
                        wall.rotation = object.rotation;
                        wall.position = new MapObjects.Point(object.position.x,object.position.y);
                        result.push(wall);
                    } else if(object.type == "structure") {
                        let structure = new MapObjects.Structure();
                        structure.position = new MapObjects.Point(object.position.x,object.position.y);
                        object.elements.forEach(element => {
                            if(element.type=="wall") {
                                let wall = new MapObjects.Wall($("#"+element.id)[0] as HTMLImageElement);
                                wall.position = new MapObjects.Point(element.position.x,element.position.y);
                                wall.rotation = element.rotation;
                                structure.elements.push(wall);
                            }
                        });
                        structure.rebuildJoints();
                        result.push(structure);
                    } else if(object.type == "object") {
                        let loaded = new MapObjects.Object($("#"+object.id)[0] as HTMLImageElement);
                        loaded.rotation = object.rotation;
                        loaded.position = new MapObjects.Point(object.position.x,object.position.y);
                        result.push(loaded);
                    } else if(object.type == "spawn") {
                        let loaded = new MapObjects.Spawnpoint($("#"+object.id)[0] as HTMLImageElement);
                        loaded.rotation = object.rotation;
                        loaded.position = new MapObjects.Point(object.position.x,object.position.y);
                        result.push(loaded);
                    }
                });
            }
            return result;
        }
    }
}