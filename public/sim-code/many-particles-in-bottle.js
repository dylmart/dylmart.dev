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

    var version, print, arange, __name__, type, ρσ_ls, mu_0, coil_spacing, coil_left, coil_right, current, turns, theta_total, N, d_theta, coil_radius, radius, ring1, ring2, line1, line2, line3, POIs, POI, i, coil_L_segments, segment, segment_arrow, theta, coil_R_segments, grid_z_offset, grid_height, grid_width, width_N, dx, height_N, dy, B_field, B_arrow, y, x, t, dt, sim_speed, amps, times, velocities, F_on_POI, a_POI;
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
    mu_0 = 4e-7["*"](pi);
    "4";
    coil_spacing = 20;
    "5";
    coil_left = 1["-u"]()["*"](coil_spacing)["/"](2);
    "6";
    coil_right = coil_spacing["/"](2);
    "7";
    current = 10;
    "8";
    turns = 1;
    "9";
    theta_total = 2["*"](pi)["*"](turns);
    "10";
    N = 10;
    "11";
    d_theta = theta_total["/"](N);
    "12";
    coil_radius = 5;
    "15";
    radius = .25;
    "16";
    ring1 = ρσ_interpolate_kwargs.call(this, ring, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 0, 0), radius: 10, thickness: radius, color: color.cyan})]);
    "20";
    ring2 = ρσ_interpolate_kwargs.call(this, ring, [ρσ_desugar_kwargs({pos: vec(15, 0, 0), radius: 10, thickness: radius, color: color.cyan})]);
    "24";
    line1 = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 1["-u"]()["*"](10), 0), axis: vec(30, 0, 0), radius: radius, color: color.cyan})]);
    "28";
    line2 = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 10, 0), axis: vec(30, 0, 0), radius: radius, color: color.cyan})]);
    "32";
    line3 = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 0, 10), axis: vec(30, 0, 0), radius: radius, color: color.cyan})]);
    "36";
    line3 = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 0, 1["-u"]()["*"](10)), axis: vec(30, 0, 0), radius: radius, color: color.cyan})]);
    "43";
    POIs = ρσ_list_decorate([]);
    "44";
    for (var ρσ_Index1 = .1; ρσ_Index1["<"](100); ρσ_Index1=ρσ_Index1["+"](.1)) {
        i = ρσ_Index1;
        "45";
        POI = ρσ_interpolate_kwargs.call(this, sphere, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](7.5), 1, 0), radius: .5, color: vec(1, 0, 0), mass: 1.673e-27, charge: 1.602e-19, velocity: vec(1, 1["-u"]()["*"](10), 0), current: i, make_trail: false, trail_type: "points", interval: 10, retain: 10, inside: true})]);
        "57";
        POIs.append(POI);
    }
    "61";
    coil_L_segments = ρσ_list_decorate([]);
    "62";
    var ρσ_Iter2 = range(0, theta_total, d_theta);
    ρσ_Iter2 = ((typeof ρσ_Iter2[Symbol.iterator] === "function") ? (ρσ_Iter2 instanceof Map ? ρσ_Iter2.keys() : ρσ_Iter2) : Object.keys(ρσ_Iter2));
    for (var ρσ_Index2 of ρσ_Iter2) {
        theta = ρσ_Index2;
        "64";
        segment = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(coil_left, coil_radius["*"](cos(theta)), coil_radius["*"](sin(theta))), axis: coil_radius["*"](d_theta)["*"](vec(0, 1["-u"]()["*"](sin(theta["+"](.5["*"](d_theta)))), cos(theta["+"](.5["*"](d_theta))))), radius: .5, color: color.orange, opacity: .35})]);
        "69";
        segment.ds = segment.axis;
        "70";
        segment.center = segment.pos["+"](.5["*"](segment.ds));
        "72";
        segment_arrow = ρσ_interpolate_kwargs.call(this, arrow, [ρσ_desugar_kwargs({pos: segment.pos["+"](segment.ds["*"](.1)), axis: segment.ds["-"](1["*"](segment.ds)["*"](.2)), color: vec(1, 0, 0), round: true})]);
        "78";
        coil_L_segments.append(segment);
    }
    "81";
    coil_R_segments = ρσ_list_decorate([]);
    "82";
    var ρσ_Iter3 = range(0, theta_total, d_theta);
    ρσ_Iter3 = ((typeof ρσ_Iter3[Symbol.iterator] === "function") ? (ρσ_Iter3 instanceof Map ? ρσ_Iter3.keys() : ρσ_Iter3) : Object.keys(ρσ_Iter3));
    for (var ρσ_Index3 of ρσ_Iter3) {
        theta = ρσ_Index3;
        "84";
        segment = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(coil_right, coil_radius["*"](cos(theta)), coil_radius["*"](sin(theta))), axis: coil_radius["*"](d_theta)["*"](vec(0, sin(theta["-"](1["*"](.5)["*"](d_theta))), 1["-u"]()["*"](cos(theta["-"](1["*"](.5)["*"](d_theta)))))), radius: .5, color: color.orange, opacity: .35})]);
        "89";
        segment.ds = segment.axis;
        "90";
        segment.center = segment.pos["+"](.5["*"](segment.ds));
        "92";
        segment_arrow = ρσ_interpolate_kwargs.call(this, arrow, [ρσ_desugar_kwargs({pos: segment.pos["+"](segment.ds["*"](.1)), axis: segment.ds["-"](1["*"](segment.ds)["*"](.2)), color: vec(1, 0, 0)})]);
        "96";
        coil_R_segments.append(segment);
    }
    "99";
    async function get_B(POI, array1, array2) {
        var ρσ_ls, B_total, r, point;
        "100";
        B_total = vec(0, 0, 0);
        "101";
        var ρσ_Iter4 = array1;
        ρσ_Iter4 = ((typeof ρσ_Iter4[Symbol.iterator] === "function") ? (ρσ_Iter4 instanceof Map ? ρσ_Iter4.keys() : ρσ_Iter4) : Object.keys(ρσ_Iter4));
        for (var ρσ_Index4 of ρσ_Iter4) {
            point = ρσ_Index4;
            "102";
            r = POI["-"](1["*"](point.pos));
            "103";
            B_total=B_total["+"](mu_0["*"](current)["*"](point.ds.cross(r))["/"](4["*"](pi)["*"](Math.pow(r.mag, 3))));
        }
        "104";
        var ρσ_Iter5 = array2;
        ρσ_Iter5 = ((typeof ρσ_Iter5[Symbol.iterator] === "function") ? (ρσ_Iter5 instanceof Map ? ρσ_Iter5.keys() : ρσ_Iter5) : Object.keys(ρσ_Iter5));
        for (var ρσ_Index5 of ρσ_Iter5) {
            point = ρσ_Index5;
            "105";
            r = POI["-"](1["*"](point.pos));
            "106";
            B_total=B_total["+"](mu_0["*"](current)["*"](point.ds.cross(r))["/"](4["*"](pi)["*"](Math.pow(r.mag, 3))));
        }
        "107";
        return B_total;
    };
    if (!get_B.__argnames__) Object.defineProperties(get_B, {
        __argnames__ : {value: ["POI", "array1", "array2"]},
        __module__ : {value: null}
    });

    "109";
    async function get_B2(POI, array1, array2) {
        var ρσ_ls, B_total, r, point;
        "110";
        B_total = vec(0, 0, 0);
        "111";
        var ρσ_Iter6 = array1;
        ρσ_Iter6 = ((typeof ρσ_Iter6[Symbol.iterator] === "function") ? (ρσ_Iter6 instanceof Map ? ρσ_Iter6.keys() : ρσ_Iter6) : Object.keys(ρσ_Iter6));
        for (var ρσ_Index6 of ρσ_Iter6) {
            point = ρσ_Index6;
            "112";
            r = POI.pos["-"](1["*"](point.pos));
            "113";
            B_total=B_total["+"](mu_0["*"](POI.current)["*"](point.ds.cross(r))["/"](4["*"](pi)["*"](Math.pow(r.mag, 3))));
        }
        "114";
        var ρσ_Iter7 = array2;
        ρσ_Iter7 = ((typeof ρσ_Iter7[Symbol.iterator] === "function") ? (ρσ_Iter7 instanceof Map ? ρσ_Iter7.keys() : ρσ_Iter7) : Object.keys(ρσ_Iter7));
        for (var ρσ_Index7 of ρσ_Iter7) {
            point = ρσ_Index7;
            "115";
            r = POI.pos["-"](1["*"](point.pos));
            "116";
            B_total=B_total["+"](mu_0["*"](POI.current)["*"](point.ds.cross(r))["/"](4["*"](pi)["*"](Math.pow(r.mag, 3))));
        }
        "117";
        return B_total;
    };
    if (!get_B2.__argnames__) Object.defineProperties(get_B2, {
        __argnames__ : {value: ["POI", "array1", "array2"]},
        __module__ : {value: null}
    });

    "121";
    grid_z_offset = 1["-u"]()["*"](5);
    "122";
    grid_height = 30;
    "123";
    grid_width = 30;
    "124";
    width_N = 21;
    "125";
    dx = grid_width["/"](width_N);
    "126";
    height_N = 14;
    "127";
    dy = grid_height["/"](height_N);
    "128";
    var ρσ_Iter8 = range(1["-u"]()["*"](grid_width)["/"](2), grid_width["/"](2), dx);
    ρσ_Iter8 = ((typeof ρσ_Iter8[Symbol.iterator] === "function") ? (ρσ_Iter8 instanceof Map ? ρσ_Iter8.keys() : ρσ_Iter8) : Object.keys(ρσ_Iter8));
    for (var ρσ_Index8 of ρσ_Iter8) {
        x = ρσ_Index8;
        "129";
        var ρσ_Iter9 = range(1["-u"]()["*"](grid_height)["/"](2), grid_height["/"](2), dy);
        ρσ_Iter9 = ((typeof ρσ_Iter9[Symbol.iterator] === "function") ? (ρσ_Iter9 instanceof Map ? ρσ_Iter9.keys() : ρσ_Iter9) : Object.keys(ρσ_Iter9));
        for (var ρσ_Index9 of ρσ_Iter9) {
            y = ρσ_Index9;
            "130";
            B_field = (await get_B(vec(x, y, 0), coil_L_segments, coil_R_segments));
            "131";
            B_arrow = ρσ_interpolate_kwargs.call(this, arrow, [ρσ_desugar_kwargs({pos: vec(x, y, grid_z_offset), axis: B_field.hat["*"](1), color: vec(.3, .3, 1), round: true, headwidth: .5})]);
        }
    }
    "138";
    t = 0;
    "139";
    dt = 1e-4;
    "140";
    sim_speed = 1e8;
    "142";
    amps = ρσ_list_decorate([]);
    "143";
    times = ρσ_list_decorate([]);
    "144";
    velocities = ρσ_list_decorate([]);
    "146";
    while (true) {
        "147";
        (await rate(sim_speed["/"](dt)));
        "148";
        var ρσ_Iter10 = POIs;
        ρσ_Iter10 = ((typeof ρσ_Iter10[Symbol.iterator] === "function") ? (ρσ_Iter10 instanceof Map ? ρσ_Iter10.keys() : ρσ_Iter10) : Object.keys(ρσ_Iter10));
        for (var ρσ_Index10 of ρσ_Iter10) {
            POI = ρσ_Index10;
            "149";
            if ((POI.inside === true || typeof POI.inside === "object" && ρσ_equals(POI.inside, true))) {
                "151";
                B_field = (await get_B2(POI, coil_L_segments, coil_R_segments));
                "153";
                F_on_POI = POI.charge["*"](POI.velocity.cross(B_field));
                "155";
                a_POI = F_on_POI["/"](POI.mass);
                "157";
                POI.velocity=POI.velocity["+"](a_POI["*"](dt));
                "159";
                POI.pos=POI.pos["+"](POI.velocity["*"](dt));
                "160";
                if (10["<"](mag(vec(0, POI.pos.y, POI.pos.z))) || POI.pos.x[">"](15) || POI.pos.x["<"](1["-u"]()["*"](15))) {
                    "161";
                    print(t["+"](" ")["+"](POI.current)["+"](" ")["+"](POI.velocity.mag));
                    "162";
                    amps.append(POI.current);
                    "163";
                    times.append(t);
                    "164";
                    velocities.append(POI.velocity);
                    "165";
                    POI.inside = false;
                }
            }
        }
        "166";
        t=t["+"](dt);
    }
};
if (!__main__.__module__) Object.defineProperties(__main__, {
    __module__ : {value: null}
});

;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()