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

    var version, print, arange, __name__, type, ρσ_ls, mu_0, coil_spacing, coil_left, coil_right, current, turns, theta_total, N, d_theta, coil_radius, radius, cylinder_bounds, ring1, ring2, line1, line2, line3, POIs, POI, i, coil_L_segments, segment, segment_arrow, theta, coil_R_segments, grid_z_offset, grid_height, grid_width, width_N, dx, height_N, dy, B_field, B_arrow, y, x, t, dt, sim_speed, amps, times, velocities, F_on_POI, a_POI;
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
    cylinder_bounds = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 0, 0), axis: vec(30, 0, 0), radius: 10, color: color.cyan, opacity: .05})]);
    "21";
    ring1 = ρσ_interpolate_kwargs.call(this, ring, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 0, 0), radius: 10, thickness: radius, color: color.cyan})]);
    "25";
    ring2 = ρσ_interpolate_kwargs.call(this, ring, [ρσ_desugar_kwargs({pos: vec(15, 0, 0), radius: 10, thickness: radius, color: color.cyan})]);
    "29";
    line1 = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 1["-u"]()["*"](10), 0), axis: vec(30, 0, 0), radius: radius, color: color.cyan})]);
    "33";
    line2 = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 10, 0), axis: vec(30, 0, 0), radius: radius, color: color.cyan})]);
    "37";
    line3 = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 0, 10), axis: vec(30, 0, 0), radius: radius, color: color.cyan})]);
    "41";
    line3 = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](15), 0, 1["-u"]()["*"](10)), axis: vec(30, 0, 0), radius: radius, color: color.cyan})]);
    "48";
    POIs = ρσ_list_decorate([]);
    "49";
    for (var ρσ_Index1 = .1; ρσ_Index1["<"](100); ρσ_Index1=ρσ_Index1["+"](.1)) {
        i = ρσ_Index1;
        "50";
        POI = ρσ_interpolate_kwargs.call(this, sphere, [ρσ_desugar_kwargs({pos: vec(1["-u"]()["*"](7.5), 1, 0), radius: .5, color: vec(1, 0, 0), mass: 1.673e-27, charge: 1.602e-19, velocity: vec(1, 1["-u"]()["*"](10), 0), current: i, make_trail: false, trail_type: "points", interval: 10, retain: 10, inside: true})]);
        "62";
        POIs.append(POI);
    }
    "66";
    coil_L_segments = ρσ_list_decorate([]);
    "67";
    var ρσ_Iter2 = range(0, theta_total, d_theta);
    ρσ_Iter2 = ((typeof ρσ_Iter2[Symbol.iterator] === "function") ? (ρσ_Iter2 instanceof Map ? ρσ_Iter2.keys() : ρσ_Iter2) : Object.keys(ρσ_Iter2));
    for (var ρσ_Index2 of ρσ_Iter2) {
        theta = ρσ_Index2;
        "69";
        segment = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(coil_left, coil_radius["*"](cos(theta)), coil_radius["*"](sin(theta))), axis: coil_radius["*"](d_theta)["*"](vec(0, 1["-u"]()["*"](sin(theta["+"](.5["*"](d_theta)))), cos(theta["+"](.5["*"](d_theta))))), radius: .5, color: color.orange, opacity: .35})]);
        "74";
        segment.ds = segment.axis;
        "75";
        segment.center = segment.pos["+"](.5["*"](segment.ds));
        "77";
        segment_arrow = ρσ_interpolate_kwargs.call(this, arrow, [ρσ_desugar_kwargs({pos: segment.pos["+"](segment.ds["*"](.1)), axis: segment.ds["-"](1["*"](segment.ds)["*"](.2)), color: vec(1, 0, 0), round: true})]);
        "83";
        coil_L_segments.append(segment);
    }
    "86";
    coil_R_segments = ρσ_list_decorate([]);
    "87";
    var ρσ_Iter3 = range(0, theta_total, d_theta);
    ρσ_Iter3 = ((typeof ρσ_Iter3[Symbol.iterator] === "function") ? (ρσ_Iter3 instanceof Map ? ρσ_Iter3.keys() : ρσ_Iter3) : Object.keys(ρσ_Iter3));
    for (var ρσ_Index3 of ρσ_Iter3) {
        theta = ρσ_Index3;
        "89";
        segment = ρσ_interpolate_kwargs.call(this, cylinder, [ρσ_desugar_kwargs({pos: vec(coil_right, coil_radius["*"](cos(theta)), coil_radius["*"](sin(theta))), axis: coil_radius["*"](d_theta)["*"](vec(0, sin(theta["-"](1["*"](.5)["*"](d_theta))), 1["-u"]()["*"](cos(theta["-"](1["*"](.5)["*"](d_theta)))))), radius: .5, color: color.orange, opacity: .35})]);
        "94";
        segment.ds = segment.axis;
        "95";
        segment.center = segment.pos["+"](.5["*"](segment.ds));
        "97";
        segment_arrow = ρσ_interpolate_kwargs.call(this, arrow, [ρσ_desugar_kwargs({pos: segment.pos["+"](segment.ds["*"](.1)), axis: segment.ds["-"](1["*"](segment.ds)["*"](.2)), color: vec(1, 0, 0)})]);
        "101";
        coil_R_segments.append(segment);
    }
    "104";
    async function get_B(POI, array1, array2) {
        var ρσ_ls, B_total, r, point;
        "105";
        B_total = vec(0, 0, 0);
        "106";
        var ρσ_Iter4 = array1;
        ρσ_Iter4 = ((typeof ρσ_Iter4[Symbol.iterator] === "function") ? (ρσ_Iter4 instanceof Map ? ρσ_Iter4.keys() : ρσ_Iter4) : Object.keys(ρσ_Iter4));
        for (var ρσ_Index4 of ρσ_Iter4) {
            point = ρσ_Index4;
            "107";
            r = POI["-"](1["*"](point.pos));
            "108";
            B_total=B_total["+"](mu_0["*"](current)["*"](point.ds.cross(r))["/"](4["*"](pi)["*"](Math.pow(r.mag, 3))));
        }
        "109";
        var ρσ_Iter5 = array2;
        ρσ_Iter5 = ((typeof ρσ_Iter5[Symbol.iterator] === "function") ? (ρσ_Iter5 instanceof Map ? ρσ_Iter5.keys() : ρσ_Iter5) : Object.keys(ρσ_Iter5));
        for (var ρσ_Index5 of ρσ_Iter5) {
            point = ρσ_Index5;
            "110";
            r = POI["-"](1["*"](point.pos));
            "111";
            B_total=B_total["+"](mu_0["*"](current)["*"](point.ds.cross(r))["/"](4["*"](pi)["*"](Math.pow(r.mag, 3))));
        }
        "112";
        return B_total;
    };
    if (!get_B.__argnames__) Object.defineProperties(get_B, {
        __argnames__ : {value: ["POI", "array1", "array2"]},
        __module__ : {value: null}
    });

    "114";
    async function get_B2(POI, array1, array2) {
        var ρσ_ls, B_total, r, point;
        "115";
        B_total = vec(0, 0, 0);
        "116";
        var ρσ_Iter6 = array1;
        ρσ_Iter6 = ((typeof ρσ_Iter6[Symbol.iterator] === "function") ? (ρσ_Iter6 instanceof Map ? ρσ_Iter6.keys() : ρσ_Iter6) : Object.keys(ρσ_Iter6));
        for (var ρσ_Index6 of ρσ_Iter6) {
            point = ρσ_Index6;
            "117";
            r = POI.pos["-"](1["*"](point.pos));
            "118";
            B_total=B_total["+"](mu_0["*"](POI.current)["*"](point.ds.cross(r))["/"](4["*"](pi)["*"](Math.pow(r.mag, 3))));
        }
        "119";
        var ρσ_Iter7 = array2;
        ρσ_Iter7 = ((typeof ρσ_Iter7[Symbol.iterator] === "function") ? (ρσ_Iter7 instanceof Map ? ρσ_Iter7.keys() : ρσ_Iter7) : Object.keys(ρσ_Iter7));
        for (var ρσ_Index7 of ρσ_Iter7) {
            point = ρσ_Index7;
            "120";
            r = POI.pos["-"](1["*"](point.pos));
            "121";
            B_total=B_total["+"](mu_0["*"](POI.current)["*"](point.ds.cross(r))["/"](4["*"](pi)["*"](Math.pow(r.mag, 3))));
        }
        "122";
        return B_total;
    };
    if (!get_B2.__argnames__) Object.defineProperties(get_B2, {
        __argnames__ : {value: ["POI", "array1", "array2"]},
        __module__ : {value: null}
    });

    "126";
    grid_z_offset = 1["-u"]()["*"](5);
    "127";
    grid_height = 30;
    "128";
    grid_width = 30;
    "129";
    width_N = 21;
    "130";
    dx = grid_width["/"](width_N);
    "131";
    height_N = 14;
    "132";
    dy = grid_height["/"](height_N);
    "133";
    var ρσ_Iter8 = range(1["-u"]()["*"](grid_width)["/"](2), grid_width["/"](2), dx);
    ρσ_Iter8 = ((typeof ρσ_Iter8[Symbol.iterator] === "function") ? (ρσ_Iter8 instanceof Map ? ρσ_Iter8.keys() : ρσ_Iter8) : Object.keys(ρσ_Iter8));
    for (var ρσ_Index8 of ρσ_Iter8) {
        x = ρσ_Index8;
        "134";
        var ρσ_Iter9 = range(1["-u"]()["*"](grid_height)["/"](2), grid_height["/"](2), dy);
        ρσ_Iter9 = ((typeof ρσ_Iter9[Symbol.iterator] === "function") ? (ρσ_Iter9 instanceof Map ? ρσ_Iter9.keys() : ρσ_Iter9) : Object.keys(ρσ_Iter9));
        for (var ρσ_Index9 of ρσ_Iter9) {
            y = ρσ_Index9;
            "135";
            B_field = (await get_B(vec(x, y, 0), coil_L_segments, coil_R_segments));
            "136";
            B_arrow = ρσ_interpolate_kwargs.call(this, arrow, [ρσ_desugar_kwargs({pos: vec(x, y, grid_z_offset), axis: B_field.hat["*"](1), color: vec(.3, .3, 1), round: true, headwidth: .5})]);
        }
    }
    "143";
    t = 0;
    "144";
    dt = 1e-4;
    "145";
    sim_speed = 1e8;
    "147";
    amps = ρσ_list_decorate([]);
    "148";
    times = ρσ_list_decorate([]);
    "149";
    velocities = ρσ_list_decorate([]);
    "151";
    while (true) {
        "152";
        (await rate(sim_speed["/"](dt)));
        "153";
        var ρσ_Iter10 = POIs;
        ρσ_Iter10 = ((typeof ρσ_Iter10[Symbol.iterator] === "function") ? (ρσ_Iter10 instanceof Map ? ρσ_Iter10.keys() : ρσ_Iter10) : Object.keys(ρσ_Iter10));
        for (var ρσ_Index10 of ρσ_Iter10) {
            POI = ρσ_Index10;
            "154";
            if ((POI.inside === true || typeof POI.inside === "object" && ρσ_equals(POI.inside, true))) {
                "156";
                B_field = (await get_B2(POI, coil_L_segments, coil_R_segments));
                "158";
                F_on_POI = POI.charge["*"](POI.velocity.cross(B_field));
                "160";
                a_POI = F_on_POI["/"](POI.mass);
                "162";
                POI.velocity=POI.velocity["+"](a_POI["*"](dt));
                "164";
                POI.pos=POI.pos["+"](POI.velocity["*"](dt));
                "165";
                if (10["<"](mag(vec(0, POI.pos.y, POI.pos.z))) || POI.pos.x[">"](15) || POI.pos.x["<"](1["-u"]()["*"](15))) {
                    "166";
                    print(t["+"](" ")["+"](POI.current)["+"](" ")["+"](POI.velocity.mag));
                    "167";
                    amps.append(POI.current);
                    "168";
                    times.append(t);
                    "169";
                    velocities.append(POI.velocity);
                    "170";
                    POI.inside = false;
                }
            }
        }
        "171";
        t=t["+"](dt);
    }
};
if (!__main__.__module__) Object.defineProperties(__main__, {
    __module__ : {value: null}
});

;$(function(){ window.__context = { glowscript_container: $("#glowscript").removeAttr("id") }; __main__() })})()