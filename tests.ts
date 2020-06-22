/// <reference path="engine.ts" />
/// <reference path="wall.ts" />
/// <reference path="serializer.ts" />
/// <reference types="jquery" />

namespace Testing {
    const $:JQueryStatic = (window as any)["jQuery"];
    let engine: MapEngine.Engine;

    $(window).on('load',function(){
        //this is domready, so let's get to it.
        let canvas = <HTMLCanvasElement>$("#canvas")[0];
        let background = <HTMLImageElement>$("#background")[0];
        engine = new MapEngine.Engine(canvas,background,<HTMLButtonElement>($("#delete")[0]),<HTMLButtonElement>($("#rotate")[0]));

        $(document).on('click','.wall',function(){
            let wall = new MapObjects.Wall(this);
            wall.position = new MapObjects.Point(0,0);
            wall.rotation = MapObjects.Angles.Zero;
            engine.placeNewObject(wall);
        });

        $(document).on('click','#save',function(){
            if ($("#save_link").attr('href') != "") {
                URL.revokeObjectURL($("#save_link").attr('href'));
            }
            let serializer = new MapEngine.Serializer();
            let result = serializer.serialize(engine.objects);
            let blob = new Blob([result],{type:"application/json"});
            let url = URL.createObjectURL(blob);
            $("#save_link").attr('href',url);
            $("#save_link")[0].click();
        });
        $(document).on('change','#load',function(){
            let file = (<HTMLInputElement>$("#load")[0]).files[0];
            let reader = new FileReader();
            reader.onload=function(e){
                let serializer = new MapEngine.Serializer();
                let objects = serializer.deserialize(e.target.result as string);
                engine.objects = objects;
                engine.render();
            }
            reader.readAsText(file);
        });
        $(document).on('click','#image',function(){
            let encoded=engine.buildHiResImage();
            if($("#image_link").attr('href')!="") {
                URL.revokeObjectURL($("#image_link").attr('href'));
            }
            let blob = MapEngine.dataURLtoBlob(encoded);
            let url = URL.createObjectURL(blob);
            $("#image_link").attr('href',url);
            $("#image_link")[0].click();
        });

        engine.render();
    });
}
