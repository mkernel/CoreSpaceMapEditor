/// <reference path="engine.ts" />
/// <reference types="jquery" />

namespace Testing {
    const $:JQueryStatic = (window as any)["jQuery"];
    let engine: MapEngine.Engine;

    $(window).on('load',function(){
        //this is domready, so let's get to it.
        let canvas = <HTMLCanvasElement>$("#canvas")[0];
        let background = <HTMLImageElement>$("#background")[0];
        engine = new MapEngine.Engine(canvas,background);
        engine.render();
    });
}
