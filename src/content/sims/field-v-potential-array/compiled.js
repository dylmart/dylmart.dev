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

    var version, print, arange, __name__, type, ρσ_ls, k, dx, dy, L, N, q1, q2, V_max, sat_lev, arrow_list, c1, c2, rod, ball, y, ball2, POI, plate, E_1, V1, r1, E_field, V, r2, E_2, V2, E_arrow, x;
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
    "3";
    scene.background = vec(.3, .3, .3);
    "5";
    k = 899e7;
    "6";
    dx = 1;
    "7";
    dy = 1;
    "9";
    L = 10;
    "10";
    N = 10;
    "12";
    q1 = 1e-9;
    "13";
    q2 = 1["-u"]()["*"](1e-9);
    "15";
    V_max = 15;
    "16";
    sat_lev = 1;
    "18";
    arrow_list = ρσ_list_decorate([]);
    "21";
    if (q1[">"](0)) {
        "22";
        c1 = vec(1, 0, 0);
        "23";
    } else {
        "24";
        c1 = vec(0, .2, 1);
        "26";
    }
    if (q2[">"](0)) {
        "27";
        c2 = vec(1, 0, 0);
        "28";
    } else {
        "29";
        c2 = vec(0, .2, 1);
    }
    "32";
    rod = ρσ_list_decorate([]);
    "33";
    var ρσ_Iter1 = range(1["-u"]()["*"](5.5), 5.5, L["/"](N));
    ρσ_Iter1 = ((typeof ρσ_Iter1[Symbol.iterator] === "function") ? (ρσ_Iter1 instanceof Map ? ρσ_Iter1.keys() : ρσ_Iter1) : Object.keys(ρσ_Iter1));
    for (var ρσ_Index1 of ρσ_Iter1) {
        y = ρσ_Index1;
        "34";
        ball = sphere();
        "35";
        ball.pos = vec(1["-u"]()["*"](3), y["*"](L["/"](N)), 0);
        "36";
        ball.radius = .3;
        "37";
        ball.color = c1;
        "38";
        ball.q = q1["/"](L);
        "39";
        rod.append(ball);
    }
    "41";
    ball2 = sphere();
    "42";
    ball2.pos = vec(1.5, 1["-u"]()["*"](1.5), 0);
    "43";
    ball2.radius = .3;
    "44";
    ball2.color = c2;
    "45";
    ball2.q = q2;
    "47";
    for (var ρσ_Index2 = 1["-u"]()["*"](5.5); ρσ_Index2["<"](5.5); ρσ_Index2=ρσ_Index2["+"](1)) {
        x = ρσ_Index2;
        "48";
        for (var ρσ_Index3 = 1["-u"]()["*"](5.5); ρσ_Index3["<"](5.5); ρσ_Index3=ρσ_Index3["+"](1)) {
            y = ρσ_Index3;
            "49";
            POI = vec(x, y, 0);
            "50";
            plate = ρσ_interpolate_kwargs.call(this, box, [ρσ_desugar_kwargs({pos: POI["-"](1["*"](vec(0, 0, .5))), size: vec(dx, dy, .1)})]);
            "52";
            E_1 = vec(0, 0, 0);
            "53";
            V1 = 0;
            "56";
            var ρσ_Iter4 = rod;
            ρσ_Iter4 = ((typeof ρσ_Iter4[Symbol.iterator] === "function") ? (ρσ_Iter4 instanceof Map ? ρσ_Iter4.keys() : ρσ_Iter4) : Object.keys(ρσ_Iter4));
            for (var ρσ_Index4 of ρσ_Iter4) {
                ball = ρσ_Index4;
                "57";
                r1 = POI["-"](1["*"](ball.pos));
                "59";
                if (ρσ_equals(mag(r1), 0)) {
                    "61";
                    E_field = vec(0, 0, 0);
                    "62";
                    V = 0;
                    "63";
                } else {
                    "64";
                    E_1=E_1["+"](k["*"](ball.q)["*"](r1)["/"](Math.pow(mag(r1), 3)));
                    "65";
                    V1=V1["+"](k["*"](ball.q)["/"](mag(r1)));
                    "67";
                }
                if ((POI === ball.pos || typeof POI === "object" && ρσ_equals(POI, ball.pos))) {
                    "68";
                    plate.opacity = 1;
                    "69";
                    plate.color = ball.color;
                }
            }
            "72";
            r2 = POI["-"](1["*"](ball2.pos));
            "74";
            if (ρσ_equals(mag(r2), 0)) {
                "76";
                E_field = vec(0, 0, 0);
                "77";
                V = 0;
                "78";
            } else {
                "79";
                E_2 = k["*"](ball2.q)["*"](r2)["/"](Math.pow(mag(r2), 3));
                "80";
                E_field = E_1["+"](E_2);
                "82";
                V2 = k["*"](ball2.q)["/"](mag(r2));
                "83";
                V = V1["+"](V2);
                "85";
            }
            if (V[">="](0)) {
                "86";
                plate.color = color.red;
                "87";
            } else {
                "88";
                plate.color = color.blue;
                "90";
            }
            if (V[">"](V_max)) {
                "91";
                plate.opacity = 1;
                "93";
            }
            if (V["<"](1["-u"]()["*"](V_max))) {
                "94";
                plate.opacity = 1;
                "96";
            } else if ((POI === ball2.pos || typeof POI === "object" && ρσ_equals(POI, ball2.pos))) {
                "97";
                plate.opacity = 1;
                "98";
                plate.color = ball2.color;
                "100";
            } else {
                "101";
                plate.opacity = abs(V)["/"](V_max);
                "104";
            }
            if (mag(E_field)[">"](sat_lev)) {
                "105";
                E_field = hat(E_field)["*"](sat_lev);
            }
            "107";
            E_arrow = arrow();
            "108";
            E_arrow.pos = POI;
            "109";
            E_arrow.axis = E_field;
            "110";
            E_arrow.color = color.white;
            "111";
            arrow_list.append(E_arrow);
        }
    }
};
if (!__main__.__module__) Object.defineProperties(__main__, {
    __module__ : {value: null}
});

;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()