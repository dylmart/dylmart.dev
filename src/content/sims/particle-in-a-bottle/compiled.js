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

    var version, print, arange, __name__, type, ρσ_ls, mu_0, N, scale, coil, coil1, coil2, charge, B_tot, B_tot_arrow;
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
    mu_0 = 4e-7["*"](pi);
    "4";
    N = 1;
    "5";
    scale = 1e4;
    "6";
    coil = ρσ_list_decorate([]);
    "9";
    coil1 = ring();
    "10";
    coil1.pos = vec(1["-u"]()["*"](10), 0, 0);
    "11";
    coil1.radius = 5;
    "12";
    coil1.i = 42069;
    "14";
    coil2 = ring();
    "15";
    coil2.pos = vec(10, 0, 0);
    "16";
    coil2.radius = 5;
    "17";
    coil2.i = 42069;
    "20";
    charge = sphere();
    "21";
    charge.q = 1.602e-19;
    "22";
    charge.color = color.red;
    "23";
    charge.radius = 1;
    "28";
    B_tot = vec(0, 0, 0);
    "29";
    B_tot_arrow = arrow();
};
if (!__main__.__module__) Object.defineProperties(__main__, {
    __module__ : {value: null}
});

;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()