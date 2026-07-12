Web VPython 3.2

cow = sphere(radius=0.5, make_trail=True)
cow.color=vec(0,1,1)
cow.pos=vec(0,0,0)
cow.trail_color = cow.color

#define velocity
cow.v=vec(3,5,0)

#define acceleration
cow.a=vec(-3,4,0)

x_axis=cylinder()
x_axis.pos.x=-5
x_axis.axis=vec(10,0,0)
x_axis.radius=0.05
x_axis_label = label(pos=x_axis.pos+x_axis.axis, text='<i>x</i>', box=False)

v_arrow = arrow(pos=cow.pos, axis=cow.v, color=vec(0,0.4,1))

v_vt_plot=graph(width=600, height=225, 
                title='<b><i>v<sub>y</sub></i> vs <i>t</i></b>',
                xtitle='<i>t</i> (s)', ytitle='<i>v<sub>y</sub></i> (m)',
                foreground=color.black, background=color.white)
v_vt_curve=gcurve(color=v_arrow.color)

t=0
dt=0.01
sim_speed=1

while t<5:
    rate(sim_speed/dt)
    
    #update velocity
    cow.v += cow.a*dt
    
    #update position
    cow.pos+=cow.v*dt
    
    v_arrow.pos=cow.pos
    v_arrow.axis=cow.v
    
    v_vt_curve.plot(t,cow.v.y)
    
    t+=dt