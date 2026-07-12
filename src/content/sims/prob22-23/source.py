Web VPython 3.2

scale_factor = 5

#initialize variables
k = 8.99e9
Q_tot = 1e-9       
N = 10          #Number of slices
R = 3           #radius of arc

theta_min = radians(45)
theta_max = radians(135)
theta_total = theta_max-theta_min

dtheta = theta_total / N

arc_length_tot = R*theta_total
lambda = Q_tot / arc_length_tot

#POI
POI=vec(0,0,0)
poi_sphere = sphere(pos=POI, radius = 0.2)
poi_label=label(pos=POI+vec(1,0,0), text='POI', box=False)

#x_axis
x_axis=cylinder(axis=vec(20,0,0), radius=0.05)
x_axis.pos.x=-10
x_label=label(pos=vec(18,0,0), text='<i>x</i>', box=False)
#y-axis
y_axis=cylinder(axis=vec(0,16,0), radius=0.05)
y_axis.pos.y=-8
y_label=label(pos=vec(0,14,0), text='<i>y</i>', box=False)

#ef at poi
E_tot = vec(0,0,0)
E_tot_arrow = arrow()

for theta in arange(theta_min,theta_max,dtheta):
    rate(100)
    
    my_theta = theta + 0.5*dtheta
    
    ball = sphere()
    ball.pos = vec(R*cos(my_theta),R*sin(my_theta),0)
    ball.color = color.red
    ball.radius = 0.5
    ball.dq = lambda*R*dtheta
    
    r = POI - ball.pos
    
    E_tot += k*ball.dq*r/r.mag**3
    
    E_tot_arrow.pos = POI
    E_tot_arrow.axis = E_tot * scale_factor
    E_tot_arrow.color = color.yellow
    
    
E_tot_arrow_label = label(pos = POI + vec(-3,0,0), text = mag(E_tot), box=False)    