;(function() {;
var ρσ_modules = {};
ρσ_modules.pythonize = {};

(function(){
    function strings() {
        var string_funcs, exclude, name;
        string_funcs = set("capitalize strip lstrip rstrip islower isupper isspace lower upper swapcase center count endswith startswith find rfind index rindex format join ljust rjust partition rpartition replace split rsplit splitlines zfill".split(" "));
        if (!arguments.length) {
            exclude = (function(){
                var s = ρσ_set();
                s.jsset.add("split");
                s.jsset.add("replace");
                return s;
            })();
        } else if (arguments[0]) {
            exclude = Array.prototype.slice.call(arguments);
        } else {
            exclude = null;
        }
        if (exclude) {
            string_funcs = string_funcs.difference(set(exclude));
        }
        var ρσ_Iter0 = string_funcs;
        ρσ_Iter0 = ((typeof ρσ_Iter0[Symbol.iterator] === "function") ? (ρσ_Iter0 instanceof Map ? ρσ_Iter0.keys() : ρσ_Iter0) : Object.keys(ρσ_Iter0));
        for (var ρσ_Index0 of ρσ_Iter0) {
            name = ρσ_Index0;
            (ρσ_expr_temp = String.prototype)[(typeof name === "number" && name < 0) ? ρσ_expr_temp.length + name : name] = (ρσ_expr_temp = ρσ_str.prototype)[(typeof name === "number" && name < 0) ? ρσ_expr_temp.length + name : name];
        }
    };
    if (!strings.__module__) Object.defineProperties(strings, {
        __module__ : {value: "pythonize"}
    });

    ρσ_modules.pythonize.strings = strings;
})();
async function __main__() {
"use strict";
    var display = canvas;
    var scene = canvas();

    function round(num, n=0) {return Number(num.toFixed(n))}

    var version, print, arange, __name__, type, ρσ_ls, k, dx, dy, V_max, ball1, ball2, POI, plate, r1, r2, V, V1, V2, y, x;
    version = ρσ_list_decorate([ "3.2", "glowscript" ]);
    Array.prototype['+'] = function(r) {return this.concat(r)}
    Array.prototype['*'] = function(r) {return __array_times_number(this, r)}
    window.__GSlang = "vpython";
    print = GSprint;
    arange = range;
    __name__ = "__main__";
    type = pytype;
    var strings = ρσ_modules.pythonize.strings;

    strings();
    "2";
    scene.background = vec(.3, .3, .3);
    "4";
    k = 899e7;
    "5";
    dx = 1;
    "6";
    dy = 1;
    "7";
    V_max = 15;
    "9";
    ball1 = sphere();
    "10";
    ball1.pos = vec(1["-u"]()["*"](1.5), 1.5, 0);
    "11";
    ball1.radius = .25;
    "12";
    ball1.color = vec(1, 0, 0);
    "13";
    ball1.q = 1e-9;
    "15";
    ball2 = sphere();
    "16";
    ball2.pos = vec(1.5, 1["-u"]()["*"](1.5), 0);
    "17";
    ball2.radius = .25;
    "18";
    ball2.color = vec(0, 0, 1);
    "19";
    ball2.q = 1["-u"]()["*"](1e-9);
    "21";
    var ρσ_Iter1 = range(1["-u"]()["*"](5.5), 5.5, dx);
    ρσ_Iter1 = ((typeof ρσ_Iter1[Symbol.iterator] === "function") ? (ρσ_Iter1 instanceof Map ? ρσ_Iter1.keys() : ρσ_Iter1) : Object.keys(ρσ_Iter1));
    for (var ρσ_Index1 of ρσ_Iter1) {
        x = ρσ_Index1;
        "22";
        var ρσ_Iter2 = range(1["-u"]()["*"](5.5), 5.5, dy);
        ρσ_Iter2 = ((typeof ρσ_Iter2[Symbol.iterator] === "function") ? (ρσ_Iter2 instanceof Map ? ρσ_Iter2.keys() : ρσ_Iter2) : Object.keys(ρσ_Iter2));
        for (var ρσ_Index2 of ρσ_Iter2) {
            y = ρσ_Index2;
            "23";
            POI = vec(x, y, 0);
            "24";
            plate = ρσ_interpolate_kwargs.call(this, box, [ρσ_desugar_kwargs({pos: POI["-"](1["*"](vec(0, 0, .5))), size: vec(1, 1, .1)})]);
            "25";
            r1 = POI["-"](1["*"](ball1.pos));
            "26";
            r2 = POI["-"](1["*"](ball2.pos));
            "28";
            if ((POI === ball1.pos || typeof POI === "object" && ρσ_equals(POI, ball1.pos))) {
                "29";
                plate.opacity = 1;
                "30";
                plate.color = ball1.color;
                "32";
            }
            if ((POI === ball2.pos || typeof POI === "object" && ρσ_equals(POI, ball2.pos))) {
                "33";
                plate.opacity = 1;
                "34";
                plate.color = ball2.color;
                "36";
            }
            if (ρσ_equals(mag(r1), 0) || ρσ_equals(mag(r2), 0)) {
                "37";
                V = 0;
                "38";
            } else {
                "39";
                V1 = k["*"](ball1.q)["/"](mag(r1));
                "40";
                V2 = k["*"](ball2.q)["/"](mag(r2));
                "41";
                V = V1["+"](V2);
                "43";
            }
            if (V[">="](0)) {
                "44";
                plate.color = color.red;
                "45";
            } else {
                "46";
                plate.color = color.blue;
                "48";
            }
            if (V[">"](V_max)) {
                "49";
                plate.opacity = 1;
                "50";
            }
            if (V["<"](1["-u"]()["*"](V_max))) {
                "51";
                plate.opacity = 1;
                "53";
            }
            if ((POI === ball1.pos || typeof POI === "object" && ρσ_equals(POI, ball1.pos))) {
                "54";
                plate.opacity = 1;
                "55";
                plate.color = ball1.color;
                "57";
            } else if ((POI === ball2.pos || typeof POI === "object" && ρσ_equals(POI, ball2.pos))) {
                "58";
                plate.opacity = 1;
                "59";
                plate.color = ball2.color;
                "61";
            } else {
                "62";
                plate.opacity = abs(V)["/"](V_max);
            }
        }
    }
};
if (!__main__.__module__) Object.defineProperties(__main__, {
    __module__ : {value: null}
});

;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()