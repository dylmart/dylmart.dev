Web VPython 3.2
scene.background = vec(0.3,0.3,0.3)

k = 8.99e9
dx = 1
dy = 1
V_max = 15

ball1 = sphere()
ball1.pos = vec(-1.5,1.5,0)
ball1.radius = 0.25
ball1.color = vec(1,0,0)
ball1.q = 1.0e-9

ball2 = sphere()
ball2.pos = vec(1.5,-1.5,0)
ball2.radius = 0.25
ball2.color = vec(0,0,1)
ball2.q = -1.0e-9

for x in arange(-5.5,5.5, dx):
    for y in arange(-5.5,5.5, dy):
        POI = vec(x,y,0)
        plate = box(pos=POI-vec(0,0,0.5), size=vec(1,1, 0.1))
        r1 = POI - ball1.pos
        r2 = POI - ball2.pos
    
        if (POI == ball1.pos):
            plate.opacity = 1
            plate.color = ball1.color
            
        if (POI == ball2.pos):
            plate.opacity = 1
            plate.color = ball2.color
            
        if (mag(r1) == 0) or (mag(r2) == 0):
            V = 0
        else:
            V1 = k*ball1.q/mag(r1)
            V2 = k*ball2.q/mag(r2)
            V = V1 + V2
        
        if V >= 0:
            plate.color = color.red
        else:
            plate.color = color.blue
    
        if V > V_max:
            plate.opacity = 1
        if V < -V_max:
            plate.opacity = 1
            
        if (POI == ball1.pos):
            plate.opacity = 1
            plate.color = ball1.color
            
        else if (POI == ball2.pos):
            plate.opacity = 1
            plate.color = ball2.color
            
        else:
            plate.opacity = abs(V)/V_max
        