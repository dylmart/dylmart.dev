Web VPython 3.2

scale_factor = 50

#initialize variables
k = 8.99e9
Q_tot = 1e-9
L = 10       
N = 10              #Number of slices

alpha = 12*Q_tot /L**3

y = 7                 #some distance from origin

x_min = -L/2
x_max = L/2
dx = L/N            #length of the rod divided by the number of slices

dq_min = 0
dq_max = 0

#POI
POI=vec(0,y,0)
poi_sphere = sphere(pos=POI, radius = 0.2)
poi_label=label(pos=POI+vec(1,0,0), text='POI', box=False)

#x_axis
x_axis=cylinder(axis=vec(20,0,0), radius=0.05)
x_axis.pos.x=-10
x_label=label(pos=vec(9,0,0), text='<i>x</i>', box=False)
#y-axis
y_axis=cylinder(axis=vec(0,18,0), radius=0.05)
y_axis.pos.y=-9
y_label=label(pos=vec(0,8,0), text='<i>y</i>', box=False)

#visualization for rod so its not just a series of spheres
rod_visual = cylinder()
rod_visual.pos = vec(-L/2,0,0)
rod_visual.axis = vec(L,0,0)
rod_visual.radius = 0.5
rod_visual.opacity = 0.15

#ef at poi
E_tot = vec(0,0,0)
E_tot_arrow = arrow()

for x in arange(x_min,x_max,dx):
    rate(5)
    
    ball = sphere()
    ball.pos = vec(x+0.5*dx,0,0)
    ball.radius = rod_visual.radius
    
    lambda = alpha*(ball.pos.x**2)
    
    ball.dq = lambda*dx
    if (ball.dq > dq_max):
        dq_max = ball.dq
    if (ball.dq < dq_min):
        dq_min = ball.dq
    
    if (ball.dq > 0):
        ball.color = color.red
        
    if (ball.dq < 0):
        ball.color = color.blue
        
    ball.opacity = ball.dq/dq_max
    
    r = POI - ball.pos
    
    E_tot += k*ball.dq*r/r.mag**3
    
    E_tot_arrow.pos = POI
    E_tot_arrow.axis = E_tot * scale_factor
    E_tot_arrow.color = color.yellow
    
    
E_tot_arrow_label = label(pos = POI + vec(-3,0,0), text = mag(E_tot), box=False)

print('E_total: ' + E_tot)
    