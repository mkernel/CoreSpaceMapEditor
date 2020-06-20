/// <reference path="engine.ts" />
/// <reference path="wall.ts" />
/// <reference types="jquery" />

namespace Testing {
    const $:JQueryStatic = (window as any)["jQuery"];
    let engine: MapEngine.Engine;

    $(window).on('load',function(){
        //this is domready, so let's get to it.
        let canvas = <HTMLCanvasElement>$("#canvas")[0];
        let background = <HTMLImageElement>$("#background")[0];
        engine = new MapEngine.Engine(canvas,background,<HTMLButtonElement>($("#delete")[0]),<HTMLButtonElement>($("#rotate")[0]));

        let wall = new MapObjects.Wall($("#wall_12")[0] as HTMLImageElement);
        wall.position = new MapObjects.Point(16,16);
        wall.rotation = MapObjects.Angles.Ninety;
        engine.objects.push(wall);

        wall = new MapObjects.Wall($("#wall_12")[0] as HTMLImageElement);
        wall.position = new MapObjects.Point(100,100);
        wall.rotation = MapObjects.Angles.Fourtyfive;
        
        engine.objects.push(wall);
        engine.render();
    });
}
