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

    var version, print, arange, __name__, type, ρσ_ls, x_min, x_max, length, N, dx, POI, current, mu_0, constant, scale, B_tot, ball, t, dt, sim_speed, g1, f1, qv, wire, segment, current_arrow, r, ds, x, Force;
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
    x_min = 1["-u"]()["*"](100);
    "4";
    x_max = 100;
    "5";
    length = x_max["-"](1["*"](x_min));
    "6";
    N = 16;
    "7";
    dx = length["/"](N);
    "9";
    POI = vec(0, 3, 0);
    "10";
    current = 1e4;
    "11";
    mu_0 = 4e-7["*"](pi);
    "12";
    constant = mu_0["*"](current)["/"](4)["/"](pi);
    "14";
    scale = 1e4;
    "16";
    B_tot = vec(0, 0, 0);
    "24";
    ball = sphere();
    "25";
    ball.pos = POI;
    "26";
    ball.m = 1.673e-27;
    "27";
    ball.a = vec(0, 0, 0);
    "28";
    ball.v = vec(1, 0, 0);
    "29";
    ball.q = 1.602e-19;
    "31";
    t = 0;
    "32";
    dt = 1e-7;
    "33";
    sim_speed = 1e-6;
    "35";
    g1 = graph();
    "36";
    f1 = ρσ_interpolate_kwargs.call(this, gcurve, [ρσ_desugar_kwargs({color: color.green})]);
    "38";
    while (t["<="](.001)) {
        "39";
        (await rate(sim_speed["/"](dt)));
        "40";
        qv = ball.q["*"](ball.v);
        "42";
        wire = ρσ_list_decorate([]);
        "44";
        var ρσ_Iter1 = range(x_min, x_max, dx);
        ρσ_Iter1 = ((typeof ρσ_Iter1[Symbol.iterator] === "function") ? (ρσ_Iter1 instanceof Map ? ρσ_Iter1.keys() : ρσ_Iter1) : Object.keys(ρσ_Iter1));
        for (var ρσ_Index1 of ρσ_Iter1) {
            x = ρσ_Index1;
            "45";
            segment = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(x, 0, 0), axis: vec(.925["*"](dx), 0, 0), opacity: .35})]);
            "46";
            wire.append(segment);
            "48";
            current_arrow = arrow();
            "49";
            current_arrow.pos = vec(x["+"](dx["/"](2)), 0, 0);
            "50";
            current_arrow.axis = vec(dx, 0, 0);
            "51";
            current_arrow.color = color.red;
            "52";
            current_arrow.opacity = .8;
            "53";
            current_arrow.shaftwidth = .5;
            "54";
            current_arrow.headwidth = 1;
            "55";
            current_arrow.headlength = .5;
            "57";
            r = ball.pos["-"](1["*"](current_arrow.pos));
            "58";
            ds = current_arrow.axis;
            "60";
            B_tot=B_tot["+"](constant["*"](cross(ds, r))["/"](Math.pow(mag(r), 3)));
        }
        "62";
        Force = cross(qv, B_tot);
        "63";
        ball.a = Force["/"](ball.m);
        "64";
        ball.v=ball.v["+"](ball.a["*"](dt));
        "65";
        ball.pos=ball.pos["+"](ball.v["*"](dt));
        "67";
        f1.plot(t, B_tot.mag);
        "69";
        t=t["+"](dt);
    }
};
if (!__main__.__module__) Object.defineProperties(__main__, {
    __module__ : {value: null}
});

;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()