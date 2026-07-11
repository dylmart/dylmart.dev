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

    var version, print, arange, __name__, type, ρσ_ls, k, q1, q2, sat_lev, arrow_list, c1, c2, ball1, ball2, POI, r1, r2, E_field, E_1, E_2, E_arrow, y, x;
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
    k = 899e7;
    "4";
    q1 = 1["-u"]()["*"](1e-9);
    "5";
    q2 = 1e-9;
    "6";
    sat_lev = 1;
    "7";
    arrow_list = ρσ_list_decorate([]);
    "9";
    if (q1[">"](0)) {
        "10";
        c1 = vec(1, 0, 0);
        "11";
    } else {
        "12";
        c1 = vec(0, .2, 1);
        "14";
    }
    if (q2[">"](0)) {
        "15";
        c2 = vec(1, 0, 0);
        "16";
    } else {
        "17";
        c2 = vec(0, .2, 1);
    }
    "19";
    ball1 = sphere();
    "20";
    ball1.pos = vec(0, 2, 0);
    "21";
    ball1.radius = .3;
    "22";
    ball1.color = c1;
    "23";
    ball1.q = q1;
    "25";
    ball2 = sphere();
    "26";
    ball2.pos = vec(3, 1["-u"]()["*"](2), 0);
    "27";
    ball2.radius = .3;
    "28";
    ball2.color = c2;
    "29";
    ball2.q = q2;
    "31";
    for (var ρσ_Index1 = 1["-u"]()["*"](5.5); ρσ_Index1["<"](5.5); ρσ_Index1=ρσ_Index1["+"](1)) {
        x = ρσ_Index1;
        "32";
        for (var ρσ_Index2 = 1["-u"]()["*"](5.5); ρσ_Index2["<"](5.5); ρσ_Index2=ρσ_Index2["+"](1)) {
            y = ρσ_Index2;
            "33";
            POI = vec(x, y, 0);
            "34";
            r1 = POI["-"](1["*"](ball1.pos));
            "35";
            r2 = POI["-"](1["*"](ball2.pos));
            "37";
            if (ρσ_equals(mag(r1), 0) || ρσ_equals(mag(r2), 0)) {
                "38";
                E_field = vec(0, 0, 0);
                "39";
            } else {
                "40";
                E_1 = k["*"](ball1.q)["*"](r1)["/"](Math.pow(mag(r1), 3));
                "41";
                E_2 = k["*"](ball2.q)["*"](r2)["/"](Math.pow(mag(r2), 3));
                "42";
                E_field = E_1["+"](E_2);
                "44";
            }
            if (mag(E_field)[">"](sat_lev)) {
                "45";
                E_field = hat(E_field)["*"](sat_lev);
            }
            "47";
            E_arrow = arrow();
            "48";
            E_arrow.pos = POI;
            "49";
            E_arrow.axis = E_field;
            "50";
            E_arrow.color = color.white;
            "51";
            arrow_list.append(E_arrow);
        }
    }
};
if (!__main__.__module__) Object.defineProperties(__main__, {
    __module__ : {value: null}
});

;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()