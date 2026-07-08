Web VPython 3.2

# amplitudes, wavelengths, wavenumbers
A1 = 5                      # meters
lambda1 = 60                # meters
k1 = 2*pi / lambda1         # 1 / meters squared

A2 = -10
lambda2 = 20
k2 = 2*pi / lambda2

# set wavespeed & determine omega
tension = 10                # newtons
mu = 1                      # kg/m
v = sqrt(tension/mu)        # m/s
omega1 = k1 * v   
omega2 = k2 * v

# parameters for rope length
xMin = -50                  # left end of rope
xMax = -xMin                # right end of rope
ropeLength = xMax - xMin
dx = 1                      # length of one segment
totalN = ropeLength / dx    # total number of segments

rope = []

# center of wavepulse
x1 = xMin
x2 = xMax

# initial param for recording vertical velocity component of ball at origin
vY0 = 0

# draw plot
velocityVsTime = graph(title = '<i>v<sub>y</i>0</sub> vs <i>t</i>',
                        xtitle = '<i>t</i> (s)',
                        ytitle = '<i>v<sub>y</i>0</sub> (m/s)',
                        xmin = 0, 
                        xmax = 30,
                        ymin = -20,
                        ymax = 20
                        )
                        
vY0Curve = gcurve(color = vec(0.2,0.2,1) )

# colors
counter = 0

# draw coords
xAxis = cylinder(pos = vec(xMin-dx,0,0),
                axis = vec(ropeLength+2*dx,0,0),
                radius = dx/10
                )
                
yAxis = cylinder(pos = vec(0,-20,0),
                axis = vec(0,40,0),
                radius = dx/10
                )

# build rope
for x in arange(xMin, xMax + dx/2, dx):
    ball = sphere(  pos = vec(x,0,0),
                    radius = dx/2,
                    color = vec(1,1,0)
                    )
                    
    counter += 1
    if counter % 5 == 0:
        ball.color = vec(1, 0.2, 0.2)
    
    if x == 0:
        ball.color = vec(0.2, 0.2, 1)
        
    rope.append(ball)
    
# init wavepulses
for currBall in rope:
    xPulse1 = currBall.pos.x - x1
    yPulse1 = A1 * exp(-1* (k1*xPulse1)**2)
    xPulse2 = currBall.pos.x - x2
    yPulse2 = A2 * exp(-1* (k2*xPulse2)**2)
    currBall.pos.y = yPulse1 + yPulse2

# animation
t = 0
dt = 0.01
simSpeed = 15

# wait for click
scene.pause('Click to run')

# pause button
button (bind = Run, text = 'PAUSE', color = color.red)

running = True
def Run(b):
    global running, remT, dt
    
    running = not running
    
    if running: 
        b.text = 'Pause'
        dt = remT
    else:
        b.text = 'Play'
        remT = dt
        dt = 0
    return

while t<ropeLength / v:
    rate(simSpeed/dt)
    
    initialVertPos = rope[totalN/2].pos.y
    
    for currBall in rope:
        xPulse1 = currBall.pos.x - x1
        yPulse1 = A1 * exp(-1* (k1*xPulse1 - omega1*t)**2)
        xPulse2 = currBall.pos.x - x2
        yPulse2 = A2 * exp(-1* (k2*xPulse2 + omega2*t)**2)
        currBall.pos.y = yPulse1 + yPulse2
        
    finalVertPos = rope[totalN/2].pos.y
    
    vY0 = (finalVertPos - initialVertPos) / dt
    
    vY0Curve.plot(t, vY0)

    t += dt
















