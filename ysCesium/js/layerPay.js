$(function () {
     $(".download").click(function (){
         $(".ys-layer-pay").fadeIn(200);
     });
     $(".layer-btn1").click(function () {
         $(".layer-flow").fadeIn(200).animate({
             left:0,
             right:0,
             bottom:0,
             top:0
         },500,function () {
             setTimeout(function () {
                 $(".layer-flow").fadeOut(200).animate({
                     left:"50%",
                     right:"50%",
                     bottom:"50%",
                     top:"50%"
                 },0);
                 $(".ys-layer-pay").fadeOut(200);
             },200)
         })
     });
    $(".layer-btn2").click(function () {
        $(".ys-layer-pay").fadeOut(200);
    })
});