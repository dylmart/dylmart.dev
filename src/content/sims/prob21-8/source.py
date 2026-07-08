Web VPython 3.2
k=8.99e9
scale_factor = 1e-2

ball1 = sphere()
ball1.pos = vec(0,0,0)
ball1.radius = 0.5
ball1.color = vec(1,0,0)
ball1.q = 3e-3
ball1_label = label(pos=ball1.pos+vec(0,1.5,0), text='Q<sub>1</sub>=q')

ball2 = sphere()
ball2.pos = vec(0,10,0)
ball2.radius = 0.5
ball2.color = vec(0,1,1)
ball2.q = -ball1.q
ball2_label = label(pos=ball2.pos+vec(0,1.5,0), text='Q<sub>2</sub>=-q')

ball3 = sphere()
ball3.pos = vec(10,10,0)
ball3.radius = 0.5
ball3.color = ball1.color
ball3.q = ball1.q
ball3_label = label(pos=ball3.pos+vec(0,1.5,0), text='Q<sub>3</sub>=q')

ball4 = sphere()
ball4.pos = vec(10,0,0)
ball4.radius = 0.5
ball4.color = vec(0,1,0)
ball4.m = 1
ball4.q = -ball1.q
ball4_label = label(pos=ball4.pos+vec(0,1.5,0), text='Q<sub>4</sub>=-q')


r_1to4 = ball4.pos-ball1.pos
F_1on4 = k*ball4.q*ball1.q*r_1to4/mag(r_1to4)**3
F_1on4_arrow = arrow(pos=ball4.pos, axis=scale_factor*(F_1on4), color = ball1.color)
F14_arrow_label = label(pos=ball4.pos+F_1on4_arrow.axis, text='<i>F</i><sub>14</sub>')

r_2to4 = ball4.pos-ball2.pos
F_2on4 = k*ball4.q*ball2.q*r_2to4/mag(r_2to4)**3
F_2on4_arrow = arrow(pos=ball4.pos, axis=scale_factor*(F_2on4), color = ball2.color)
F24_arrow_label = label(pos=ball4.pos+F_2on4_arrow.axis, text='<i>F</i><sub>24</sub>')

r_3to4 = ball4.pos-ball3.pos
F_3on4 = k*ball4.q*ball3.q*r_3to4/mag(r_3to4)**3
F_3on4_arrow = arrow(pos=ball4.pos, axis=scale_factor*(F_3on4), color = ball1.color)
F34_arrow_label = label(pos=ball4.pos+F_3on4_arrow.axis, text='<i>F</i><sub>34</sub>')

Fnet = F_1on4+F_2on4+F_3on4
Fnet_arrow = arrow(pos=ball4.pos, axis=scale_factor*(Fnet), color = color.white)
Fnet_arrow_label = label(pos=ball4.pos+Fnet_arrow.axis, text='<i>F</i><sub>net</sub>')

ball4.v = vec(0,0,0)
ball4.a = Fnet/ball4.m

t=0
dt=0.000001
sim_speed=.1
scene.waitfor('click')
while(t<1):
    rate(sim_speed/dt)

    r_1to4 = ball4.pos-ball1.pos
    F_1on4 = k*ball4.q*ball1.q*r_1to4/mag(r_1to4)**3
    
    r_2to4 = ball4.pos-ball2.pos
    F_2on4 = k*ball4.q*ball2.q*r_2to4/mag(r_2to4)**3
    
    r_3to4 = ball4.pos-ball3.pos
    F_3on4 = k*ball4.q*ball3.q*r_3to4/mag(r_3to4)**3
    
    Fnet = F_1on4+F_2on4+F_3on4
    
    ball4.a = Fnet/ball4.m
    
    ball4.v += ball4.a*dt
    
    ball4.pos += ball4.v*dt
    
    F_1on4_arrow.pos=ball4.pos
    F_1on4_arrow.axis=scale_factor*(F_1on4) 
    F_2on4_arrow.pos=ball4.pos
    F_2on4_arrow.axis=scale_factor*(F_2on4) 
    F_3on4_arrow.pos=ball4.pos
    F_3on4_arrow.axis=scale_factor*(F_3on4)
    Fnet_arrow.pos=ball4.pos
    Fnet_arrow.axis=scale_factor*(Fnet)
    
    F14_arrow_label.pos=ball4.pos+F_1on4_arrow.axis
    F24_arrow_label.pos=ball4.pos+F_2on4_arrow.axis
    F34_arrow_label.pos=ball4.pos+F_3on4_arrow.axis
    Fnet_arrow_label.pos=ball4.pos+Fnet_arrow.axis
    ball4_label.pos=ball4.pos+vec(0,1.5,0)
    
    #scene.camera.pos = vec(ball4.pos.x,ball4.pos.y,ball4.pos.z+10)
    
    t+=dt