Web VPython 3.2
mu_0 = 4e-7*pi
#Coil
coil_spacing = 20
coil_left = -coil_spacing/2
coil_right = coil_spacing/2
current = 10
turns = 1
theta_total = 2*pi*turns
N = 10
d_theta = theta_total/N
coil_radius = 5

#box
radius = 0.25
ring1 = ring(pos = vec(-15,0,0),
             radius = 10,
             thickness = radius,
             color = color.cyan)
ring2 = ring(pos = vec(15,0,0),
             radius = 10,
             thickness = radius,
             color = color.cyan)             
line1 = cylinder(pos = vec(-15,-10,0),
                 axis = vec(30,0,0),
                 radius = radius,
                 color = color.cyan)
line2 = cylinder(pos = vec(-15,10,0),
                 axis = vec(30,0,0),
                 radius = radius,
                 color = color.cyan)   
line3 = cylinder(pos = vec(-15,0,10),
                 axis = vec(30,0,0),
                 radius = radius,
                 color = color.cyan)
line3 = cylinder(pos = vec(-15,0,-10),
                 axis = vec(30,0,0),
                 radius = radius,
                 color = color.cyan)


#Point
POIs = []
for i in arange(0.1,100,0.1):
    POI = sphere(pos = vec(-7.5,1,0),
                 radius = 0.50,
                 color = vec(1,0,0),
                 mass = 1.673e-27, #kg
                 charge = 1.602e-19, #C
                 velocity = vec(1,-10,0),
                 current = i,
                 make_trail = False,
                 trail_type = 'points',
                 interval = 10,
                 retain = 10,
                 inside = True)
    POIs.append(POI)


#Left Coil
coil_L_segments = []
for theta in arange(0, theta_total, d_theta):
    #Coil Segment
    segment = cylinder(pos = vec(coil_left, coil_radius*cos(theta), coil_radius*sin(theta)),
                       axis = coil_radius*d_theta*vec(0,-sin(theta+0.5*d_theta),cos(theta+0.5*d_theta)),
                       radius = 0.5,
                       color = color.orange,
                       opacity = 0.35)
    segment.ds = segment.axis
    segment.center = segment.pos + 0.5*segment.ds
    #Current Arrow
    segment_arrow = arrow(pos = segment.pos + segment.ds*0.1,
                          axis = segment.ds - segment.ds*0.2,
                          color = vec(1,0,0),
                          round = True
                          )
                          
    coil_L_segments.append(segment)

#Right Coil
coil_R_segments = []
for theta in arange(0, theta_total, d_theta):
    #Coil Segment
    segment = cylinder(pos = vec(coil_right, coil_radius*cos(theta), coil_radius*sin(theta)),
                       axis = coil_radius*d_theta*vec(0,sin(theta-0.5*d_theta),-cos(theta-0.5*d_theta)),
                       radius = 0.5,
                       color = color.orange,
                       opacity = 0.35)
    segment.ds = segment.axis
    segment.center = segment.pos + 0.5*segment.ds
    #Current Arrow
    segment_arrow = arrow(pos = segment.pos + segment.ds*0.1,
                          axis = segment.ds - segment.ds*0.2,
                          color = vec(1,0,0))
                          
    coil_R_segments.append(segment)

#Calculate B_field at a point given an array of wire segments
def get_B(POI, array1, array2):
    B_total = vec(0,0,0)
    for point in array1:
        r = POI-point.pos
        B_total += mu_0*current*point.ds.cross(r)/(4*pi*r.mag**3)
    for point in array2:
        r = POI-point.pos
        B_total += mu_0*current*point.ds.cross(r)/(4*pi*r.mag**3)
    return B_total
    
def get_B2(POI, array1, array2):
    B_total = vec(0,0,0)
    for point in array1:
        r = POI.pos-point.pos
        B_total += mu_0*POI.current*point.ds.cross(r)/(4*pi*r.mag**3)
    for point in array2:
        r = POI.pos-point.pos
        B_total += mu_0*POI.current*point.ds.cross(r)/(4*pi*r.mag**3)
    return B_total


#Magnetic field grid
grid_z_offset = -5
grid_height = 30
grid_width = 30
width_N = 21
dx = grid_width/width_N
height_N = 14
dy = grid_height/height_N
for x in arange(-grid_width/2, grid_width/2, dx):
    for y in arange(-grid_height/2, grid_height/2, dy):
        B_field = get_B(vec(x,y,0), coil_L_segments, coil_R_segments)
        B_arrow = arrow(pos = vec(x,y,grid_z_offset),
                        axis = B_field.hat*1,
                        color = vec(0.3,0.3,1),
                        round = True,
                        headwidth = 0.5)


t = 0
dt = 0.0001
sim_speed = 100000000

amps = []
times = []
velocities = []
#update loop.
while True:
    rate(sim_speed/dt)
    for POI in POIs:
        if POI.inside == True:
            #updated Magnetic field
            B_field = get_B2(POI, coil_L_segments, coil_R_segments)
            #update Force
            F_on_POI = POI.charge*POI.velocity.cross(B_field)
            #update Acceleration
            a_POI = F_on_POI/POI.mass
            #update velocities
            POI.velocity += a_POI*dt
            #update positions
            POI.pos += POI.velocity*dt
            if 10 < mag(vec(0,POI.pos.y,POI.pos.z)) or POI.pos.x > 15 or POI.pos.x < -15:
                print(t + " " + POI.current + " " + POI.velocity.mag)
                amps.append(POI.current)
                times.append(t)
                velocities.append(POI.velocity)
                POI.inside = False
    t+=dt
        #update labels

