/// <reference path="engine.ts" />
/// <reference path="wall.ts" />
/// <reference path="object.ts" />
/// <reference path="spawn.ts" />
/// <reference path="serializer.ts" />
/// <reference types="jquery" />
/// <reference types="jqueryui" />

namespace Testing {
    const $:JQueryStatic = (window as any)["jQuery"];
    let engine: MapEngine.Engine;

    $(window).on('load',function(){
        $("div.sidebar").accordion();
        //this is domready, so let's get to it.
        let canvas = <HTMLCanvasElement>$("#canvas")[0];
        let background = <HTMLImageElement>$("#background")[0];
        let background2x = <HTMLImageElement>$("#background2x")[0];
        engine = new MapEngine.Engine(canvas,background,background2x,<HTMLButtonElement>($("#delete")[0]),<HTMLButtonElement>($("#rotate")[0]));

        $(document).on('click','.wall',function(){
            let wall = new MapObjects.Wall(this);
            wall.position = new MapObjects.Point(0,0);
            wall.rotation = MapObjects.Angles.Zero;
            engine.placeNewObject(wall);
        });
        $(document).on('click','.object',function(){
            let object = new MapObjects.Object(this);
            object.position = new MapObjects.Point(0,0);
            object.rotation = MapObjects.Angles.Zero;
            engine.placeNewObject(object);
        });
        $(document).on('click','.spawnpoint',function(){
            let object = new MapObjects.Spawnpoint(this);
            object.position = new MapObjects.Point(0,0);
            object.rotation = MapObjects.Angles.Zero;
            engine.placeNewObject(object);
        });

        $(document).on('click','#save',function(){
            if ($("#save_link").attr('href') != "") {
                URL.revokeObjectURL($("#save_link").attr('href'));
            }
            let serializer = new MapEngine.Serializer();
            let result = serializer.serialize(engine.objects,engine.is2x());
            let blob = new Blob([result],{type:"application/json"});
            let url = URL.createObjectURL(blob);
            $("#save_link").attr('href',url);
            $("#save_link")[0].click();
        });
        $(document).on('click','#load',function(){
            $("#load_file")[0].click();
        });
        $(document).on('change','#load_file',function(){
            let file = (<HTMLInputElement>$("#load_file")[0]).files[0];
            let reader = new FileReader();
            reader.onload=function(e){
                let serializer = new MapEngine.Serializer();
                let result = serializer.deserialize(e.target.result as string);
                if(result[1]) {
                    engine.setup2x();
                }
                engine.objects = result[0];
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
        $(document).on('click','#2xbutton',function(){
            engine.setup2x();
        });
        $(document).on('click','#1xbutton',function(){
            engine.setup1x();
        });

        engine.frameFinished = () => {
            $("div ul.parts").html("");
            let list = engine.setCalculator.placedParts;
            for (let key in list) {
                let available = list[key].available;
                let placed = list[key].placed;
                let img = $("#"+key).attr('src');
                $("div ul.parts").append("<li><img src='"+img+"'> "+placed+"/"+available+"</li>");
            }
        }
        engine.render();
    });
}
