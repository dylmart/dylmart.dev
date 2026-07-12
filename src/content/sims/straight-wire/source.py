Web VPython 3.2

x_min = -100
x_max = 100
length = x_max - x_min
N = 16
dx = length/N

POI = vec(0,3,0)
current = 1e4
mu_0 = 4e-7*pi
constant = mu_0*current/4/pi

scale = 1e4

B_tot = vec(0,0,0)
#B_tot_arrow = arrow(pos=POI, axis=B_tot*scale, color=vec(0.4, 0.4, 1))

#B_label = label(pos=POI, text=1e3*B_tot.mag + "mT", xoffset=20, yoffset=-20, border=0, box=False, line=False)
#B_label.text = f"<i>B<sub>tot</sub></i> =  {1e3*B_tot.mag:.2f} mT"
#B_label.color = B_tot_arrow.color

# particle
ball = sphere()
ball.pos = POI
ball.m = 1.673e-27
ball.a = vec(0,0,0)
ball.v = vec(1,0,0)
ball.q = 1.602e-19

t = 0
dt = 0.0000001
sim_speed = 0.000001

g1 = graph()
f1 = gcurve(color = color.green)

while (t<=0.001):
    rate(sim_speed/dt)
    qv = ball.q*ball.v
    
    wire = []

    for x in arange(x_min, x_max, dx):
        segment = cylinder(pos=vec(x,0,0), axis=vec(0.925*dx,0,0), opacity=0.35)
        wire.append(segment)
    
        current_arrow = arrow()
        current_arrow.pos = vec(x+dx/2,0,0)
        current_arrow.axis = vec(dx,0,0)
        current_arrow.color = color.red
        current_arrow.opacity = 0.8
        current_arrow.shaftwidth = 0.5
        current_arrow.headwidth = 1
        current_arrow.headlength = 0.5
    
        r = ball.pos - current_arrow.pos
        ds = current_arrow.axis
    
        B_tot += constant*cross(ds,r)/mag(r)**3
        
    Force = cross(qv,B_tot)
    ball.a = Force/ball.m
    ball.v += ball.a * dt
    ball.pos += ball.v * dt
    
    f1.plot(t, B_tot.mag)
    
    t+=dt
    
    
    




