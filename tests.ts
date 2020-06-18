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
        engine = new MapEngine.Engine(canvas,background);

        let wall = new this.MapObjects.Wall($("#wall_12")[0] as HTMLImageElement);
        wall.position = new this.MapObjects.Point(16,16);
        wall.rotation = MapObjects.Angles.Ninety;
        engine.objects.push(wall);
        engine.render();
    });
}
