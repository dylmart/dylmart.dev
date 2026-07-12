Web VPython 3.2

#draw a set of coordinate axes 
line_x=cylinder(pos=vec(-10, 0, 0), axis=vec(20, 0, 0), radius=0.05)
line_y=cylinder(pos=vec(0, -10, 0), axis=vec(0, 20, 0), radius=0.05)
line_z=cylinder(pos=vec(0, 0, -10), axis=vec(0, 0, 20), radius=0.05)

G = 6.67e-11            #Universal Gravitation constant (units N*m**2/kg**2)
scale_factor = 0.5      #used to scale force arrows (to make arrows visible)

rock1 = sphere(color = color.orange, radius = 0.8, make_trail=True, trail_type='points')
rock2 = sphere(color = color.cyan, radius = 0.4, make_trail=True, trail_type='points')

rock1.pos = vec(0, 0, 0)
rock2.pos = vec(0.3, 0.7, 0)

rock1.m = 8e11            #units kg
rock2.m = 8e2             #units kg

#r_1to2 goes from 1 towards 2 (center to center)
r_1to2 = rock2.pos - rock1.pos

#starting_v = sqrt(G*rock1.m/r_1to2.mag)
escape_v = sqrt(2*G*rock1.m/r_1to2.mag)
print(escape_v)

rock1.v = vec(0,0,0)                #units m/s
rock2.v = vec(0,escape_v,0)       #units m/s

rock1.a = vec(0,0,0)      #units m/s**2
rock2.a = vec(0,0,0)      #units m/s**2



#Compute the force
#F_1on2 points in the negative r_1to2 hat
#in pracitce it is easier to code r-vector/r^3 than r-hat/r^2
GmM = G*rock1.m*rock2.m

F_1on2 = -1 * GmM * r_1to2 / r_1to2.mag**3
F_2on1 = -1 * F_1on2

#when drawing forces ON 2, the tails of the force arrows should be ON 2
#F_1on2_arrow = arrow(pos = rock2.pos, color = rock1.color)
#F_2on1_arrow = arrow(pos = rock1.pos, color=rock2.color)
#
#sat_lev = 5
#if mag(scale_factor*F_1on2) > sat_lev:
#    F_1on2_arrow.axis = sat_lev*hat(F_1on2)
#else:
#    F_1on2_arrow.axis = scale_factor*F_1on2

t = 0
dt = 0.001
sim_speed = 300

g1 = graph()
f1 = gcurve(color=color.green)

while (True):
    rate(sim_speed/dt)
    
    r_1to2 = rock2.pos - rock1.pos
    
    F_1on2 = -1 * GmM * r_1to2 / r_1to2.mag**3
    F_2on1 = -1 * F_1on2

#    if mag(scale_factor*F_1on2) > sat_lev:
#        F_1on2_arrow.pos = rock2.pos
#        F_1on2_arrow.axis = sat_lev*hat(F_1on2)
#        F_1on2_arrow.color = color.red
#    else:
#        F_1on2_arrow.pos = rock2.pos
#        F_1on2_arrow.axis = scale_factor*F_1on2
#    
#    if mag(scale_factor*F_2on1) > sat_lev:
#        F_2on1_arrow.pos = rock1.pos
#        F_2on1_arrow.axis = sat_lev*hat(F_2on1)
#        F_2on1_arrow.color = color.red
#    else:
#        F_2on1_arrow.pos = rock1.pos
#        F_2on1_arrow.axis = scale_factor*F_2on1
    
    rock1.a = F_2on1 / rock1.m
    rock2.a = F_1on2 / rock2.m
    
    rock1.v += rock1.a * dt
    rock2.v += rock2.a * dt
    
    rock1.pos += rock1.v * dt
    rock2.pos += rock2.v * dt
    
    f1.plot(t, r_1to2.mag)
    
    if (r_1to2.mag < ((rock1.radius+rock2.radius)-0.1)):
        print('Collision')
        break
    
    t+=dt
