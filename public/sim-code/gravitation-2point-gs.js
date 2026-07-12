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

    var version, print, arange, __name__, type, ρσ_ls, t, dt, sim_speed, drawGraph, drawArrows, drawCoords, rotAngle, rotYAxis, rotZAxis, line_x, line_y, line_z, G, scale_factor, rock1, rock2, r_1to2, starting_v, GmM, F_1on2, F_2on1, F_1on2_arrow, F_2on1_arrow, sat_lev, g1, f1;
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
    t = 0;
    "4";
    dt = .01;
    "5";
    sim_speed = 2;
    "7";
    drawGraph = false;
    "8";
    drawArrows = false;
    "9";
    drawCoords = false;
    "12";
    rotAngle = .001;
    "13";
    rotYAxis = vec(0, 1, 0);
    "14";
    rotZAxis = vec(0, 0, 1);
    "16";
    scene.visible = false;
    "19";
    if (drawCoords) {
        "20";
        line_x = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](10), 0, 0), axis: vec(20, 0, 0), radius: .05})]);
        "21";
        line_y = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(0, 1["-u"]()["*"](10), 0), axis: vec(0, 20, 0), radius: .05})]);
        "22";
        line_z = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(0, 0, 1["-u"]()["*"](10)), axis: vec(0, 0, 20), radius: .05})]);
    }
    "24";
    G = 6.67e-11;
    "25";
    scale_factor = .5;
    "27";
    rock1 = ρσ_interpolate_kwargs.call(this, sphere, [ρσ_desugar_kwargs({color: color.white, radius: 2, make_trail: false, texture: "/sim-textures/planet-a.jpeg"})]);
    "28";
    rock2 = ρσ_interpolate_kwargs.call(this, sphere, [ρσ_desugar_kwargs({color: color.white, radius: .8, make_trail: true, interval: 20, retain: 35, trail_type: "points", texture: "/sim-textures/planet-b.jpeg"})]);
    "30";
    rock1.pos = vec(0, 0, 0);
    "31";
    rock2.pos = vec(0, 0, 10);
    "33";
    rock1.m = 8e11;
    "34";
    rock2.m = 800;
    "37";
    r_1to2 = rock2.pos["-"](1["*"](rock1.pos));
    "39";
    starting_v = sqrt(G["*"](rock1.m)["/"](r_1to2.mag));
    "41";
    rock1.v = vec(0, 0, 0);
    "42";
    rock2.v = vec(starting_v, 0, 0);
    "44";
    rock1.a = vec(0, 0, 0);
    "45";
    rock2.a = vec(0, 0, 0);
    "52";
    GmM = G["*"](rock1.m)["*"](rock2.m);
    "54";
    F_1on2 = 1["-u"]()["*"](1)["*"](GmM)["*"](r_1to2)["/"](Math.pow(r_1to2.mag, 3));
    "55";
    F_2on1 = 1["-u"]()["*"](1)["*"](F_1on2);
    "58";
    if (drawArrows) {
        "59";
        F_1on2_arrow = ρσ_interpolate_kwargs.call(this, arrow, [ρσ_desugar_kwargs({pos: rock2.pos, color: rock1.color})]);
        "60";
        F_2on1_arrow = ρσ_interpolate_kwargs.call(this, arrow, [ρσ_desugar_kwargs({pos: rock1.pos, color: rock2.color})]);
        "62";
        sat_lev = 5;
        "63";
        if (mag(scale_factor["*"](F_1on2))[">"](sat_lev)) {
            "64";
            F_1on2_arrow.axis = sat_lev["*"](hat(F_1on2));
            "65";
        } else {
            "66";
            F_1on2_arrow.axis = scale_factor["*"](F_1on2);
            "68";
        }
    }
    if (drawGraph) {
        "69";
        g1 = graph();
        "70";
        f1 = ρσ_interpolate_kwargs.call(this, gcurve, [ρσ_desugar_kwargs({color: color.green})]);
    }
    "73";
    (await scene.waitfor("textures"));
    "74";
    scene.visible = true;
    "76";
    while (true) {
        "77";
        (await rate(sim_speed["/"](dt)));
        "79";
        r_1to2 = rock2.pos["-"](1["*"](rock1.pos));
        "81";
        F_1on2 = 1["-u"]()["*"](1)["*"](GmM)["*"](r_1to2)["/"](Math.pow(r_1to2.mag, 3));
        "82";
        F_2on1 = 1["-u"]()["*"](1)["*"](F_1on2);
        "84";
        if (drawArrows) {
            "85";
            if (mag(scale_factor["*"](F_1on2))[">"](sat_lev)) {
                "86";
                F_1on2_arrow.pos = rock2.pos;
                "87";
                F_1on2_arrow.axis = sat_lev["*"](hat(F_1on2));
                "88";
                F_1on2_arrow.color = color.red;
                "89";
            } else {
                "90";
                F_1on2_arrow.pos = rock2.pos;
                "91";
                F_1on2_arrow.axis = scale_factor["*"](F_1on2);
                "93";
            }
            if (mag(scale_factor["*"](F_2on1))[">"](sat_lev)) {
                "94";
                F_2on1_arrow.pos = rock1.pos;
                "95";
                F_2on1_arrow.axis = sat_lev["*"](hat(F_2on1));
                "96";
                F_2on1_arrow.color = color.red;
                "97";
            } else {
                "98";
                F_2on1_arrow.pos = rock1.pos;
                "99";
                F_2on1_arrow.axis = scale_factor["*"](F_2on1);
            }
        }
        "101";
        rock1.a = F_2on1["/"](rock1.m);
        "102";
        rock2.a = F_1on2["/"](rock2.m);
        "104";
        rock1.v=rock1.v["+"](rock1.a["*"](dt));
        "105";
        rock2.v=rock2.v["+"](rock2.a["*"](dt));
        "107";
        rock1.pos=rock1.pos["+"](rock1.v["*"](dt));
        "108";
        rock2.pos=rock2.pos["+"](rock2.v["*"](dt));
        "110";
        ρσ_interpolate_kwargs.call(rock1, rock1.rotate, [ρσ_desugar_kwargs({angle: rotAngle, axis: rotYAxis})]);
        "111";
        ρσ_interpolate_kwargs.call(rock2, rock2.rotate, [ρσ_desugar_kwargs({angle: rotAngle["+"](rotAngle), axis: rotYAxis})]);
        "113";
        if (drawGraph) {
            "114";
            f1.plot(t, r_1to2.mag);
            "116";
        }
        if (r_1to2.mag["<"](rock1.radius["+"](rock2.radius))) {
            "117";
            break;
        }
        "119";
        t=t["+"](dt);
    }
};
if (!__main__.__module__) Object.defineProperties(__main__, {
    __module__ : {value: null}
});

;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()