Web VPython 3.2

scene.background = vec(0.3,0.3,0.3)

k = 8.99e9
dx = 1
dy = 1

L = 10
N = 10

q1 = 1e-9
q2 = -1e-9

V_max = 15
sat_lev = 1

arrow_list = []

#code for coloring charges
if q1 > 0:
    c1 = vec(1,0,0)
else:
    c1 = vec(0,0.2,1)

if q2 > 0:
    c2 = vec(1,0,0)
else:
    c2 = vec(0,0.2,1)
    

rod = []
for y in arange(-5.5,5.5, L/N):
    ball = sphere()
    ball.pos = vec(-3,y*(L/N),0)
    ball.radius = 0.3
    ball.color = c1
    ball.q = q1/L
    rod.append(ball)

ball2 = sphere()
ball2.pos = vec(1.5,-1.5,0)
ball2.radius = 0.3
ball2.color = c2
ball2.q = q2

for x in arange(-5.5,5.5,1):
    for y in arange(-5.5,5.5,1):
        POI = vec(x,y,0)
        plate = box(pos=POI-vec(0,0,0.5), size=vec(dx,dy,0.1))
        
        E_1 = vec(0,0,0)
        V1 = 0
        
        #calculate E and V for rod
        for ball in rod:
            r1 = POI - ball.pos
            
            if (mag(r1) == 0):
                #db0
                E_field = vec(0,0,0)
                V = 0
            else:
                E_1 += k*ball.q*r1/mag(r1)**3
                V1 += k*ball.q/mag(r1)
                
            if (POI == ball.pos):
                plate.opacity = 1
                plate.color = ball.color
        
        #E and V for point charge
        r2 = POI - ball2.pos
        
        if (mag(r2) == 0):
            #db0
            E_field = vec(0,0,0)
            V = 0
        else:
            E_2 = k*ball2.q*r2/mag(r2)**3
            E_field = E_1 + E_2
            
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
            
        else if (POI == ball2.pos):
            plate.opacity = 1
            plate.color = ball2.color
            
        else:
            plate.opacity = abs(V)/V_max
            
        
        if mag(E_field) > sat_lev:
         E_field = hat(E_field) * sat_lev
        
        E_arrow = arrow()
        E_arrow.pos = POI
        E_arrow.axis = E_field
        E_arrow.color = color.white
        arrow_list.append(E_arrow)
            
            